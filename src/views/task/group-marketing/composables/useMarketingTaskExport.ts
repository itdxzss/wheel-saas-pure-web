import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createMarketingTaskExport,
  downloadMarketingTaskExport,
  getMarketingTaskExport,
  listMarketingTaskExportCountries,
  type CreateMarketingTaskExportRequest,
  type MarketingTaskExportCountry,
  type MarketingTaskExportFile,
  type MarketingTaskExportJob,
  type MarketingTaskExportMode
} from "@/api/marketing-task-export";
import type { MarketingTaskRow } from "@/api/marketing-task";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";

export interface MarketingTaskExportForm {
  mode: MarketingTaskExportMode;
  countryIso2s: string[];
}

export interface MarketingTaskExportDependencies {
  listCountries: () => Promise<MarketingTaskExportCountry[]>;
  createExport: (
    request: CreateMarketingTaskExportRequest
  ) => Promise<MarketingTaskExportJob>;
  getExport: (jobId: number) => Promise<MarketingTaskExportJob>;
  downloadExport: (jobId: number) => Promise<MarketingTaskExportFile>;
  saveFile: (filename: string, blob: Blob) => void;
}

export interface MarketingTaskExportState {
  countries: Ref<MarketingTaskExportCountry[]>;
  countriesLoading: Ref<boolean>;
  exportDialogOpen: Ref<boolean>;
  exporting: ComputedRef<boolean>;
  openExportDialog: () => Promise<void>;
  selectedTaskCount: ComputedRef<number>;
  submitExport: (form: MarketingTaskExportForm) => Promise<void>;
}

const EXPORT_POLL_INTERVAL_MS = 3000;
const MAX_POLL_FAILURES = 3;
const MAX_DOWNLOAD_ATTEMPTS = 3;
const NO_DATA_MESSAGE = "当前选择范围内暂无可导出数据。";
const EXPORT_FAILURE_MESSAGE = "导出失败，请稍后重试或联系技术人员。";

const defaultDependencies: MarketingTaskExportDependencies = {
  listCountries: listMarketingTaskExportCountries,
  createExport: createMarketingTaskExport,
  getExport: getMarketingTaskExport,
  downloadExport: downloadMarketingTaskExport,
  saveFile: downloadBlobFile
};

function normalizedIso2s(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map(value => value.trim().toUpperCase())
        .filter(value => /^[A-Z]{2}$/.test(value))
    )
  ).sort();
}

function isNoDataJob(job: MarketingTaskExportJob): boolean {
  return (
    job.errorMessage?.trim() === NO_DATA_MESSAGE ||
    job.errorMessage?.includes("暂无可导出数据") === true ||
    job.errorMessage?.includes("没有符合条件的成功进群数据") === true
  );
}

export function useMarketingTaskExport(
  selectedRows: Ref<MarketingTaskRow[]>,
  dependencies: MarketingTaskExportDependencies = defaultDependencies
): MarketingTaskExportState {
  const countries = ref<MarketingTaskExportCountry[]>([]);
  const countriesLoading = ref(false);
  const exportDialogOpen = ref(false);
  const submitting = ref(false);
  const activeJobId = ref<number | null>(null);
  const pendingTaskIds = ref<number[]>([]);
  const selectedTaskCount = computed(() => pendingTaskIds.value.length);
  const exporting = computed(
    () => submitting.value || activeJobId.value != null
  );
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pollInFlight = false;
  let pollFailureNotified = false;
  let consecutivePollFailures = 0;
  let downloadAttempts = 0;
  let disposed = false;

  function clearPollTimer(): void {
    if (pollTimer == null) return;
    clearInterval(pollTimer);
    pollTimer = null;
  }

  function finishTracking(): void {
    clearPollTimer();
    activeJobId.value = null;
    pollInFlight = false;
    pollFailureNotified = false;
    consecutivePollFailures = 0;
    downloadAttempts = 0;
  }

  function notifyFailedJob(job: MarketingTaskExportJob): void {
    finishTracking();
    if (isNoDataJob(job)) {
      ElMessage.warning(NO_DATA_MESSAGE);
      return;
    }
    ElMessage.error(job.errorMessage?.trim() || EXPORT_FAILURE_MESSAGE);
  }

  async function downloadCompletedJob(jobId: number): Promise<void> {
    clearPollTimer();
    downloadAttempts += 1;
    try {
      const file = await dependencies.downloadExport(jobId);
      if (disposed || activeJobId.value !== jobId) return;
      dependencies.saveFile(file.filename, file.blob);
      ElMessage.success("文件生成成功，已开始下载。");
      finishTracking();
    } catch (error) {
      if (disposed || activeJobId.value !== jobId) return;
      if (downloadAttempts < MAX_DOWNLOAD_ATTEMPTS) {
        ElMessage.warning("文件下载失败，正在自动重试。");
        startPolling();
        return;
      }
      ElMessage.error(apiErrorMessage(error, EXPORT_FAILURE_MESSAGE));
      finishTracking();
    }
  }

  async function handleJob(job: MarketingTaskExportJob): Promise<void> {
    if (activeJobId.value !== job.id) return;
    if (job.status === "PENDING" || job.status === "PROCESSING") return;
    if (job.status === "SUCCESS") {
      await downloadCompletedJob(job.id);
      return;
    }
    notifyFailedJob(job);
  }

  async function pollExportJob(): Promise<void> {
    const jobId = activeJobId.value;
    if (jobId == null || pollInFlight) return;
    pollInFlight = true;
    try {
      const job = await dependencies.getExport(jobId);
      if (disposed || activeJobId.value !== jobId) return;
      pollFailureNotified = false;
      consecutivePollFailures = 0;
      await handleJob(job);
    } catch (error) {
      if (disposed || activeJobId.value !== jobId) return;
      consecutivePollFailures += 1;
      if (consecutivePollFailures >= MAX_POLL_FAILURES) {
        ElMessage.error("导出状态连续查询失败，请重新发起导出。");
        finishTracking();
        return;
      }
      if (!pollFailureNotified && activeJobId.value === jobId) {
        ElMessage.error(
          apiErrorMessage(error, "导出状态查询失败，请稍后重试。")
        );
        pollFailureNotified = true;
      }
    } finally {
      pollInFlight = false;
    }
  }

  function startPolling(): void {
    if (disposed) return;
    clearPollTimer();
    pollTimer = setInterval(() => {
      void pollExportJob();
    }, EXPORT_POLL_INTERVAL_MS);
  }

  async function loadCountries(): Promise<void> {
    if (countries.value.length > 0 || countriesLoading.value) return;
    countriesLoading.value = true;
    try {
      const result = await dependencies.listCountries();
      if (disposed) return;
      countries.value = result
        .filter(item => /^[A-Z]{2}$/i.test(item.iso2?.trim()))
        .map(item => ({
          ...item,
          iso2: item.iso2.trim().toUpperCase(),
          nameZh: item.nameZh?.trim() ?? "",
          nameEn: item.nameEn?.trim() ?? "",
          phonePrefix: item.phonePrefix?.trim() ?? "",
          flag: item.flag?.trim() ?? ""
        }));
    } catch (error) {
      if (disposed) return;
      ElMessage.error(apiErrorMessage(error, "国家或地区加载失败"));
    } finally {
      countriesLoading.value = false;
    }
  }

  async function openExportDialog(): Promise<void> {
    if (exporting.value) {
      ElMessage.warning("数据正在生成，请勿重复点击导出。");
      return;
    }
    pendingTaskIds.value = Array.from(
      new Set(
        selectedRows.value
          .map(row => row.id)
          .filter(id => Number.isSafeInteger(id) && id > 0)
      )
    ).sort((left, right) => left - right);
    if (pendingTaskIds.value.length === 0) {
      ElMessage.warning("请先选择需要导出的营销任务。");
      return;
    }
    exportDialogOpen.value = true;
    await loadCountries();
  }

  async function submitExport(form: MarketingTaskExportForm): Promise<void> {
    if (exporting.value) {
      ElMessage.warning("数据正在生成，请勿重复点击导出。");
      return;
    }
    if (pendingTaskIds.value.length === 0) {
      ElMessage.warning("请先选择需要导出的营销任务。");
      return;
    }
    const countryIso2s =
      form.mode === "COUNTRY_ENTRY" ? normalizedIso2s(form.countryIso2s) : [];
    if (form.mode === "COUNTRY_ENTRY" && countryIso2s.length === 0) {
      ElMessage.warning("请至少选择一个国家或地区。");
      return;
    }

    submitting.value = true;
    try {
      const job = await dependencies.createExport({
        exportMode: form.mode,
        taskIds: [...pendingTaskIds.value],
        countryIso2s
      });
      if (disposed) return;
      if (!Number.isSafeInteger(job.id) || job.id <= 0) {
        throw new Error(EXPORT_FAILURE_MESSAGE);
      }
      exportDialogOpen.value = false;
      activeJobId.value = job.id;
      if (job.status === "PENDING" || job.status === "PROCESSING") {
        startPolling();
        ElMessage.warning("数据正在生成，请勿重复点击导出。");
      } else {
        await handleJob(job);
      }
    } catch (error) {
      if (disposed) return;
      ElMessage.error(apiErrorMessage(error, EXPORT_FAILURE_MESSAGE));
    } finally {
      submitting.value = false;
    }
  }

  onScopeDispose(() => {
    disposed = true;
    finishTracking();
  }, true);

  return {
    countries,
    countriesLoading,
    exportDialogOpen,
    exporting,
    openExportDialog,
    selectedTaskCount,
    submitExport
  };
}

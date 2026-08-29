import { computed, onScopeDispose, reactive, ref, watch, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createHyperlinkRecipientExport,
  downloadHyperlinkTaskExport,
  getHyperlinkTaskExport,
  listHyperlinkTaskRecipients,
  type HyperlinkRecipientExportRequest,
  type HyperlinkRecipientItem,
  type HyperlinkRecipientQuery,
  type HyperlinkTaskExportFile,
  type HyperlinkTaskExportJob,
  type PageResult
} from "@/api/hyperlink-task-detail";
import {
  listGroupCountryOptions,
  type IpCountryOption
} from "@/api/resource-ip";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import {
  applyRecipientFilters,
  defaultRecipientQuery,
  emptyRecipientFilters,
  isPermissionDenied,
  type RecipientFilters
} from "../domain/recipient-stats";

interface Dependencies {
  listRecipients: (
    taskId: number,
    query: HyperlinkRecipientQuery
  ) => Promise<PageResult<HyperlinkRecipientItem>>;
  listCountries: () => Promise<IpCountryOption[]>;
  createExport: (
    taskId: number,
    query: HyperlinkRecipientExportRequest
  ) => Promise<HyperlinkTaskExportJob>;
  getExport: (jobId: number) => Promise<HyperlinkTaskExportJob>;
  downloadExport: (jobId: number) => Promise<HyperlinkTaskExportFile>;
  saveFile: (filename: string, blob: Blob) => void;
}

const defaultDependencies: Dependencies = {
  listRecipients: listHyperlinkTaskRecipients,
  listCountries: listGroupCountryOptions,
  createExport: createHyperlinkRecipientExport,
  getExport: getHyperlinkTaskExport,
  downloadExport: downloadHyperlinkTaskExport,
  saveFile: downloadBlobFile
};

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_FAILURES = 3;

export function useHyperlinkRecipientStats(
  taskId: Ref<number | null>,
  dependencies: Dependencies = defaultDependencies
) {
  const filters = reactive<RecipientFilters>(emptyRecipientFilters());
  const query = ref<HyperlinkRecipientQuery>(defaultRecipientQuery());
  const rows = ref<HyperlinkRecipientItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const errorMessage = ref("");
  const permissionDenied = ref(false);
  const countries = ref<IpCountryOption[]>([]);
  const countriesLoading = ref(false);
  const exporting = ref(false);
  const activeJobId = ref<number | null>(null);
  let requestVersion = 0;
  let pollFailures = 0;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const page = computed(() => query.value.page);
  const pageSize = computed(() => query.value.pageSize);

  function clearPollTimer(): void {
    if (pollTimer == null) return;
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  function stopExportPolling(): void {
    clearPollTimer();
    activeJobId.value = null;
    pollFailures = 0;
    exporting.value = false;
  }

  async function loadCountries(): Promise<void> {
    if (countries.value.length > 0 || countriesLoading.value) return;
    countriesLoading.value = true;
    try {
      const result = await dependencies.listCountries();
      if (disposed) return;
      countries.value = result.filter(
        item => !item.virtual && Boolean(item.iso2)
      );
    } catch (error) {
      if (!disposed) {
        ElMessage.error(apiErrorMessage(error, "国家或地区选项加载失败"));
      }
    } finally {
      countriesLoading.value = false;
    }
  }

  async function loadRecipients(): Promise<void> {
    const currentTaskId = taskId.value;
    if (!currentTaskId || currentTaskId <= 0) {
      rows.value = [];
      total.value = 0;
      return;
    }
    const version = ++requestVersion;
    loading.value = true;
    errorMessage.value = "";
    permissionDenied.value = false;
    try {
      const result = await dependencies.listRecipients(
        currentTaskId,
        query.value
      );
      if (disposed || version !== requestVersion) return;
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      if (disposed || version !== requestVersion) return;
      rows.value = [];
      total.value = 0;
      permissionDenied.value = isPermissionDenied(error);
      errorMessage.value = permissionDenied.value
        ? "权限不足，无法查看收信人流水。"
        : apiErrorMessage(error, "收信人流水加载失败，请稍后重试。");
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  async function search(): Promise<void> {
    query.value = applyRecipientFilters(filters, query.value);
    await loadRecipients();
  }

  async function reset(): Promise<void> {
    Object.assign(filters, emptyRecipientFilters());
    query.value = defaultRecipientQuery();
    await loadRecipients();
  }

  async function refresh(): Promise<void> {
    await Promise.all([loadCountries(), loadRecipients()]);
  }

  async function changePage(value: number): Promise<void> {
    query.value = { ...query.value, page: value };
    await loadRecipients();
  }

  async function changePageSize(value: number): Promise<void> {
    query.value = {
      ...query.value,
      page: 1,
      pageSize: value as HyperlinkRecipientQuery["pageSize"]
    };
    await loadRecipients();
  }

  function appliedExportQuery(): HyperlinkRecipientExportRequest {
    const { page: _page, pageSize: _pageSize, ...exportQuery } = query.value;
    return exportQuery;
  }

  async function downloadCompletedJob(
    job: HyperlinkTaskExportJob
  ): Promise<void> {
    const file = await dependencies.downloadExport(job.id);
    if (disposed || activeJobId.value !== job.id) return;
    dependencies.saveFile(file.filename, file.blob);
    stopExportPolling();
    ElMessage.success("导出成功");
  }

  function schedulePoll(): void {
    clearPollTimer();
    pollTimer = setTimeout(() => void pollExport(), POLL_INTERVAL_MS);
  }

  async function handleJob(job: HyperlinkTaskExportJob): Promise<void> {
    if (activeJobId.value !== job.id) return;
    if (job.status === "PENDING" || job.status === "PROCESSING") {
      schedulePoll();
      return;
    }
    if (job.status === "SUCCESS") {
      try {
        await downloadCompletedJob(job);
      } catch (error) {
        stopExportPolling();
        ElMessage.error(
          apiErrorMessage(error, "导出文件下载失败，请重新导出。")
        );
      }
      return;
    }
    stopExportPolling();
    if (job.status === "EXPIRED") {
      ElMessage.warning("导出文件已过期，请重新导出。");
      return;
    }
    ElMessage.error(job.errorMessage?.trim() || "导出失败，请重新操作。");
  }

  async function pollExport(): Promise<void> {
    const jobId = activeJobId.value;
    if (jobId == null) return;
    try {
      const job = await dependencies.getExport(jobId);
      if (disposed || activeJobId.value !== jobId) return;
      pollFailures = 0;
      await handleJob(job);
    } catch (error) {
      if (disposed || activeJobId.value !== jobId) return;
      pollFailures += 1;
      if (pollFailures >= MAX_POLL_FAILURES) {
        stopExportPolling();
        ElMessage.error(
          apiErrorMessage(error, "导出状态查询失败，请重新发起导出。")
        );
        return;
      }
      schedulePoll();
    }
  }

  async function exportRecipients(): Promise<void> {
    const currentTaskId = taskId.value;
    if (!currentTaskId || exporting.value) return;
    exporting.value = true;
    try {
      const job = await dependencies.createExport(
        currentTaskId,
        appliedExportQuery()
      );
      if (!Number.isSafeInteger(job.id) || job.id <= 0) {
        throw new Error("导出作业创建失败");
      }
      activeJobId.value = job.id;
      ElMessage.success("导出任务已创建");
      await handleJob(job);
    } catch (error) {
      stopExportPolling();
      ElMessage.error(apiErrorMessage(error, "导出失败，请重新操作。"));
    }
  }

  watch(
    taskId,
    () => {
      requestVersion += 1;
      stopExportPolling();
      Object.assign(filters, emptyRecipientFilters());
      query.value = defaultRecipientQuery();
      rows.value = [];
      total.value = 0;
      errorMessage.value = "";
      permissionDenied.value = false;
      if (taskId.value) void refresh();
    },
    { immediate: true }
  );

  onScopeDispose(() => {
    disposed = true;
    requestVersion += 1;
    stopExportPolling();
  });

  return {
    filters,
    query,
    rows,
    total,
    page,
    pageSize,
    loading,
    errorMessage,
    permissionDenied,
    countries,
    countriesLoading,
    exporting,
    loadRecipients,
    search,
    reset,
    refresh,
    changePage,
    changePageSize,
    exportRecipients,
    stopExportPolling
  };
}

import { computed, onScopeDispose, ref, type ComputedRef } from "vue";
import { ElMessage } from "element-plus";
import {
  downloadHyperlinkTaskExportJob,
  getHyperlinkTaskExportJob,
  type HyperlinkTaskExportFile,
  type HyperlinkTaskExportJob
} from "@/api/hyperlink-task-account-stats";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";

export interface HyperlinkExportJobDependencies {
  getJob: (jobId: number) => Promise<HyperlinkTaskExportJob>;
  downloadJob: (jobId: number) => Promise<HyperlinkTaskExportFile>;
  saveFile: (filename: string, blob: Blob) => void;
  setTimer: (
    callback: () => void,
    delay: number
  ) => ReturnType<typeof setTimeout>;
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
}

export interface HyperlinkExportJobState {
  exporting: ComputedRef<boolean>;
  run: (create: () => Promise<HyperlinkTaskExportJob>) => Promise<void>;
}

const POLL_DELAY_MS = 3000;
const MAX_POLL_FAILURES = 3;

const defaultDependencies: HyperlinkExportJobDependencies = {
  getJob: getHyperlinkTaskExportJob,
  downloadJob: downloadHyperlinkTaskExportJob,
  saveFile: downloadBlobFile,
  setTimer: (callback, delay) => setTimeout(callback, delay),
  clearTimer: timer => clearTimeout(timer)
};

export function useHyperlinkExportJob(
  dependencies: HyperlinkExportJobDependencies = defaultDependencies
): HyperlinkExportJobState {
  const creating = ref(false);
  const activeJobId = ref<number | null>(null);
  const exporting = computed(() => creating.value || activeJobId.value != null);
  let pollFailures = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function stop(): void {
    if (timer != null) dependencies.clearTimer(timer);
    timer = null;
    activeJobId.value = null;
    pollFailures = 0;
  }

  function schedule(): void {
    if (disposed || activeJobId.value == null) return;
    timer = dependencies.setTimer(() => void poll(), POLL_DELAY_MS);
  }

  async function finish(job: HyperlinkTaskExportJob): Promise<void> {
    if (job.status === "PENDING" || job.status === "PROCESSING") {
      schedule();
      return;
    }
    if (job.status !== "SUCCESS") {
      stop();
      ElMessage.error(job.errorMessage?.trim() || "导出失败，请重新操作");
      return;
    }
    const file = await dependencies.downloadJob(job.id);
    if (disposed || activeJobId.value !== job.id) return;
    dependencies.saveFile(file.filename, file.blob);
    stop();
    ElMessage.success(`导出成功，共 ${job.rowCount} 行`);
  }

  async function poll(): Promise<void> {
    const jobId = activeJobId.value;
    if (jobId == null) return;
    try {
      const job = await dependencies.getJob(jobId);
      if (disposed || activeJobId.value !== jobId) return;
      pollFailures = 0;
      await finish(job);
    } catch (error) {
      if (disposed || activeJobId.value !== jobId) return;
      pollFailures += 1;
      if (pollFailures >= MAX_POLL_FAILURES) {
        stop();
        ElMessage.error(
          apiErrorMessage(error, "导出状态查询失败，请重新发起导出")
        );
      } else {
        schedule();
      }
    }
  }

  async function run(
    create: () => Promise<HyperlinkTaskExportJob>
  ): Promise<void> {
    if (exporting.value) {
      ElMessage.warning("数据正在生成，请勿重复点击导出");
      return;
    }
    creating.value = true;
    try {
      const job = await create();
      if (disposed) return;
      if (!Number.isSafeInteger(job.id) || job.id <= 0) {
        throw new Error("导出作业无效，请重新操作");
      }
      activeJobId.value = job.id;
      ElMessage.info("导出任务已创建，正在生成 CSV");
      await finish(job);
    } catch (error) {
      if (!disposed)
        ElMessage.error(apiErrorMessage(error, "导出失败，请稍后重试"));
      stop();
    } finally {
      creating.value = false;
    }
  }

  onScopeDispose(() => {
    disposed = true;
    stop();
  }, true);

  return { exporting, run };
}

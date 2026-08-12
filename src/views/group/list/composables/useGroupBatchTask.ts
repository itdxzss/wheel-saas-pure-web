import { ref, type Ref } from "vue";
import { getGroupBatchTask, type GroupBatchTaskDetail } from "@/api/group";
import { apiErrorMessage } from "@/utils/api-error";

const POLL_DELAY_MS = 2000;

export interface BatchTaskScheduler {
  /** 排一次延时回调，返回取消函数。 */
  schedule(callback: () => void, delayMs: number): () => void;
}

const browserScheduler: BatchTaskScheduler = {
  schedule(callback, delayMs) {
    const timer = setTimeout(callback, delayMs);
    return () => clearTimeout(timer);
  }
};

export interface GroupBatchTaskOptions {
  scheduler?: BatchTaskScheduler;
  fetchTask?: (taskId: number) => Promise<GroupBatchTaskDetail>;
}

export interface GroupBatchTaskState {
  open: Ref<boolean>;
  detail: Ref<GroupBatchTaskDetail | null>;
  error: Ref<string>;
  track: (taskId: number) => Promise<void>;
  close: () => void;
}

/**
 * 批量任务进度弹窗的轮询状态。
 *
 * <p>按 PRD P-06，运行中关闭弹窗即销毁轮询并丢弃 taskId，不提供重新打开入口；
 * 后台任务本身不受影响，继续跑完。</p>
 */
export function useGroupBatchTask(
  options: GroupBatchTaskOptions = {}
): GroupBatchTaskState {
  const scheduler = options.scheduler ?? browserScheduler;
  const fetchTask = options.fetchTask ?? getGroupBatchTask;

  const open = ref(false);
  const detail = ref<GroupBatchTaskDetail | null>(null);
  const error = ref("");
  let cancelPoll: (() => void) | null = null;
  // 每次 track/close 递增：关闭后到达的旧响应会因会话号过期被丢弃，
  // 否则慢响应会把已经关掉的弹窗重新点亮。
  let sessionId = 0;

  function clearPoll(): void {
    if (!cancelPoll) return;
    cancelPoll();
    cancelPoll = null;
  }

  function close(): void {
    sessionId += 1;
    clearPoll();
    open.value = false;
    detail.value = null;
    error.value = "";
  }

  async function track(taskId: number): Promise<void> {
    sessionId += 1;
    clearPoll();
    open.value = true;
    detail.value = null;
    error.value = "";
    await load(taskId, sessionId);
  }

  async function load(taskId: number, activeSessionId: number): Promise<void> {
    try {
      const result = await fetchTask(taskId);
      if (activeSessionId !== sessionId) return;
      detail.value = result;
      if (!result.terminal) {
        schedulePoll(taskId, activeSessionId);
      }
    } catch (caught) {
      if (activeSessionId !== sessionId) return;
      error.value = apiErrorMessage(caught, "任务进度获取失败");
    }
  }

  function schedulePoll(taskId: number, activeSessionId: number): void {
    clearPoll();
    cancelPoll = scheduler.schedule(() => {
      cancelPoll = null;
      void load(taskId, activeSessionId);
    }, POLL_DELAY_MS);
  }

  return { open, detail, error, track, close };
}

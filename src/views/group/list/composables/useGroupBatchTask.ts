import { ref, type Ref } from "vue";
import {
  cancelGroupBatchTask,
  getGroupBatchTask,
  type GroupBatchTaskDetail
} from "@/api/group";
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
  cancelTask?: (taskId: number) => Promise<number>;
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
 * <p>按 PRD P-06，运行中关闭弹窗即销毁轮询并丢弃 taskId，不提供重新打开入口。
 * 既然明细再也不会展示（下次开弹窗是新任务），关闭时顺带请求后端取消剩余待执行项，
 * 避免上千个群继续白跑协议调用；已终结的项与已回填的数据都不受影响。</p>
 */
export function useGroupBatchTask(
  options: GroupBatchTaskOptions = {}
): GroupBatchTaskState {
  const scheduler = options.scheduler ?? browserScheduler;
  const fetchTask = options.fetchTask ?? getGroupBatchTask;
  const cancelTask = options.cancelTask ?? cancelGroupBatchTask;

  const open = ref(false);
  const detail = ref<GroupBatchTaskDetail | null>(null);
  const error = ref("");
  let cancelPoll: (() => void) | null = null;
  // 关闭时要用它请求取消；关闭后立即清空，重复关闭不会重复取消。
  let trackedTaskId: number | null = null;
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
    // 已终结的任务没有待执行项，不必再打一次取消请求。
    const taskIdToCancel =
      detail.value?.terminal === true ? null : trackedTaskId;
    trackedTaskId = null;
    open.value = false;
    detail.value = null;
    error.value = "";
    if (taskIdToCancel === null) return;
    // 取消失败不打扰用户：最坏情况只是后台多跑一会儿。
    void cancelTask(taskIdToCancel).catch(() => undefined);
  }

  async function track(taskId: number): Promise<void> {
    sessionId += 1;
    clearPoll();
    trackedTaskId = taskId;
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

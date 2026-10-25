import {
  getCurrentInstance,
  onActivated,
  onDeactivated,
  onScopeDispose,
  ref,
  type Ref
} from "vue";

/** 拉群任务列表与明细共用的自动刷新间隔。 */
export const PULL_TASK_AUTO_REFRESH_INTERVAL_MS = 10_000;

export interface PullTaskAutoRefreshOptions {
  /** 当前视图是否在展示，例如明细抽屉是否打开。 */
  active: () => boolean;
  /** 上一次请求尚未返回；为 true 时跳过本轮，避免请求叠加。 */
  busy: () => boolean;
  /** 触发一次静默刷新。 */
  refresh: () => void;
}

export interface PullTaskAutoRefreshState {
  /** 自动刷新开关，默认开启。 */
  automatic: Ref<boolean>;
}

function documentVisible(): boolean {
  return (
    typeof document === "undefined" || document.visibilityState === "visible"
  );
}

/**
 * 每 10 秒触发一次静默刷新，可关闭。浏览器标签页隐藏或 keep-alive 失活时停表；
 * 标签页重新可见时立即刷新一次再重新计时。作用域销毁（组件卸载）时清理计时器和监听。
 */
export function usePullTaskAutoRefresh(
  options: PullTaskAutoRefreshOptions
): PullTaskAutoRefreshState {
  const automatic = ref(true);
  let timer: ReturnType<typeof setInterval> | undefined;
  let keptAlive = true;

  function tick(): void {
    if (
      keptAlive &&
      automatic.value &&
      options.active() &&
      !options.busy() &&
      documentVisible()
    ) {
      options.refresh();
    }
  }

  function stop(): void {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  }

  function start(): void {
    stop();
    if (keptAlive && documentVisible()) {
      timer = setInterval(tick, PULL_TASK_AUTO_REFRESH_INTERVAL_MS);
    }
  }

  function visibilityChanged(): void {
    if (!documentVisible()) {
      stop();
      return;
    }
    tick();
    start();
  }

  start();
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", visibilityChanged);
  }
  if (getCurrentInstance()) {
    onActivated(() => {
      keptAlive = true;
      start();
    });
    onDeactivated(() => {
      keptAlive = false;
      stop();
    });
  }
  onScopeDispose(() => {
    stop();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", visibilityChanged);
    }
  });

  return { automatic };
}

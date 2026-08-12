import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useGroupBatchTask } from "./useGroupBatchTask";

/**
 * 本地复刻 GroupBatchTaskDetail 的最小形状。
 *
 * 不从 `@/api/group` 引入：那条 import 链会走到 `@/api/armada` 并间接加载 nprogress 的
 * CSS，Node 测试 runner 无法解析非 JS 资源。契约一致性由 typecheck 在真实代码里保证。
 */
interface TaskDetail {
  taskId: number;
  taskType: "REFRESH_LINK" | "REFRESH_INFO";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  terminal: boolean;
  createdAt: number | null;
  completedAt: number | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  items: unknown[];
}

function detail(overrides: Partial<TaskDetail> = {}): TaskDetail {
  return {
    taskId: 900,
    taskType: "REFRESH_LINK",
    status: "RUNNING",
    terminal: false,
    createdAt: 1000,
    completedAt: null,
    totalCount: 3,
    successCount: 1,
    failedCount: 0,
    items: [],
    ...overrides
  };
}

/** 手控调度器：把定时器变成显式 tick，测试不用真等 2 秒。 */
function manualScheduler() {
  const queue: Array<() => void> = [];
  return {
    scheduler: {
      schedule(callback: () => void) {
        queue.push(callback);
        return () => {
          const index = queue.indexOf(callback);
          if (index >= 0) queue.splice(index, 1);
        };
      }
    },
    pending: () => queue.length,
    async tick() {
      const next = queue.shift();
      if (next) await next();
    }
  };
}

function stubFetch(responses: TaskDetail[]) {
  let calls = 0;
  const fetchTask = async () => {
    const response = responses[Math.min(calls, responses.length - 1)];
    calls += 1;
    return response;
  };
  return { fetchTask, callCount: () => calls };
}

describe("useGroupBatchTask", () => {
  it("keeps polling while running and stops on the terminal flag", async () => {
    const clock = manualScheduler();
    const stub = stubFetch([
      detail({ successCount: 1 }),
      detail({ status: "COMPLETED", terminal: true, successCount: 3 })
    ]);
    const state = useGroupBatchTask({
      scheduler: clock.scheduler,
      fetchTask: stub.fetchTask as never
    });

    await state.track(900);
    assert.equal(state.detail.value?.successCount, 1);
    assert.equal(clock.pending(), 1);

    await clock.tick();
    assert.equal(state.detail.value?.successCount, 3);
    // 终态后不得再排下一次轮询，否则弹窗关掉了请求还在跑。
    assert.equal(clock.pending(), 0);
    assert.equal(stub.callCount(), 2);
  });

  it("drops the task and cancels polling when the dialog closes", async () => {
    const clock = manualScheduler();
    const stub = stubFetch([detail()]);
    const state = useGroupBatchTask({
      scheduler: clock.scheduler,
      fetchTask: stub.fetchTask as never
    });

    await state.track(900);
    assert.equal(clock.pending(), 1);

    state.close();

    // P-06：运行中关闭弹窗后不可重新打开，taskId 一并丢弃。
    assert.equal(clock.pending(), 0);
    assert.equal(state.detail.value, null);
    assert.equal(state.open.value, false);
  });

  it("ignores a response that lands after the dialog was closed", async () => {
    const clock = manualScheduler();
    let release: (value: TaskDetail) => void = () => {};
    const fetchTask = () =>
      new Promise<TaskDetail>(resolve => {
        release = resolve;
      });
    const state = useGroupBatchTask({
      scheduler: clock.scheduler,
      fetchTask: fetchTask as never
    });

    const tracking = state.track(900);
    state.close();
    release(detail());
    await tracking;

    // 关闭后到达的旧响应不得把弹窗重新点亮，也不得重启轮询。
    assert.equal(state.detail.value, null);
    assert.equal(state.open.value, false);
    assert.equal(clock.pending(), 0);
  });
});

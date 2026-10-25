import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, it } from "node:test";
import { watch } from "vue";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type { PullTaskRow } from "@/api/pull-task";
import { usePullTaskPage } from "./usePullTaskPage";

function task(id: number, status: PullTaskRow["status"]): PullTaskRow {
  return { id, taskName: `任务${id}`, status } as PullTaskRow;
}

function page(list: PullTaskRow[], total = list.length) {
  return { list, total, page: 1, pageSize: 10 };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

function lastListParams(): Record<string, unknown> {
  const call = armadaCalls().at(-1);
  assert.equal(call?.url, "/api/pull-tasks");
  return (call?.opts as { params: Record<string, unknown> }).params;
}

async function loadedPage() {
  resetArmadaMockQueue([page([task(1, "EXECUTING"), task(2, "WAIT_START")])]);
  const state = usePullTaskPage();
  state.searchForm.status = "EXECUTING";
  state.page.value = 2;
  await state.refreshTasks();
  return state;
}

describe("pull task list auto refresh", () => {
  beforeEach(() => {
    resetElementPlusMock();
  });

  it("updates rows in place with the applied query, keeping selection and never showing the loading mask", async () => {
    const state = await loadedPage();
    const rowsInstance = state.rows.value;
    state.onSelectionChange([state.rows.value[1]]);
    // 用户输入了新条件但还没点查询，自动刷新不能抢先应用。
    state.searchForm.keyword = "尚未查询";
    const loadingStates: boolean[] = [];
    const stopWatch = watch(state.loading, value => loadingStates.push(value), {
      flush: "sync"
    });
    resetArmadaMockQueue([page([task(1, "COMPLETED"), task(2, "WAIT_START")])]);

    await state.autoRefreshTasks();
    stopWatch();

    assert.equal(lastListParams().status, "EXECUTING");
    assert.equal(lastListParams().page, 2);
    assert.equal(lastListParams().keyword, undefined);
    assert.equal(state.searchForm.keyword, "尚未查询");
    assert.equal(state.rows.value, rowsInstance);
    assert.equal(state.rows.value[0].status, "COMPLETED");
    assert.equal(state.selectedCount.value, 1);
    assert.deepEqual(loadingStates, []);
    assert.ok(state.listRefreshedAt.value);
    assert.equal(state.listRefreshError.value, "");
  });

  it("skips a round while the previous list request has not returned", async () => {
    const state = await loadedPage();
    const pending = deferred<ReturnType<typeof page>>();
    resetArmadaMockQueue([pending.promise]);

    const first = state.autoRefreshTasks();
    assert.equal(state.listRefreshing.value, true);
    assert.equal(state.loading.value, false);
    await state.autoRefreshTasks();
    assert.equal(armadaCalls().length, 1);

    pending.resolve(page([task(1, "EXECUTING")]));
    await first;
    assert.equal(state.listRefreshing.value, false);
  });

  it("keeps the current rows and only marks data as stale when a silent refresh fails", async () => {
    const state = await loadedPage();
    state.onSelectionChange([state.rows.value[0]]);
    const refreshedAt = state.listRefreshedAt.value;
    resetElementPlusMock();
    resetArmadaMockFailure(new Error("暂不可用"));

    await state.autoRefreshTasks();

    assert.deepEqual(
      state.rows.value.map(row => row.id),
      [1, 2]
    );
    assert.equal(state.total.value, 2);
    assert.equal(state.selectedCount.value, 1);
    assert.equal(state.listRefreshedAt.value, refreshedAt);
    assert.match(state.listRefreshError.value, /暂不可用/);
    assert.deepEqual(elementPlusCalls(), []);

    resetArmadaMockQueue([page([task(1, "EXECUTING")])]);
    await state.autoRefreshTasks();
    assert.equal(state.listRefreshError.value, "");
  });

  it("lets a manual query win over a slower silent refresh", async () => {
    const state = await loadedPage();
    const stale = deferred<ReturnType<typeof page>>();
    resetArmadaMockQueue([stale.promise]);
    const silent = state.autoRefreshTasks();

    state.searchForm.status = "";
    resetArmadaMockQueue([page([task(9, "WAIT_START")])]);
    await state.refreshTasks();
    stale.resolve(page([task(1, "EXECUTING"), task(2, "WAIT_START")]));
    await silent;

    assert.deepEqual(
      state.rows.value.map(row => row.id),
      [9]
    );
    assert.equal(state.loading.value, false);
    assert.equal(state.listRefreshing.value, false);
  });

  it("still clears selection and reports errors on a manual refresh", async () => {
    const state = await loadedPage();
    state.onSelectionChange([state.rows.value[0]]);
    resetElementPlusMock();
    resetArmadaMockFailure(new Error("暂不可用"));

    await state.refreshTasks();

    assert.equal(state.selectedCount.value, 0);
    assert.deepEqual(state.rows.value, []);
    assert.equal(elementPlusCalls()[0]?.type, "error");
  });

  it("wires the list page to the shared observation refresh bar", () => {
    const read = (path: string) =>
      readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
    const index = read("../index.vue");
    const bar = read("../components/PullTaskObservationRefresh.vue");

    assert.match(
      index,
      /<PullTaskObservationRefresh[\s\S]*?:loading="listRefreshing"[\s\S]*?@auto-refresh="autoRefreshTasks"/
    );
    assert.match(bar, /usePullTaskAutoRefresh\(/);
    assert.doesNotMatch(bar, /setInterval/);
  });
});

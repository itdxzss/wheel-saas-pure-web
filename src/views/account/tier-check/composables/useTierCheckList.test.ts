import assert from "node:assert/strict";
import { test } from "node:test";
import { effectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import { useTierCheckList } from "./useTierCheckList";

test("last search wins and pagination/query fields match backend", async () => {
  const scope = effectScope();
  const state = scope.run(() => useTierCheckList(() => {}))!;
  try {
    let old!: (value: object) => void;
    resetArmadaMockQueue([
      new Promise(r => {
        old = r;
      }),
      { list: [{ id: 2 }], total: 1 }
    ]);
    const first = state.refreshTasks();
    state.searchForm.value = { keyword: " fixture ", mode: 2, status: 3 };
    state.page.value = 2;
    await state.refreshTasks();
    old({ list: [{ id: 1 }], total: 10 });
    await first;
    assert.equal(state.rows.value[0].id, 2);
    assert.equal(state.total.value, 1);
    assert.deepEqual(armadaCalls()[1].opts, {
      params: { page: 2, pageSize: 10, keyword: "fixture", mode: 2, status: 3 }
    });
  } finally {
    scope.stop();
  }
});
test("load failures clear stale rows and produce visible error", async () => {
  const errors: string[] = [];
  const scope = effectScope();
  const state = scope.run(() => useTierCheckList(e => errors.push(e)))!;
  try {
    resetArmadaMockFailure(new Error("fixture failed"));
    await state.refreshTasks();
    assert.deepEqual(state.rows.value, []);
    assert.equal(state.loading.value, false);
    assert.match(errors[0], /fixture failed/);
  } finally {
    scope.stop();
  }
});

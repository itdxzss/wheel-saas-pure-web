import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import { usePullTaskPage } from "./usePullTaskPage";
import type { PullTaskRow } from "@/api/pull-task";

describe("group list observation refresh", () => {
  const task = {
    id: 7,
    taskType: "STANDARD",
    mode: "NORMAL_LINK"
  } as PullTaskRow;
  const detail = { id: 7, taskName: "t", status: "EXECUTING", summary: null };
  const row = {
    executionId: 19,
    executionStatus: 2,
    stage: 6,
    cumulativeAssignedPullerCount: 6,
    pullers: { currentCount: 0, plannedCount: 2, missingCount: 2 },
    observation: { observedAt: 5000, label: "等待结果" }
  };

  it("retains server observation independently of business state and preserves stale data on errors", async () => {
    resetArmadaMockQueue([detail, { list: [row], total: 1 }]);
    const state = usePullTaskPage();
    await state.openDetailDrawer(task);
    assert.equal(state.detailGroupRows.value[0].status, "RUNNING");
    assert.equal(state.detailGroupRows.value[0].stage, 6);
    assert.equal(
      state.detailGroupRows.value[0].cumulativeAssignedPullerCount,
      6
    );
    assert.deepEqual(state.detailGroupRows.value[0].pullers, row.pullers);
    assert.equal(state.detailGroupRows.value[0].observation.label, "等待结果");
    assert.equal(state.detailRefreshedAt.value, 5000);
    resetArmadaMockFailure(new Error("暂不可用"));
    await state.refreshDetailGroups(true);
    assert.equal(state.detailGroupRows.value[0].id, 19);
    assert.equal(
      state.detailGroupRows.value[0].cumulativeAssignedPullerCount,
      6
    );
    assert.equal(state.detailRefreshedAt.value, 5000);
    assert.ok(state.detailRefreshError.value);
    assert.ok(armadaCalls().every(call => call.method === "get"));
  });

  it("preserves zero and unavailable cumulative allocation counts without fetching each execution detail", async () => {
    const { cumulativeAssignedPullerCount: _count, ...legacyRow } = row;
    const rows = [
      { ...row, cumulativeAssignedPullerCount: 0 },
      { ...row, executionId: 20, cumulativeAssignedPullerCount: null },
      { ...legacyRow, executionId: 21 }
    ];
    resetArmadaMockQueue([detail, { list: rows, total: rows.length }]);
    const state = usePullTaskPage();
    await state.openDetailDrawer(task);

    assert.deepEqual(
      state.detailGroupRows.value.map(
        item => item.cumulativeAssignedPullerCount
      ),
      [0, null, undefined]
    );
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard/7", "/api/pull-tasks/standard/7/executions"]
    );
  });

  it("does not silently apply a filter while the operator is editing it", async () => {
    resetArmadaMockQueue([detail, { list: [row], total: 1 }]);
    const state = usePullTaskPage();
    await state.openDetailDrawer(task);
    state.detailSearchForm.keyword = "尚未查询";
    resetArmadaMockQueue([]);
    await state.refreshDetailGroups(true);
    assert.deepEqual(armadaCalls(), []);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type { MarketingTaskRow } from "@/api/marketing-task";
import { useMarketingTaskRestart } from "./useMarketingTaskRestart";

const HOUR_MS = 60 * 60 * 1000;

function endedTask(
  overrides: Partial<MarketingTaskRow> = {}
): MarketingTaskRow {
  return {
    id: 42,
    taskName: "已结束任务",
    accountGroupId: 8,
    accountGroupName: "北美账号",
    marketingTemplateId: 18,
    marketingTemplateName: "活动模板",
    status: 7,
    selectedAccountCount: 1,
    targetGroupCount: 2,
    targetPairCount: 2,
    sentMessageCount: 4,
    failedMessageCount: 1,
    sendPerRound: 1,
    sendIntervalSeconds: 30,
    onlineCheckEnabled: true,
    abnormalGroupSkipped: true,
    autoRetryEnabled: false,
    taskStartAt: 1_000,
    taskEndAt: 1_000 + 2 * HOUR_MS,
    ...overrides
  };
}

describe("group marketing task restart state", () => {
  it("defaults to now plus the original task duration and submits the new window", async () => {
    const originalNow = Date.now;
    Date.now = () => 4_102_444_800_000;
    resetElementPlusMock();
    resetArmadaMock({ ...endedTask(), status: 1 });
    let refreshCount = 0;
    try {
      const state = useMarketingTaskRestart(async () => {
        refreshCount += 1;
      });

      state.openRestartDialog(endedTask());

      assert.equal(state.restartForm.value.taskStartAt, "4102444800000");
      assert.equal(state.restartForm.value.taskEndAt, "4102452000000");
      await state.submitRestart();

      const calls = armadaCalls();
      assert.equal(calls.length, 1);
      assert.equal(calls[0].method, "post");
      assert.equal(calls[0].url, "/api/marketing-tasks/42/restart");
      assert.deepEqual((calls[0].opts as { data: unknown }).data, {
        taskStartAt: 4_102_444_800_000,
        taskEndAt: 4_102_452_000_000
      });
      assert.equal(refreshCount, 1);
      assert.equal(state.restartDialogOpen.value, false);
      assert.deepEqual(elementPlusCalls(), [
        { type: "success", text: "营销任务已重新启动" }
      ]);
    } finally {
      Date.now = originalNow;
    }
  });

  it("falls back to twenty four hours when the old task window is invalid", () => {
    const originalNow = Date.now;
    Date.now = () => 4_102_444_800_000;
    try {
      const state = useMarketingTaskRestart(async () => undefined);

      state.openRestartDialog(
        endedTask({ taskStartAt: 2_000, taskEndAt: 1_000 })
      );

      assert.equal(
        Number(state.restartForm.value.taskEndAt) -
          Number(state.restartForm.value.taskStartAt),
        24 * HOUR_MS
      );
    } finally {
      Date.now = originalNow;
    }
  });

  it("rejects an end time that is not later than the start time", async () => {
    resetArmadaMock(endedTask());
    resetElementPlusMock();
    const state = useMarketingTaskRestart(async () => undefined);
    state.openRestartDialog(endedTask());
    state.restartForm.value.taskEndAt = state.restartForm.value.taskStartAt;

    await state.submitRestart();

    assert.deepEqual(armadaCalls(), []);
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "任务结束时间必须晚于任务开始时间" }
    ]);
  });

  it("does not replace the active task while a restart request is pending", async () => {
    let resolveRequest: ((value: MarketingTaskRow) => void) | undefined;
    resetArmadaMock(
      new Promise<MarketingTaskRow>(resolve => {
        resolveRequest = resolve;
      })
    );
    const state = useMarketingTaskRestart(async () => undefined);
    state.openRestartDialog(endedTask());

    const submitting = state.submitRestart();
    state.openRestartDialog(endedTask({ id: 43, taskName: "另一条任务" }));

    assert.equal(state.restartSubmitting.value, true);
    assert.equal(state.activeRestartTask.value?.id, 42);
    resolveRequest?.(endedTask({ status: 1 }));
    await submitting;
  });
});

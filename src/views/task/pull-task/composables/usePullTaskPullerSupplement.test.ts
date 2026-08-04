import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type { PullTaskPullerSupplementOptions } from "@/api/pull-task";
import { usePullTaskPullerSupplement } from "./usePullTaskPullerSupplement";

function options(
  overrides: Partial<PullTaskPullerSupplementOptions> = {}
): PullTaskPullerSupplementOptions {
  return {
    currentPullerCount: 0,
    requiredPullerCount: 2,
    missingPullerCount: 2,
    pullerGroupId: 12,
    managerInviteAvailable: true,
    currentPullers: [],
    candidates: [
      { accountId: 901, accountPhone: "8613900000901" },
      { accountId: 902, accountPhone: "8613900000902" }
    ],
    ...overrides
  };
}

describe("normal-link puller supplement state", () => {
  it("loads the frozen group and keeps remaining target data fixed", async () => {
    resetArmadaMockQueue([options()]);
    resetElementPlusMock();
    const state = usePullTaskPullerSupplement({
      onSubmitted: async () => undefined
    });

    await state.open(7, 19);

    assert.equal(state.visible.value, true);
    assert.equal(state.form.accountGroupId, 12);
    assert.equal(state.form.supplementCount, 2);
    assert.equal(state.form.selectionMode, 1);
    assert.equal(state.form.entryMode, 1);
    assert.equal(state.form.continueRemainingData, true);
    assert.deepEqual(armadaCalls()[0], {
      method: "get",
      url: "/api/pull-tasks/standard/7/executions/19/puller-supplement/options",
      opts: { params: { accountGroupId: undefined } }
    });
  });

  it("reloads candidates and clears manual selection after group change", async () => {
    resetArmadaMockQueue([options(), options({ pullerGroupId: 13 })]);
    resetElementPlusMock();
    const state = usePullTaskPullerSupplement({
      onSubmitted: async () => undefined
    });
    await state.open(7, 19);
    state.form.selectionMode = 2;
    state.form.accountIds = [901, 902];

    await state.changeAccountGroup(13);

    assert.equal(state.form.accountGroupId, 13);
    assert.deepEqual(state.form.accountIds, []);
    assert.deepEqual(armadaCalls()[1]?.opts, {
      params: { accountGroupId: 13 }
    });
  });

  it("requires exactly the requested accounts in manual mode", async () => {
    resetArmadaMockQueue([options()]);
    resetElementPlusMock();
    const state = usePullTaskPullerSupplement({
      onSubmitted: async () => undefined
    });
    await state.open(7, 19);
    state.form.selectionMode = 2;
    state.form.accountIds = [901];

    await state.submit();

    assert.equal(armadaCalls().length, 1);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择 2 个候选拉手账号");
  });

  it("submits the manual manager-invite combination and refreshes rows", async () => {
    resetArmadaMockQueue([options(), {}]);
    resetElementPlusMock();
    let refreshes = 0;
    const state = usePullTaskPullerSupplement({
      onSubmitted: async () => {
        refreshes += 1;
      }
    });
    await state.open(7, 19);
    state.form.selectionMode = 2;
    state.form.entryMode = 2;
    state.form.accountIds = [901, 902];

    await state.submit();

    assert.deepEqual(armadaCalls()[1], {
      method: "post",
      url: "/api/pull-tasks/standard/7/executions/19/puller-supplement",
      opts: {
        data: {
          accountGroupId: 12,
          supplementCount: 2,
          selectionMode: 2,
          entryMode: 2,
          accountIds: [901, 902]
        }
      }
    });
    assert.equal(refreshes, 1);
    assert.equal(state.visible.value, false);
  });
});

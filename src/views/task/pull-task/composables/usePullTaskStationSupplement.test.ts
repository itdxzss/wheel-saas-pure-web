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
import type { PullTaskStationSupplementOptions } from "@/api/pull-task";
import { usePullTaskStationSupplement } from "./usePullTaskStationSupplement";

function options(): PullTaskStationSupplementOptions {
  return {
    requiredStationCount: 2,
    missingStationCount: 1,
    stationGroupId: 13,
    candidates: [
      { accountId: 903, accountPhone: "8613900000903" },
      { accountId: 904, accountPhone: "8613900000904" }
    ]
  };
}

describe("normal-link station supplement state", () => {
  it("loads the frozen group and current station gap", async () => {
    resetArmadaMockQueue([options()]);
    resetElementPlusMock();
    const state = usePullTaskStationSupplement({
      onSubmitted: async () => undefined
    });

    await state.open(7, 19);

    assert.equal(state.form.accountGroupId, 13);
    assert.equal(state.form.supplementCount, 1);
    assert.equal(state.form.selectionMode, 1);
    assert.equal(state.options.value?.missingStationCount, 1);
  });

  it("requires the exact manual candidate count", async () => {
    resetArmadaMockQueue([options()]);
    resetElementPlusMock();
    const state = usePullTaskStationSupplement({
      onSubmitted: async () => undefined
    });
    await state.open(7, 19);
    state.form.selectionMode = 2;

    await state.submit();

    assert.equal(armadaCalls().length, 1);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择 1 个候选站台账号");
  });

  it("submits only station locking fields and refreshes the execution", async () => {
    resetArmadaMockQueue([options(), {}]);
    resetElementPlusMock();
    let refreshes = 0;
    const state = usePullTaskStationSupplement({
      onSubmitted: async () => {
        refreshes += 1;
      }
    });
    await state.open(7, 19);
    state.form.selectionMode = 2;
    state.form.accountIds = [903];

    await state.submit();

    assert.deepEqual(armadaCalls()[1], {
      method: "post",
      url: "/api/pull-tasks/standard/7/executions/19/station-supplement",
      opts: {
        data: {
          accountGroupId: 13,
          supplementCount: 1,
          selectionMode: 2,
          accountIds: [903]
        }
      }
    });
    assert.equal(refreshes, 1);
  });
});

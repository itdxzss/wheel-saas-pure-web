import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import { usePullTaskGlobalSetting } from "./usePullTaskGlobalSetting";

const unconfigured = {
  configured: false,
  marketingSilenceMinutes: null,
  groupLockdownMinutes: null,
  maxMarketingAccountsPerGroup: null
};

const configured = {
  configured: true,
  marketingSilenceMinutes: 30,
  groupLockdownMinutes: 60,
  maxMarketingAccountsPerGroup: 2
};

describe("pull task global setting state", () => {
  it("opens an empty form when the tenant has not configured values", async () => {
    resetArmadaMockQueue([unconfigured]);
    resetElementPlusMock();
    const state = usePullTaskGlobalSetting();

    await state.open();

    assert.equal(state.visible.value, true);
    assert.deepEqual(
      { ...state.form },
      {
        marketingSilenceMinutes: null,
        groupLockdownMinutes: null,
        maxMarketingAccountsPerGroup: null
      }
    );
    assert.equal(armadaCalls().length, 1);
  });

  it("loads all persisted values every time it opens", async () => {
    resetArmadaMockQueue([
      configured,
      { ...configured, marketingSilenceMinutes: 45 }
    ]);
    resetElementPlusMock();
    const state = usePullTaskGlobalSetting();

    await state.open();
    assert.equal(state.form.marketingSilenceMinutes, 30);
    await state.open();

    assert.deepEqual(
      { ...state.form },
      {
        marketingSilenceMinutes: 45,
        groupLockdownMinutes: 60,
        maxMarketingAccountsPerGroup: 2
      }
    );
    assert.equal(armadaCalls().length, 2);
  });

  it("cancels without saving", async () => {
    resetArmadaMockQueue([configured]);
    resetElementPlusMock();
    const state = usePullTaskGlobalSetting();
    await state.open();

    state.cancel();

    assert.equal(state.visible.value, false);
    assert.deepEqual(
      armadaCalls().map(call => call.method),
      ["get"]
    );
  });

  it("rejects invalid values without issuing PUT", async () => {
    resetArmadaMockQueue([unconfigured]);
    resetElementPlusMock();
    const state = usePullTaskGlobalSetting();
    await state.open();
    state.form.marketingSilenceMinutes = -1;
    state.form.groupLockdownMinutes = 1.5;
    state.form.maxMarketingAccountsPerGroup = 0;

    await state.save();

    assert.deepEqual(
      armadaCalls().map(call => call.method),
      ["get"]
    );
    assert.equal(elementPlusCalls()[0]?.type, "warning");
    assert.equal(state.visible.value, true);
  });

  it("saves all values and closes only after success", async () => {
    resetArmadaMockQueue([configured, configured]);
    resetElementPlusMock();
    const state = usePullTaskGlobalSetting();
    await state.open();

    await state.save();

    assert.equal(state.visible.value, false);
    assert.deepEqual(armadaCalls()[1], {
      method: "put",
      url: "/api/pull-tasks/group-marketing-setting",
      opts: {
        data: {
          marketingSilenceMinutes: 30,
          groupLockdownMinutes: 60,
          maxMarketingAccountsPerGroup: 2
        }
      }
    });

    state.visible.value = true;
    resetArmadaMockFailure(new Error("保存失败"));
    await state.save();
    assert.equal(state.visible.value, true);
    assert.deepEqual(elementPlusCalls().at(-1), {
      type: "error",
      text: "保存失败"
    });
  });
});

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
import type { PullTaskManagerSupplementOptions } from "@/api/pull-task";
import { usePullTaskManagerSupplement } from "./usePullTaskManagerSupplement";

function options(
  overrides: Partial<PullTaskManagerSupplementOptions> = {}
): PullTaskManagerSupplementOptions {
  return {
    currentManagerCount: 0,
    requiredManagerCount: 1,
    missingManagerCount: 1,
    managerGroupId: 11,
    managerInviteAvailable: false,
    currentManagers: [],
    executorAccounts: [],
    candidates: [{ accountId: 901, accountPhone: "8613900000000" }],
    ...overrides
  };
}

describe("normal-link manager supplement state", () => {
  it("loads the frozen group and forces link entry without an executor", async () => {
    resetArmadaMockQueue([options()]);
    resetElementPlusMock();
    const state = usePullTaskManagerSupplement({
      onSubmitted: async () => undefined
    });

    await state.open(7, 19);

    assert.equal(state.visible.value, true);
    assert.equal(state.form.accountGroupId, 11);
    assert.equal(state.form.entryMode, 1);
    assert.equal(state.form.executorRoleRowId, "");
    assert.equal(state.options.value?.missingManagerCount, 1);
    assert.deepEqual(armadaCalls()[0], {
      method: "get",
      url: "/api/pull-tasks/standard/7/executions/19/manager-supplement/options",
      opts: { params: { accountGroupId: undefined } }
    });
  });

  it("reloads candidates when the user changes the account group", async () => {
    resetArmadaMockQueue([options(), options({ managerGroupId: 12 })]);
    resetElementPlusMock();
    const state = usePullTaskManagerSupplement({
      onSubmitted: async () => undefined
    });
    await state.open(7, 19);
    state.form.accountId = 901;

    await state.changeAccountGroup(12);

    assert.equal(state.form.accountGroupId, 12);
    assert.equal(state.form.accountId, "");
    assert.deepEqual(armadaCalls()[1]?.opts, {
      params: { accountGroupId: 12 }
    });
  });

  it("validates an explicit candidate before creating the frozen command", async () => {
    resetArmadaMockQueue([options()]);
    resetElementPlusMock();
    const state = usePullTaskManagerSupplement({
      onSubmitted: async () => undefined
    });
    await state.open(7, 19);

    await state.submit();

    assert.equal(armadaCalls().length, 1);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择候选管理员账号");
  });

  it("submits the selected entry branch and refreshes the execution list", async () => {
    resetArmadaMockQueue([
      options({
        managerInviteAvailable: true,
        executorAccounts: [
          {
            roleRowId: 88,
            accountId: 801,
            accountPhone: "8613800000000",
            membershipStatus: 1,
            adminStatus: 1,
            availabilityStatus: 1
          }
        ]
      }),
      {}
    ]);
    resetElementPlusMock();
    let refreshes = 0;
    const state = usePullTaskManagerSupplement({
      onSubmitted: async () => {
        refreshes += 1;
      }
    });
    await state.open(7, 19);
    state.form.accountId = 901;
    state.form.entryMode = 2;
    state.form.executorRoleRowId = 88;

    await state.submit();

    assert.deepEqual(armadaCalls()[1], {
      method: "post",
      url: "/api/pull-tasks/standard/7/executions/19/manager-supplement",
      opts: {
        data: {
          accountGroupId: 11,
          accountId: 901,
          entryMode: 2,
          executorRoleRowId: 88
        }
      }
    });
    assert.equal(refreshes, 1);
    assert.equal(state.visible.value, false);
  });
});

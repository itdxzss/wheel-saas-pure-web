import assert from "node:assert/strict";
import { ref } from "vue";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import { createEmptyPullTaskMarketingDraft } from "./create-draft";
import { usePullTaskCreateSetting } from "./usePullTaskCreateSetting";

describe("pull task marketing create setting", () => {
  it("maps configured global values and initializes the task limit", async () => {
    resetArmadaMock({
      configured: true,
      marketingSilenceMinutes: 30,
      groupLockdownMinutes: 60,
      maxMarketingAccountsPerGroup: 2
    });
    const draft = ref(createEmptyPullTaskMarketingDraft());
    const state = usePullTaskCreateSetting(draft);

    await state.load();

    assert.equal(state.configured.value, true);
    assert.equal(draft.value.marketingSilenceMinutes, 30);
    assert.equal(draft.value.groupLockdownMinutes, 60);
    assert.equal(draft.value.maxMarketingAccountsPerGroup, 2);
    assert.equal(draft.value.globalMaxMarketingAccountsPerGroup, 2);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/group-marketing-setting",
        opts: undefined
      }
    ]);
  });

  it("keeps every setting value null when the tenant is unconfigured", async () => {
    resetArmadaMock({
      configured: false,
      marketingSilenceMinutes: null,
      groupLockdownMinutes: null,
      maxMarketingAccountsPerGroup: null
    });
    const draft = ref(createEmptyPullTaskMarketingDraft());
    const state = usePullTaskCreateSetting(draft);

    await state.load();

    assert.equal(state.configured.value, false);
    assert.equal(draft.value.marketingSilenceMinutes, null);
    assert.equal(draft.value.groupLockdownMinutes, null);
    assert.equal(draft.value.maxMarketingAccountsPerGroup, null);
    assert.equal(draft.value.globalMaxMarketingAccountsPerGroup, null);
    assert.equal(state.validate(), "请先在拉群任务列表完成全局设置");
  });
});

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
import { useGroupMarketingTaskPage } from "./useGroupMarketingTaskPage";

describe("group marketing task page state", () => {
  it("creates a marketing task with required template payload", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useGroupMarketingTaskPage();
    pageState.accountGroups.value = [
      {
        id: 8,
        name: "北美账号",
        totalAccounts: 1,
        onlineAccounts: 1,
        abnormalAccounts: 0,
        bannedAccounts: 0,
        updatedAt: "2026-07-04 15:00:00",
        systemBuiltin: false
      }
    ];
    pageState.createForm.taskName = "模板任务";
    pageState.createForm.accountGroupId = 8;
    pageState.marketingTemplates.value = [
      {
        id: 18,
        templateName: "活动模板",
        linkMode: 1,
        textType: "PROMO",
        content: "标题",
        bodyText: "正文",
        buttons: []
      }
    ];
    pageState.createForm.marketingTemplateId = 18;

    await pageState.createTask({
      form: { ...pageState.createForm },
      selections: [
        { accountId: 3, targetScope: "GROUP_FIXED", groupLinkIds: [11] }
      ]
    });

    const calls = armadaCalls();
    assert.equal(calls[0].method, "post");
    assert.equal(calls[0].url, "/api/marketing-tasks");
    assert.deepEqual((calls[0].opts as { data: unknown }).data, {
      taskName: "模板任务",
      accountGroupId: 8,
      accountGroupName: "北美账号",
      marketingTemplateId: 18,
      marketingTemplateName: "活动模板",
      startMode: "PENDING",
      sendPerRound: 1,
      sendIntervalSeconds: 30,
      onlineCheckEnabled: true,
      abnormalGroupSkipped: true,
      autoRetryEnabled: false,
      remark: null,
      selections: [
        { accountId: 3, targetScope: "GROUP_FIXED", groupLinkIds: [11] }
      ]
    });
  });

  it("rejects create when marketing template is missing", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    resetElementPlusMock();
    const pageState = useGroupMarketingTaskPage();
    pageState.accountGroups.value = [
      {
        id: 8,
        name: "北美账号",
        totalAccounts: 1,
        onlineAccounts: 1,
        abnormalAccounts: 0,
        bannedAccounts: 0,
        updatedAt: "2026-07-04 15:00:00",
        systemBuiltin: false
      }
    ];
    pageState.createForm.taskName = "缺模板任务";
    pageState.createForm.accountGroupId = 8;

    await pageState.createTask({
      form: { ...pageState.createForm },
      selections: [
        { accountId: 3, targetScope: "GROUP_FIXED", groupLinkIds: [11] }
      ]
    });

    assert.deepEqual(armadaCalls(), []);
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "请选择营销模板" }
    ]);
  });
});

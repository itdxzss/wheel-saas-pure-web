import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
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
    pageState.createForm.accountGroupSendAt = "4102358400000";
    pageState.createForm.taskStartAt = "4102444800000";
    pageState.createForm.taskEndAt = "4102531200000";

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
      accountGroupSendAt: 4102358400000,
      taskStartAt: 4102444800000,
      taskEndAt: 4102531200000,
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

  it("rejects account group send time older than seventy two hours", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    resetElementPlusMock();
    const now = Date.now();
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
    pageState.createForm.taskName = "过期发送时间";
    pageState.createForm.accountGroupId = 8;
    pageState.createForm.marketingTemplateId = 18;
    pageState.createForm.accountGroupSendAt = String(
      now - 72 * 60 * 60 * 1000 - 1000
    );
    pageState.createForm.taskStartAt = String(now + 60 * 1000);
    pageState.createForm.taskEndAt = String(now + 60 * 60 * 1000);

    await pageState.createTask({
      form: { ...pageState.createForm },
      selections: [
        { accountId: 3, targetScope: "ACCOUNT_DYNAMIC", groupLinkIds: [] }
      ]
    });

    assert.deepEqual(armadaCalls(), []);
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "账号群组发送时间最多支持追溯72小时" }
    ]);
  });

  it("loads account list for the first account group without loading account groups", async () => {
    resetArmadaMockQueue([
      {
        list: [
          {
            id: 8,
            name: "北美账号",
            totalAccounts: 1,
            onlineAccounts: 1,
            abnormalAccounts: 0,
            bannedAccounts: 0,
            updatedAt: null,
            systemBuiltin: false
          }
        ],
        total: 1,
        page: 1,
        pageSize: 500
      },
      {
        list: [
          {
            id: 18,
            templateName: "活动模板",
            linkMode: 1,
            textType: "PROMO",
            content: "标题",
            bodyText: "正文",
            buttons: []
          }
        ],
        total: 1,
        page: 1,
        pageSize: 500
      },
      {
        accounts: [
          {
            accountId: 3,
            wsPhone: "923300000003",
            status: "ONLINE",
            groupsError: false,
            groups: []
          }
        ]
      }
    ]);
    const pageState = useGroupMarketingTaskPage();

    await pageState.openCreateDrawer();

    const calls = armadaCalls();
    assert.equal(calls[0].url, "/api/account-groups");
    assert.equal(calls[1].url, "/api/marketing-templates");
    assert.equal(calls[2].url, "/api/marketing-tasks/account-tree");
    assert.deepEqual((calls[2].opts as { params: unknown }).params, {
      groupId: 8
    });
    assert.equal(calls.length, 3);
    assert.equal(pageState.createForm.accountGroupId, 8);
    assert.equal(pageState.treeAccounts.value[0].accountId, 3);
    assert.deepEqual(pageState.treeAccounts.value[0].groups, []);
  });

  it("reloads account tree when selected account group changes", async () => {
    resetArmadaMock({ accounts: [] });
    const pageState = useGroupMarketingTaskPage();

    await pageState.loadAccountTree(9);

    const calls = armadaCalls();
    assert.equal(calls[0].method, "get");
    assert.equal(calls[0].url, "/api/marketing-tasks/account-tree");
    assert.deepEqual((calls[0].opts as { params: unknown }).params, {
      groupId: 9
    });
  });

  it("loads groups only for the expanded account", async () => {
    resetArmadaMockQueue([
      {
        accounts: [
          {
            accountId: 3,
            wsPhone: "923300000003",
            status: "ONLINE",
            groupsError: false,
            groups: []
          }
        ]
      },
      {
        accountId: 3,
        wsPhone: "923300000003",
        status: "ONLINE",
        groupsError: false,
        groups: [
          {
            groupLinkId: 31,
            groupJid: "120363031@g.us",
            groupName: "新群31",
            linkUrl: "https://chat.whatsapp.com/31",
            isAdmin: true
          }
        ]
      }
    ]);
    const pageState = useGroupMarketingTaskPage();

    await pageState.loadAccountTree(8);
    const loaded = await pageState.loadAccountGroups(3);

    const calls = armadaCalls();
    assert.equal(calls[0].url, "/api/marketing-tasks/account-tree");
    assert.equal(
      calls[1].url,
      "/api/marketing-tasks/account-tree/accounts/3/groups"
    );
    assert.equal(loaded?.groups[0].groupLinkId, 31);
    assert.deepEqual(pageState.treeAccounts.value[0].groups, []);
    const cached = await pageState.loadAccountGroups(3);
    assert.equal(cached?.groups[0].groupLinkId, 31);
    assert.equal(calls.length, 2);
  });
});

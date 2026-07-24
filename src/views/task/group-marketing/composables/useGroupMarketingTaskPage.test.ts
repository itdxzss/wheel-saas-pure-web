import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { effectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type {
  MarketingGroupExecutionResult,
  MarketingTaskDetail,
  MarketingTaskRow
} from "@/api/marketing-task";
import {
  endOfDayTimestamp,
  useGroupMarketingTaskPage
} from "./useGroupMarketingTaskPage";

function marketingDetail(
  id: number,
  status: 1 | 2 | 5 | 7 | 8,
  executionResult: MarketingGroupExecutionResult | null
): MarketingTaskDetail {
  return {
    id,
    status,
    taskName: `任务${id}`,
    accountTargets: [
      {
        accountId: 3,
        accountPhone: "923300000003",
        status: 2,
        sentMessageCount: executionResult === "SUCCESS" ? 1 : 0,
        failedMessageCount: executionResult === "FAILED" ? 1 : 0,
        groups: [
          {
            groupJid: "120363003@g.us",
            executionResult,
            sentMessageCount: executionResult === "SUCCESS" ? 1 : 0,
            failedMessageCount: executionResult === "FAILED" ? 1 : 0
          }
        ]
      }
    ]
  } as MarketingTaskDetail;
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

function installIntervalHarness(): {
  delays: number[];
  cleared: Array<ReturnType<typeof setInterval>>;
  run: () => void;
  restore: () => void;
} {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const callbacks: Array<() => void> = [];
  const delays: number[] = [];
  const cleared: Array<ReturnType<typeof setInterval>> = [];
  const handle = 51 as unknown as ReturnType<typeof setInterval>;

  globalThis.setInterval = ((callback: () => void, delay?: number) => {
    callbacks.push(callback);
    delays.push(Number(delay));
    return handle;
  }) as typeof setInterval;
  globalThis.clearInterval = ((value: ReturnType<typeof setInterval>) => {
    cleared.push(value);
  }) as typeof clearInterval;

  return {
    delays,
    cleared,
    run: () => callbacks.at(-1)?.(),
    restore: () => {
      globalThis.setInterval = originalSetInterval;
      globalThis.clearInterval = originalClearInterval;
    }
  };
}

async function flushAsyncWork(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(resolve));
}

describe("group marketing task page state", () => {
  it("normalizes a selected end date to 23:59:59 without milliseconds", () => {
    const timestamp = endOfDayTimestamp(new Date(2026, 6, 13, 8, 30, 45, 678));
    const result = new Date(timestamp);

    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 6);
    assert.equal(result.getDate(), 13);
    assert.equal(result.getHours(), 23);
    assert.equal(result.getMinutes(), 59);
    assert.equal(result.getSeconds(), 59);
    assert.equal(result.getMilliseconds(), 0);
  });

  it("creates a marketing task with required template payload", async () => {
    resetArmadaMock({
      list: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    const pageState = useGroupMarketingTaskPage();
    assert.equal(pageState.createForm.accountGroupSendIntervalSeconds, 0.5);
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
        mentionAll: false,
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
      accountGroupSendIntervalSeconds: 0.5,
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

  it("rejects an invalid per-account group send interval", async () => {
    for (const interval of [
      0.4,
      0.55,
      3.1,
      Number.NaN,
      Number.POSITIVE_INFINITY
    ]) {
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
      pageState.marketingTemplates.value = [
        {
          id: 18,
          templateName: "活动模板",
          linkMode: 1,
          textType: "PROMO",
          content: "标题",
          bodyText: "正文",
          mentionAll: false,
          buttons: []
        }
      ];
      pageState.createForm.taskName = "非法间隔任务";
      pageState.createForm.accountGroupId = 8;
      pageState.createForm.marketingTemplateId = 18;
      pageState.createForm.accountGroupSendIntervalSeconds = interval;
      pageState.createForm.taskStartAt = "4102444800000";
      pageState.createForm.taskEndAt = "4102531200000";

      await pageState.createTask({
        form: { ...pageState.createForm },
        selections: [
          { accountId: 3, targetScope: "GROUP_FIXED", groupLinkIds: [11] }
        ]
      });

      assert.deepEqual(armadaCalls(), []);
      assert.deepEqual(elementPlusCalls(), [
        {
          type: "warning",
          text: "单账号下群组发送间隔必须为0.5到3秒，最多一位小数"
        }
      ]);
    }
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
        mentionAll: false,
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
    pageState.createForm.accountGroupSendIntervalSeconds = 2.4;

    await pageState.openCreateDrawer();

    assert.equal(pageState.createForm.marketingTemplateId, "");
    assert.equal(pageState.createForm.accountGroupSendIntervalSeconds, 0.5);
    assert.equal(pageState.marketingTemplates.value.length, 1);
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

  it("reports waiting when a future task is activated before its start time", async () => {
    const row = { id: 42, status: 1 } as MarketingTaskRow;
    resetArmadaMock({ ...row, status: 1 });
    resetElementPlusMock();
    const pageState = useGroupMarketingTaskPage();

    await pageState.startTask(row);

    assert.equal(armadaCalls()[0].url, "/api/marketing-tasks/42/start");
    assert.deepEqual(elementPlusCalls(), [
      {
        type: "success",
        text: "营销任务已进入等待，将在计划开始时间自动执行"
      }
    ]);
  });

  it("calls pause resume and close lifecycle endpoints", async () => {
    resetElementPlusMock();
    const pageState = useGroupMarketingTaskPage();

    resetArmadaMock({ id: 42, status: 5 });
    await pageState.pauseTask({ id: 42, status: 2 } as MarketingTaskRow);
    assert.equal(armadaCalls()[0].url, "/api/marketing-tasks/42/pause");

    resetArmadaMock({ id: 42, status: 2 });
    await pageState.resumeTask({ id: 42, status: 5 } as MarketingTaskRow);
    assert.equal(armadaCalls()[0].url, "/api/marketing-tasks/42/resume");

    resetArmadaMock({ id: 42, status: 8 });
    await pageState.closeTask({ id: 42, status: 2 } as MarketingTaskRow);
    assert.equal(armadaCalls()[0].url, "/api/marketing-tasks/42/close");
  });

  it("rejects marketing material editing for completed and closed tasks", async () => {
    resetArmadaMock({});
    resetElementPlusMock();
    const pageState = useGroupMarketingTaskPage();

    await pageState.openMaterialDrawer({
      id: 42,
      status: 7
    } as MarketingTaskRow);
    await pageState.openMaterialDrawer({
      id: 43,
      status: 8
    } as MarketingTaskRow);

    assert.deepEqual(armadaCalls(), []);
    assert.equal(pageState.materialDrawerOpen.value, false);
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "已完成或已关闭的任务不可修改营销素材" },
      { type: "warning", text: "已完成或已关闭的任务不可修改营销素材" }
    ]);
  });

  it("polls every five seconds only while the detail task is sending", async () => {
    const timers = installIntervalHarness();
    try {
      resetArmadaMockQueue([
        marketingDetail(42, 2, "SUCCESS"),
        marketingDetail(42, 7, "FAILED")
      ]);
      const pageState = useGroupMarketingTaskPage();

      await pageState.openDetailDrawer({
        id: 42,
        status: 2
      } as MarketingTaskRow);

      assert.deepEqual(timers.delays, [5000]);
      assert.equal(
        pageState.detailTask.value?.accountTargets?.[0].groups[0]
          .executionResult,
        "SUCCESS"
      );

      timers.run();
      await flushAsyncWork();

      assert.equal(pageState.detailTask.value?.status, 7);
      assert.equal(
        pageState.detailTask.value?.accountTargets?.[0].groups[0]
          .executionResult,
        "FAILED"
      );
      assert.equal(timers.cleared.length, 1);
      assert.equal(armadaCalls().length, 2);
    } finally {
      timers.restore();
    }
  });

  it("does not start polling for a non-sending detail task", async () => {
    const timers = installIntervalHarness();
    try {
      resetArmadaMock(marketingDetail(42, 7, "SUCCESS"));
      const pageState = useGroupMarketingTaskPage();

      await pageState.openDetailDrawer({
        id: 42,
        status: 7
      } as MarketingTaskRow);

      assert.deepEqual(timers.delays, []);
    } finally {
      timers.restore();
    }
  });

  it("opens an existing task detail directly by task ID", async () => {
    resetArmadaMock(marketingDetail(42, 7, "SUCCESS"));
    const pageState = useGroupMarketingTaskPage();

    await pageState.openDetailById(42);

    assert.equal(pageState.detailDrawerOpen.value, true);
    assert.equal(pageState.detailTask.value?.id, 42);
    assert.equal(armadaCalls()[0]?.url, "/api/marketing-tasks/42");
  });

  it("skips overlapping polls and ignores a stale response after switching tasks", async () => {
    const timers = installIntervalHarness();
    try {
      resetArmadaMock(marketingDetail(42, 2, "SUCCESS"));
      const pageState = useGroupMarketingTaskPage();
      await pageState.openDetailDrawer({
        id: 42,
        status: 2
      } as MarketingTaskRow);

      const oldPoll = deferred<MarketingTaskDetail>();
      resetArmadaMock(oldPoll.promise);
      timers.run();
      timers.run();
      assert.equal(armadaCalls().length, 1);

      resetArmadaMock(marketingDetail(43, 7, "SUCCESS"));
      await pageState.openDetailDrawer({
        id: 43,
        status: 7
      } as MarketingTaskRow);
      oldPoll.resolve(marketingDetail(42, 2, "FAILED"));
      await flushAsyncWork();

      assert.equal(pageState.detailTask.value?.id, 43);
      assert.equal(
        pageState.detailTask.value?.accountTargets?.[0].groups[0]
          .executionResult,
        "SUCCESS"
      );
    } finally {
      timers.restore();
    }
  });

  it("keeps old detail data and reports a background failure once per streak", async () => {
    const timers = installIntervalHarness();
    try {
      resetElementPlusMock();
      resetArmadaMock(marketingDetail(42, 2, "SUCCESS"));
      const pageState = useGroupMarketingTaskPage();
      await pageState.openDetailDrawer({
        id: 42,
        status: 2
      } as MarketingTaskRow);

      resetArmadaMockFailure(new Error("temporary refresh failure"));
      timers.run();
      await flushAsyncWork();
      timers.run();
      await flushAsyncWork();

      assert.equal(
        pageState.detailTask.value?.accountTargets?.[0].groups[0]
          .executionResult,
        "SUCCESS"
      );
      assert.equal(
        elementPlusCalls().filter(call => call.type === "error").length,
        1
      );

      resetArmadaMock(marketingDetail(42, 2, "FAILED"));
      timers.run();
      await flushAsyncWork();
      resetArmadaMockFailure(new Error("second refresh failure"));
      timers.run();
      await flushAsyncWork();

      assert.equal(
        elementPlusCalls().filter(call => call.type === "error").length,
        2
      );
    } finally {
      timers.restore();
    }
  });

  it("clears polling when the drawer v-model closes", async () => {
    const timers = installIntervalHarness();
    try {
      resetArmadaMock(marketingDetail(42, 2, "SUCCESS"));
      const pageState = useGroupMarketingTaskPage();
      await pageState.openDetailDrawer({
        id: 42,
        status: 2
      } as MarketingTaskRow);

      pageState.detailDrawerOpen.value = false;
      await flushAsyncWork();

      assert.equal(timers.cleared.length, 1);
      assert.equal(pageState.detailTask.value, null);
    } finally {
      timers.restore();
    }
  });

  it("clears polling when the composable scope is disposed", async () => {
    const timers = installIntervalHarness();
    try {
      resetArmadaMock(marketingDetail(42, 2, "SUCCESS"));
      const scope = effectScope();
      const pageState = scope.run(() => useGroupMarketingTaskPage());
      assert.ok(pageState);
      await pageState.openDetailDrawer({
        id: 42,
        status: 2
      } as MarketingTaskRow);

      scope.stop();

      assert.equal(timers.cleared.length, 1);
    } finally {
      timers.restore();
    }
  });

  it("updates marketing material and refreshes task template fields", async () => {
    resetArmadaMockQueue([
      {
        id: 18,
        templateName: "活动模板",
        linkMode: 1,
        textType: "PROMO",
        imageFileId: null,
        content: "新标题",
        bodyText: "",
        promotionLink: "https://example.com/new",
        remark: null,
        mentionAll: true,
        buttons: [],
        createdAt: 1000,
        updatedAt: 2000
      },
      {
        list: [
          {
            id: 42,
            taskName: "夏季活动",
            accountGroupId: 8,
            accountGroupName: "北美账号",
            marketingTemplateId: 18,
            marketingTemplateName: "活动模板",
            marketingTemplateContent: "新标题",
            marketingTemplateBodyText: "",
            marketingTemplatePromotionLink: "https://example.com/new",
            status: 1,
            selectedAccountCount: 1,
            targetGroupCount: 0,
            targetPairCount: 1,
            sentMessageCount: 0,
            failedMessageCount: 0,
            sendPerRound: 1,
            accountGroupSendIntervalSeconds: 0.5,
            sendIntervalSeconds: 30,
            onlineCheckEnabled: true,
            abnormalGroupSkipped: true,
            autoRetryEnabled: false
          }
        ],
        total: 1,
        page: 1,
        pageSize: 10
      }
    ]);
    resetElementPlusMock();
    const pageState = useGroupMarketingTaskPage();
    pageState.marketingTemplates.value = [
      {
        id: 18,
        templateName: "活动模板",
        linkMode: 1,
        textType: "PROMO",
        content: "标题",
        bodyText: "原正文",
        mentionAll: true,
        buttons: []
      }
    ];

    await pageState.openMaterialDrawer({
      id: 42,
      taskName: "夏季活动",
      marketingTemplateId: 18,
      status: 1
    } as MarketingTaskRow);
    pageState.materialForm.value.bodyText = "";
    assert.equal(pageState.materialForm.value.mentionAll, true);
    await pageState.submitMaterialUpdate();

    const calls = armadaCalls();
    assert.equal(calls.length, 2);
    assert.equal(calls[0].method, "put");
    assert.equal(calls[0].url, "/api/marketing-tasks/42/marketing-template");
    assert.equal(calls[1].method, "get");
    assert.equal(calls[1].url, "/api/marketing-tasks");
    assert.equal(
      (calls[0].opts as { data: { bodyText: string } }).data.bodyText,
      ""
    );
    assert.equal(
      (calls[0].opts as { data: { mentionAll: boolean } }).data.mentionAll,
      true
    );
    assert.equal(pageState.materialDrawerOpen.value, false);
    assert.equal(pageState.rows.value[0].marketingTemplateContent, "新标题");
    assert.equal(
      pageState.rows.value[0].marketingTemplatePromotionLink,
      "https://example.com/new"
    );
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import type {
  HistoricalGroupDetail,
  HistoricalGroupPullExecution
} from "@/api/historical-group";
import {
  useHistoricalGroupExecution,
  type HistoricalGroupExecutionScheduler
} from "./composables/useHistoricalGroupExecution";

const drawerSource = readFileSync(
  new URL("./components/HistoricalGroupDetailDrawer.vue", import.meta.url),
  "utf8"
);
const panelSource = readFileSync(
  new URL("./components/HistoricalGroupPullPanel.vue", import.meta.url),
  "utf8"
);
const resultSource = readFileSync(
  new URL("./components/HistoricalGroupExecutionResult.vue", import.meta.url),
  "utf8"
);

const detail: HistoricalGroupDetail = {
  accountId: 17,
  groupJid: "120363execution@g.us",
  subject: "执行目标群",
  membershipState: "CURRENT_IN_GROUP",
  roleCategory: "ADMIN",
  selfRole: "ADMIN",
  speechState: "NORMAL",
  memberSize: 20,
  announceOnly: false,
  inviteUrl: "https://chat.whatsapp.com/ExecutionInvite",
  linkAvailable: true,
  operationAllowed: true,
  operationDisabledReason: null,
  errorCode: null,
  errorMessage: null,
  members: []
};

function execution(
  id: number,
  pullStatus: HistoricalGroupPullExecution["pullStatus"],
  marketingStatus: HistoricalGroupPullExecution["marketingStatus"] = "NOT_STARTED"
): HistoricalGroupPullExecution {
  return {
    id,
    operationAccountId: 17,
    groupJid: detail.groupJid,
    groupSubject: detail.subject,
    pullerAccountGroupId: 8,
    pullerAccountId: 27,
    pullerPhone: "8613900000027",
    pullerParticipantJid: "8613900000027@s.whatsapp.net",
    singleAddCount: 25,
    marketingTemplateId: null,
    normalCount: 2,
    marketingCount: 1,
    invalidCount: 0,
    duplicateCount: 0,
    pullSuccessCount: 1,
    pullFailureCount: 1,
    sendSuccessCount: 0,
    sendFailureCount: 0,
    pullStatus,
    marketingStatus,
    errorCode: null,
    errorMessage: null,
    members: [
      {
        phone: "8613800000001",
        participantJid: "8613800000001@s.whatsapp.net",
        materialType: "NORMAL",
        accountId: null,
        protocolAccountId: null,
        contactStatus: "FAILED",
        contactErrorCode: "CONTACT_SAVE_FAILED",
        contactErrorMessage: "完整联系人错误：save contact timed out",
        addStatus: "FAILED",
        addErrorCode: "PARTICIPANT_ADD_FAILED",
        addErrorMessage: "完整加群错误：not-authorized",
        sendStatus: "NOT_APPLICABLE",
        sendCommandId: null,
        sendResultEventId: null,
        sendErrorCode: null,
        sendErrorMessage: null
      },
      {
        phone: "8613800000002",
        participantJid: "8613800000002@s.whatsapp.net",
        materialType: "MARKETING",
        accountId: 29,
        protocolAccountId: "wa-account-29",
        contactStatus: "SUCCESS",
        contactErrorCode: null,
        contactErrorMessage: null,
        addStatus: "SUCCESS",
        addErrorCode: null,
        addErrorMessage: null,
        sendStatus: "FAILED",
        sendCommandId: "send-command-complete-29",
        sendResultEventId: "send-event-complete-29",
        sendErrorCode: "ACCOUNT_CANNOT_SPEAK",
        sendErrorMessage: "完整发送错误：账号离线或没有发言权限"
      }
    ]
  };
}

function optionResponses(latest: HistoricalGroupPullExecution | null) {
  return [
    {
      list: [{ id: 8, name: "随机拉手组", accountCount: 3 }],
      total: 1
    },
    {
      list: [
        {
          id: 33,
          templateName: "全部 A 账号营销",
          linkMode: 1,
          content: "完整模板",
          bodyText: "完整模板"
        }
      ],
      total: 1
    },
    latest
  ];
}

function fakeScheduler(): HistoricalGroupExecutionScheduler & {
  cancelled: number;
  delay: number | null;
  fire: () => Promise<void>;
  pending: () => boolean;
} {
  let callback: (() => void | Promise<void>) | null = null;
  const scheduler = {
    cancelled: 0,
    delay: null as number | null,
    schedule(next: () => void | Promise<void>, delayMs: number) {
      callback = next;
      scheduler.delay = delayMs;
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        callback = null;
        scheduler.cancelled += 1;
      };
    },
    async fire(): Promise<void> {
      const next = callback;
      callback = null;
      if (next) await next();
    },
    pending(): boolean {
      return callback != null;
    }
  };
  return scheduler;
}

describe("historical group pull execution state", () => {
  it("opens pulling for an administrator when the usable link exists", async () => {
    resetArmadaMockQueue(optionResponses(null));
    const state = useHistoricalGroupExecution({ detail: () => detail });

    await state.open();

    assert.equal(state.linkGateOpen.value, true);
    assert.equal(state.accountGroups.value[0].id, 8);
    assert.equal(state.marketingTemplates.value[0].id, 33);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/account-groups",
        "/api/marketing-templates",
        "/api/historical-group-pull-executions/latest"
      ]
    );

    resetArmadaMockQueue([]);
    const blocked = useHistoricalGroupExecution({
      detail: () => ({
        ...detail,
        inviteUrl: null,
        linkAvailable: false,
        operationDisabledReason: "成员管理不依赖群链接",
        errorCode: "GROUP_INVITE_LINK_UNAVAILABLE",
        errorMessage: "完整原因：没有邀请链接"
      })
    });
    await blocked.open();
    assert.equal(blocked.linkGateOpen.value, false);
    assert.match(blocked.gateReason.value, /完整原因：没有邀请链接/);
    assert.doesNotMatch(blocked.gateReason.value, /成员管理不依赖群链接/);
    assert.deepEqual(armadaCalls(), []);
  });

  it("blocks an ordinary member even when an unexpected usable link exists", async () => {
    resetArmadaMockQueue([]);
    const state = useHistoricalGroupExecution({
      detail: () => ({
        ...detail,
        roleCategory: "MEMBER",
        selfRole: "MEMBER",
        operationAllowed: false,
        operationDisabledReason: "当前账号不是管理员"
      })
    });

    await state.open();

    assert.equal(state.linkGateOpen.value, false);
    assert.match(
      state.gateReason.value,
      /当前账号不是管理员，仅支持查看群详情/
    );
    assert.deepEqual(armadaCalls(), []);
  });

  it("validates the puller group, supported file and positive integer count", async () => {
    resetArmadaMockQueue(optionResponses(null));
    const state = useHistoricalGroupExecution({ detail: () => detail });
    await state.open();

    assert.match(state.validatePull(), /拉手账号分组/);
    state.pullerAccountGroupId.value = 8;
    state.materialFile.value = new File(["x"], "members.pdf");
    assert.match(state.validatePull(), /TXT、CSV、XLS、XLSX/);

    for (const name of [
      "members.txt",
      "members.CSV",
      "members.xls",
      "members.xlsx"
    ]) {
      state.materialFile.value = new File(["86138"], name);
      state.singleAddCount.value = 0;
      assert.match(state.validatePull(), /正整数/);
      state.singleAddCount.value = 25;
      assert.equal(state.validatePull(), "");
    }
    state.singleAddCount.value = 2.5;
    assert.match(state.validatePull(), /正整数/);
  });

  it("creates then starts exactly once with one stable idempotency key", async () => {
    const scheduler = fakeScheduler();
    let generatedKeys = 0;
    resetArmadaMockQueue(optionResponses(null));
    const state = useHistoricalGroupExecution({
      detail: () => detail,
      scheduler,
      createIdempotencyKey: () => {
        generatedKeys += 1;
        return "stable-click-key-91";
      }
    });
    await state.open();
    state.pullerAccountGroupId.value = 8;
    state.materialFile.value = new File(["8613800000001"], "members.csv");
    state.singleAddCount.value = 25;
    resetArmadaMockQueue([execution(91, "PENDING"), execution(91, "RUNNING")]);

    await Promise.all([state.startPull(), state.startPull()]);

    assert.equal(generatedKeys, 1);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/historical-group-pull-executions",
        "/api/historical-group-pull-executions/91/start"
      ]
    );
    const createData = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(createData.get("operationAccountId"), "17");
    assert.equal(createData.get("groupJid"), detail.groupJid);
    assert.equal(createData.get("pullerAccountGroupId"), "8");
    assert.equal(createData.get("singleAddCount"), "25");
    assert.equal(createData.get("idempotencyKey"), "stable-click-key-91");
    assert.equal(createData.has("inviteUrl"), false);
    assert.equal(createData.has("inviteLink"), false);
    assert.equal(scheduler.delay, 2000);
  });

  it("polls after two seconds and stops on a terminal execution", async () => {
    const scheduler = fakeScheduler();
    resetArmadaMockQueue([
      ...optionResponses(execution(91, "RUNNING")),
      execution(91, "PARTIAL_SUCCESS")
    ]);
    const state = useHistoricalGroupExecution({
      detail: () => detail,
      scheduler
    });

    await state.open();
    assert.equal(scheduler.delay, 2000);
    assert.equal(scheduler.pending(), true);
    await scheduler.fire();

    assert.equal(state.execution.value?.pullStatus, "PARTIAL_SUCCESS");
    assert.equal(scheduler.pending(), false);
    assert.equal(
      armadaCalls().at(-1)?.url,
      "/api/historical-group-pull-executions/91"
    );
  });

  it("clears a scheduled poll immediately when the drawer session closes", async () => {
    const scheduler = fakeScheduler();
    resetArmadaMockQueue(optionResponses(execution(91, "RUNNING")));
    const state = useHistoricalGroupExecution({
      detail: () => detail,
      scheduler
    });
    await state.open();

    assert.equal(scheduler.pending(), true);
    state.close();

    assert.equal(scheduler.pending(), false);
    assert.equal(scheduler.cancelled, 1);
    assert.equal(state.polling.value, false);
  });

  it("cancels timers and rejects an old poll response after close and reopen", async () => {
    const scheduler = fakeScheduler();
    let resolveOldPoll: (value: HistoricalGroupPullExecution) => void = () =>
      undefined;
    const oldPoll = new Promise<HistoricalGroupPullExecution>(resolve => {
      resolveOldPoll = resolve;
    });
    resetArmadaMockQueue([
      ...optionResponses(execution(91, "RUNNING")),
      oldPoll,
      ...optionResponses(execution(92, "SUCCESS"))
    ]);
    const state = useHistoricalGroupExecution({
      detail: () => detail,
      scheduler
    });
    await state.open();

    const pendingOldPoll = scheduler.fire();
    await new Promise<void>(resolve => setImmediate(resolve));
    state.close();
    assert.equal(state.execution.value, null);
    await state.open();
    assert.equal(state.execution.value?.id, 92);

    resolveOldPoll(execution(91, "FAILED"));
    await pendingOldPoll;
    assert.equal(state.execution.value?.id, 92);
    assert.equal(state.execution.value?.pullStatus, "SUCCESS");

    state.close();
    assert.equal(scheduler.pending(), false);
  });

  it("sends one template to all marketing accounts without a subset", async () => {
    const scheduler = fakeScheduler();
    resetArmadaMockQueue(optionResponses(execution(91, "SUCCESS")));
    const state = useHistoricalGroupExecution({
      detail: () => detail,
      scheduler
    });
    await state.open();
    state.marketingTemplateId.value = 33;
    resetArmadaMockQueue([execution(91, "SUCCESS", "SENDING")]);

    await state.sendMarketing();

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/historical-group-pull-executions/91/marketing-send",
        opts: { data: { marketingTemplateId: 33 } }
      }
    ]);
    assert.equal(state.execution.value?.marketingStatus, "SENDING");
    assert.equal(scheduler.delay, 2000);
  });

  it("shows the complete start error without retrying create or start", async () => {
    resetArmadaMockQueue(optionResponses(null));
    const state = useHistoricalGroupExecution({ detail: () => detail });
    await state.open();
    state.pullerAccountGroupId.value = 8;
    state.materialFile.value = new File(["86138"], "members.xlsx");
    state.singleAddCount.value = 10;
    const startFailure = new Promise<HistoricalGroupPullExecution>(
      (_resolve, reject) => {
        setImmediate(() =>
          reject(new Error("完整启动错误：固定拉手账号已离线"))
        );
      }
    );
    resetArmadaMockQueue([execution(91, "PENDING"), startFailure]);

    await state.startPull();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/historical-group-pull-executions",
        "/api/historical-group-pull-executions/91/start"
      ]
    );
    assert.match(state.executionError.value, /固定拉手账号已离线/);
  });

  it("shows a complete send error and never retries marketing", async () => {
    resetArmadaMockQueue(optionResponses(execution(91, "SUCCESS")));
    const state = useHistoricalGroupExecution({ detail: () => detail });
    await state.open();
    state.marketingTemplateId.value = 33;
    resetArmadaMockFailure(
      new Error("完整营销错误：账号离线、非管理员或不能发言")
    );

    await state.sendMarketing();

    assert.equal(armadaCalls().length, 1);
    assert.match(state.executionError.value, /账号离线、非管理员或不能发言/);
  });
});

describe("historical group pull execution template", () => {
  it("uses a link-gated form with no editable invite link or account subset", () => {
    assert.match(drawerSource, /HistoricalGroupPullPanel/);
    assert.match(drawerSource, /isAdministrator/);
    assert.doesNotMatch(drawerSource, /群链接硬门禁未通过/);
    assert.match(panelSource, /群链接获取失败，仅影响拉群\/营销/);
    assert.match(panelSource, /拉手账号分组/);
    assert.match(panelSource, /TXT,CSV,XLS,XLSX|TXT、CSV、XLS、XLSX/);
    assert.match(panelSource, /单次添加人数/);
    assert.match(panelSource, /全部营销账号发送/);
    assert.match(panelSource, /marketingTemplateId/);
    assert.doesNotMatch(
      panelSource,
      /participantJids|selectedAccounts|账号子集/
    );
    assert.doesNotMatch(panelSource, /v-model[^\n]*invite/);
    assert.doesNotMatch(drawerSource, /Task 17|后续执行入口/);
  });

  it("renders every pull and marketing result field without masking", () => {
    for (const value of [
      "pullerPhone",
      "pullerParticipantJid",
      "failureStage",
      "normalCount",
      "marketingCount",
      "invalidCount",
      "duplicateCount",
      "pullSuccessCount",
      "pullFailureCount",
      "phone",
      "participantJid",
      "contactStatus",
      "contactErrorCode",
      "contactErrorMessage",
      "addStatus",
      "addErrorCode",
      "addErrorMessage",
      "marketingStatus",
      "sendStatus",
      "sendCommandId",
      "sendResultEventId",
      "sendErrorCode",
      "sendErrorMessage"
    ]) {
      assert.match(resultSource, new RegExp(value));
    }
    assert.match(resultSource, /word-break:\s*break-all/);
    assert.match(resultSource, /失败阶段/);
    assert.doesNotMatch(resultSource, /mask|ellipsis/);
  });
});

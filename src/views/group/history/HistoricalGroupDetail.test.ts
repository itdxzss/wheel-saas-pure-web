import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { resetElementPlusMock } from "@/api/__tests__/element-plus-test-double";
import type {
  HistoricalGroupDetail,
  HistoricalGroupItem,
  HistoricalGroupParticipantActionResult
} from "@/api/historical-group";
import { useHistoricalGroupDetail } from "./composables/useHistoricalGroupDetail";

const drawerSource = readFileSync(
  new URL("./components/HistoricalGroupDetailDrawer.vue", import.meta.url),
  "utf8"
);
const memberTableSource = readFileSync(
  new URL("./components/HistoricalGroupMemberTable.vue", import.meta.url),
  "utf8"
);
const pageSource = readFileSync(
  new URL("./index.vue", import.meta.url),
  "utf8"
);
const composableSource = readFileSync(
  new URL("./composables/useHistoricalGroupDetail.ts", import.meta.url),
  "utf8"
);

const group: HistoricalGroupItem = {
  groupJid: "120363detail@g.us",
  subject: "历史群详情",
  membershipState: "CURRENT_IN_GROUP",
  roleCategory: "ADMIN",
  selfRole: "ADMIN",
  speechState: "NORMAL",
  memberSize: 5,
  announceOnly: false,
  errorMessage: null
};

const detail: HistoricalGroupDetail = {
  accountId: 17,
  groupJid: group.groupJid,
  subject: group.subject,
  membershipState: "CURRENT_IN_GROUP",
  roleCategory: "ADMIN",
  selfRole: "ADMIN",
  speechState: "NORMAL",
  memberSize: 5,
  announceOnly: false,
  inviteUrl: "https://chat.whatsapp.com/CompleteInviteCode",
  linkAvailable: true,
  operationAllowed: true,
  operationDisabledReason: null,
  errorCode: null,
  errorMessage: null,
  members: [
    {
      participantJid: "8613000000001@s.whatsapp.net",
      phone: "8613000000001",
      self: true,
      owner: false,
      admin: true,
      selfRole: "ADMIN",
      operationAllowed: false,
      operationDisabledReason: "不能操作当前账号自身"
    },
    {
      participantJid: "8613000000002@s.whatsapp.net",
      phone: "8613000000002",
      self: false,
      owner: true,
      admin: true,
      selfRole: "OWNER",
      operationAllowed: false,
      operationDisabledReason: "不能操作群主"
    },
    {
      participantJid: "8613000000003@s.whatsapp.net",
      phone: "8613000000003",
      self: false,
      owner: false,
      admin: false,
      selfRole: "MEMBER",
      operationAllowed: true,
      operationDisabledReason: null
    },
    {
      participantJid: "8613000000004@s.whatsapp.net",
      phone: "8613000000004",
      self: false,
      owner: false,
      admin: true,
      selfRole: "ADMIN",
      operationAllowed: true,
      operationDisabledReason: null
    },
    {
      participantJid: "8613000000005@s.whatsapp.net",
      phone: "8613000000005",
      self: false,
      owner: false,
      admin: false,
      selfRole: "MEMBER",
      operationAllowed: false,
      operationDisabledReason: "后端禁止操作该成员"
    }
  ]
};

function createDetailState(accountId: number | null = 17) {
  return useHistoricalGroupDetail({
    operationAccountId: () => accountId,
    group: () => group
  });
}

describe("historical group detail state", () => {
  it("fetches full detail only after opening and uses the fixed operation account", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([detail]);
    const state = createDetailState();

    assert.deepEqual(armadaCalls(), []);

    await state.open();

    assert.equal(state.detail.value?.groupJid, group.groupJid);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/historical-groups/detail",
        opts: {
          params: { accountId: 17, groupJid: "120363detail@g.us" }
        }
      }
    ]);
  });

  it("keeps administrator member promotion enabled when the link lookup fails", async () => {
    const failedDetail: HistoricalGroupDetail = {
      ...detail,
      inviteUrl: null,
      linkAvailable: false,
      operationAllowed: true,
      operationDisabledReason: "成员管理不依赖群链接",
      errorCode: "GROUP_INVITE_LINK_UNAVAILABLE",
      errorMessage: "完整协议错误：Connection Terminated 428"
    };
    resetArmadaMockQueue([failedDetail]);
    const state = createDetailState();

    await state.open();

    assert.equal(state.linkGateOpen.value, false);
    assert.equal(state.memberManagementDisabled.value, false);
    assert.match(state.linkGateReason.value, /GROUP_INVITE_LINK_UNAVAILABLE/);
    assert.match(state.linkGateReason.value, /Connection Terminated 428/);
    assert.doesNotMatch(state.linkGateReason.value, /成员管理不依赖群链接/);
  });

  it("keeps administrator member promotion enabled for a blank invite URL", async () => {
    resetArmadaMockQueue([
      {
        ...detail,
        inviteUrl: "   ",
        linkAvailable: true,
        errorMessage: "协议返回空邀请链接"
      }
    ]);
    const state = createDetailState();

    await state.open();

    assert.equal(state.linkGateOpen.value, false);
    assert.equal(state.memberManagementDisabled.value, false);
    assert.match(state.linkGateReason.value, /协议返回空邀请链接/);
  });

  it("allows only role-safe promotion and exposes protection reasons", async () => {
    resetArmadaMockQueue([detail]);
    const state = createDetailState();
    await state.open();
    state.selectMembers(detail.members.map(member => member.participantJid));

    assert.deepEqual(state.eligibleParticipantJids("promote"), [
      "8613000000003@s.whatsapp.net"
    ]);
    assert.match(detail.members[0].operationDisabledReason ?? "", /自身/);
    assert.match(detail.members[1].operationDisabledReason ?? "", /群主/);

    resetArmadaMockQueue([{ ...detail, operationAllowed: false }]);
    const nonAdminState = createDetailState();
    await nonAdminState.open();
    nonAdminState.selectMembers(
      detail.members.map(member => member.participantJid)
    );
    assert.deepEqual(nonAdminState.eligibleParticipantJids("promote"), []);
    assert.equal(nonAdminState.linkGateOpen.value, true);
    assert.equal(nonAdminState.linkGateReason.value, "");
    assert.equal(nonAdminState.memberManagementDisabled.value, true);
  });

  it("keeps every item result, calls a mutation once and reloads detail once", async () => {
    const promotableDetail: HistoricalGroupDetail = {
      ...detail,
      members: detail.members.map(member =>
        member.participantJid === "8613000000004@s.whatsapp.net"
          ? { ...member, admin: false, selfRole: "MEMBER" }
          : member
      )
    };
    const actionResult = {
      ok: false,
      partial: true,
      results: [
        {
          participantJid: "8613000000003@s.whatsapp.net",
          success: true,
          status: "200",
          errorCode: null,
          errorMessage: null
        },
        {
          participantJid: "8613000000004@s.whatsapp.net",
          success: false,
          status: "403",
          errorCode: "GROUP_PERMISSION_DENIED",
          errorMessage: "完整逐项错误：管理员权限已变化"
        }
      ]
    };
    resetArmadaMockQueue([promotableDetail, actionResult, detail]);
    const state = createDetailState();
    await state.open();
    state.selectMembers([
      "8613000000003@s.whatsapp.net",
      "8613000000004@s.whatsapp.net"
    ]);

    await state.runParticipantAction("promote");

    assert.equal(state.lastActionResult.value?.results.length, 2);
    assert.equal(
      state.lastActionResult.value?.results[1].errorMessage,
      "完整逐项错误：管理员权限已变化"
    );
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/historical-groups/detail",
        "/api/historical-groups/participants/promote",
        "/api/historical-groups/detail"
      ]
    );
    assert.equal(
      armadaCalls().filter(call => call.url.endsWith("/promote")).length,
      1
    );
    assert.deepEqual(armadaCalls()[1].opts, {
      data: {
        accountId: 17,
        groupJid: "120363detail@g.us",
        participantJids: [
          "8613000000003@s.whatsapp.net",
          "8613000000004@s.whatsapp.net"
        ]
      }
    });
  });

  it("does not retry a failed detail request and surfaces the complete error", async () => {
    resetArmadaMockFailure(
      new Error("完整详情错误：协议邀请链接查询超时且没有可用链接")
    );
    const state = createDetailState();

    await state.open();

    assert.equal(armadaCalls().length, 1);
    assert.equal(state.linkGateOpen.value, false);
    assert.match(state.linkGateReason.value, /协议邀请链接查询超时/);
  });

  it("does not reload or refill detail after closing during a member mutation", async () => {
    let resolveMutation: (
      value: HistoricalGroupParticipantActionResult
    ) => void = () => undefined;
    const pendingMutation = new Promise<HistoricalGroupParticipantActionResult>(
      resolve => {
        resolveMutation = resolve;
      }
    );
    resetArmadaMockQueue([detail, pendingMutation, detail]);
    const state = createDetailState();
    await state.open();
    state.selectMembers(["8613000000003@s.whatsapp.net"]);

    const actionPromise = state.runParticipantAction("promote");
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.equal(state.actionLoading.value, true);
    assert.equal(armadaCalls().length, 2);

    state.close();
    assert.equal(state.actionLoading.value, false);
    resolveMutation({
      ok: true,
      partial: false,
      results: [
        {
          participantJid: "8613000000003@s.whatsapp.net",
          success: true,
          errorCode: null,
          errorMessage: null
        }
      ]
    });
    await actionPromise;

    assert.equal(state.detail.value, null);
    assert.equal(state.lastActionResult.value, null);
    assert.equal(state.actionLoading.value, false);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/historical-groups/detail",
        "/api/historical-groups/participants/promote"
      ]
    );
  });
});

describe("historical group detail template", () => {
  it("uses an on-demand drawer and keeps full link and failure values copyable", () => {
    assert.match(pageSource, /HistoricalGroupDetailDrawer/);
    assert.match(drawerSource, /el-drawer/);
    assert.match(drawerSource, /inviteUrl/);
    assert.match(drawerSource, /errorCode/);
    assert.match(drawerSource, /errorMessage/);
    assert.match(drawerSource, /readonly/);
    assert.match(drawerSource, /isAdministrator/);
    assert.doesNotMatch(drawerSource, /群链接硬门禁未通过/);
    assert.doesNotMatch(drawerSource, /mask|ellipsis/);
  });

  it("renders full member identity, protection reasons, item results and the execution panel", () => {
    for (const value of [
      "phone",
      "participantJid",
      "selfRole",
      "operationDisabledReason",
      "result.errorCode",
      "result.errorMessage"
    ]) {
      assert.match(memberTableSource, new RegExp(value.replace(".", "\\.")));
    }
    assert.match(memberTableSource, /设为管理员/);
    assert.doesNotMatch(memberTableSource, /批量降级/);
    assert.doesNotMatch(memberTableSource, /批量移除/);
    assert.match(composableSource, /ElMessageBox\.confirm/);
    assert.match(drawerSource, /HistoricalGroupPullPanel/);
  });
});

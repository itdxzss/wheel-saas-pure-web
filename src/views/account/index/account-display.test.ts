import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountStatusLabel,
  accountStatusTagType,
  accountRestrictionReasonLabel,
  accountTypeDeviceLabel,
  buildAccountStatCards,
  businessRestrictionLines,
  canDeleteAccount,
  clearOperationRestrictionsConfirmMessage,
  loginStateLabel,
  loginStateTagType,
  riskStatusLabel,
  sourceLabel
} from "./account-display";

describe("account list display helpers", () => {
  it("shows blank labels for accounts without reported status", () => {
    assert.equal(accountStatusLabel({ account_state: null }), "—");
    assert.equal(loginStateLabel(null), "—");
    assert.equal(riskStatusLabel(null), "—");
  });

  it("keeps lifecycle status independent from business restrictions", () => {
    assert.equal(
      accountStatusLabel({ account_state: 2, mute_status: 1 }),
      "正常"
    );
    assert.equal(
      accountStatusLabel({ account_state: 2, mute_status: 2 }),
      "正常"
    );
    assert.equal(
      accountStatusLabel({ account_state: 2, mute_status: 3 }),
      "正常"
    );
  });

  it("builds separate message and group join/pulling restriction lines", () => {
    assert.deepEqual(
      businessRestrictionLines({
        mute_status: 3,
        message_restriction_until: "2026-09-02 10:00:00",
        pulling_restriction_until: "2026-09-03 11:00:00"
      }),
      [
        {
          key: "message",
          label: "消息发送",
          until: "2026-09-02 10:00:00",
          source: "系统推断"
        },
        {
          key: "pulling",
          label: "进群拉人",
          until: "2026-09-03 11:00:00",
          source: "系统推断"
        }
      ]
    );
    assert.deepEqual(businessRestrictionLines({ mute_status: null }), []);
  });

  it("attributes message expiry to the platform only when it is not earlier than fallback", () => {
    const cases = [
      ["2026-10-09 12:00:00", null, "平台下发"],
      ["2026-10-09 12:00:00", "2026-10-09 11:59:59", "平台下发"],
      ["2026-10-09 12:00:00", "2026-10-09 12:00:00", "平台下发"],
      ["2026-10-09 12:00:00", "2026-10-09 12:00:01", "系统推断"],
      ["2026-10-09 12:00:00", "2026-10-09 12:00:00.001", "系统推断"],
      [null, "2026-10-09 12:00:00", "系统推断"],
      [null, null, "系统推断"],
      ["invalid", "2026-10-09 12:00:00", "系统推断"]
    ];
    for (const [platform, fallback, expected] of cases) {
      const lines = businessRestrictionLines({
        mute_status: 1,
        platform_message_restriction_until: platform,
        fallback_message_restriction_until: fallback
      });
      assert.equal(lines.length, 1);
      assert.equal(lines[0].source, expected, `${platform} / ${fallback}`);
    }
  });

  it("attributes pulling expiry only to an equal, valid platform expiry", () => {
    const cases = [
      ["2026-10-09 12:00:00", "2026-10-09 12:00:00", "平台下发"],
      ["2026-10-09T04:00:00Z", "2026-10-09 12:00:00", "平台下发"],
      ["2026-10-09 12:00:00", "2026-10-09 11:59:59", "系统推断"],
      ["2026-10-09 12:00:00", "2026-10-09 12:00:01", "系统推断"],
      ["2026-10-09 12:00:00", "2026-10-09 12:00:00.001", "系统推断"],
      ["2026-10-09 12:00:00", null, "系统推断"],
      [null, null, "系统推断"],
      ["invalid", "invalid", "系统推断"]
    ];
    for (const [platform, pulling, expected] of cases) {
      const lines = businessRestrictionLines({
        mute_status: 2,
        platform_message_restriction_until: platform,
        pulling_restriction_until: pulling
      });
      assert.equal(lines.length, 1);
      assert.equal(lines[0].source, expected, `${platform} / ${pulling}`);
    }
  });

  it("warns about only unexpired platform restrictions with their latest Beijing expiry", () => {
    const now = Date.parse("2026-10-08T12:00:00+08:00");
    const message = clearOperationRestrictionsConfirmMessage(
      [
        { platform_message_restriction_until: "2026-10-08 13:00:00" },
        { platform_message_restriction_until: "2026-10-08T06:00:00Z" },
        { platform_message_restriction_until: "2026-10-08 11:59:59" },
        { platform_message_restriction_until: "2026-10-08 12:00:00" },
        { platform_message_restriction_until: null },
        { platform_message_restriction_until: "invalid" }
      ],
      now
    );
    assert.match(message, /选中的 6 个账号/);
    assert.match(message, /同时移除消息发送和进群拉人的本地风控时间/);
    assert.match(message, /其中 2 个账号的 WhatsApp 平台触达限制尚未到期/);
    assert.match(message, /最晚 2026-10-08 14:00:00 北京时间/);
    assert.match(message, /解除只清本地状态，平台仍会拒绝进群、拉人和新会话/);
  });

  it("warns when the platform expiry is just one millisecond after now", () => {
    const message = clearOperationRestrictionsConfirmMessage(
      [{ platform_message_restriction_until: "2026-10-08 12:00:00.001" }],
      Date.parse("2026-10-08T12:00:00+08:00")
    );
    assert.match(message, /其中 1 个账号的 WhatsApp 平台触达限制尚未到期/);
  });

  it("does not show a platform warning for missing, invalid or expired expiries", () => {
    const message = clearOperationRestrictionsConfirmMessage(
      [
        {},
        { platform_message_restriction_until: null },
        { platform_message_restriction_until: "invalid" },
        { platform_message_restriction_until: "2026-10-08 12:00:00" }
      ],
      Date.parse("2026-10-08T12:00:00+08:00")
    );
    assert.doesNotMatch(message, /平台触达限制尚未到期/);
    assert.match(message, /后续新的风控结果仍会重新限制账号/);
  });

  it("shows a readable restriction reason while preserving unknown codes", () => {
    assert.equal(accountRestrictionReasonLabel("RATE_LIMITED"), "频率受限");
    assert.equal(
      accountRestrictionReasonLabel("ACCOUNT_REACHOUT_RESTRICTED"),
      "账号触达受限"
    );
    assert.equal(
      accountRestrictionReasonLabel("custom_reason"),
      "custom_reason"
    );
    assert.equal(accountRestrictionReasonLabel(null), "—");
    assert.equal(
      accountRestrictionReasonLabel("PULLING_RESTRICTED"),
      "进群拉人受限"
    );
  });

  it("maps login replaced takeover account status labels", () => {
    assert.equal(accountStatusLabel({ account_state: 6 }), "被抢登");
    assert.equal(accountStatusLabel({ account_state: 7 }), "抢登中");
  });

  it("maps restricted account status label and warning tag", () => {
    assert.equal(accountStatusLabel({ account_state: 8 }), "账号受限");
    assert.equal(accountStatusTagType({ account_state: 8 }), "warning");
  });

  it("shows confirmed deregistration independently from business restrictions", () => {
    assert.equal(
      accountStatusLabel({ account_state: 9, mute_status: 3 }),
      "注销"
    );
    assert.equal(accountStatusTagType({ account_state: 9 }), "info");
  });

  it("maps account status labels to tag types", () => {
    assert.equal(accountStatusTagType({ account_state: 2 }), "success");
    assert.equal(accountStatusTagType({ account_state: 4 }), "success");
    assert.equal(accountStatusTagType({ account_state: 3 }), "danger");
    assert.equal(accountStatusTagType({ account_state: 5 }), "danger");
    assert.equal(accountStatusTagType({ account_state: 6 }), "warning");
    assert.equal(accountStatusTagType({ account_state: 7 }), "warning");
    assert.equal(
      accountStatusTagType({ account_state: 2, mute_status: 1 }),
      "success"
    );
    assert.equal(
      accountStatusTagType({ account_state: 2, mute_status: 3 }),
      "success"
    );
    assert.equal(accountStatusTagType({ account_state: 1 }), "info");
    assert.equal(accountStatusTagType({ account_state: null }), "info");
  });

  it("maps login states to labels and tag types", () => {
    assert.equal(loginStateLabel(1), "在线");
    assert.equal(loginStateLabel(2), "离线");
    assert.equal(loginStateLabel(3), "待上线");
    assert.equal(loginStateTagType(1), "success");
    assert.equal(loginStateTagType(2), "danger");
    assert.equal(loginStateTagType(3), "warning");
    assert.equal(loginStateTagType(null), "info");
  });

  it("combines account type with device and channel with source", () => {
    assert.equal(
      accountTypeDeviceLabel({ account_type: "个人号", device_os: "安卓" }),
      "个人号 / 安卓"
    );
    assert.equal(
      accountTypeDeviceLabel({ account_type: "商业号", device_os: null }),
      "商业号"
    );
    assert.equal(
      accountTypeDeviceLabel({
        account_type: "商业号",
        account_type_verify_status: 1,
        business_verification_level: 1,
        device_os: "苹果"
      }),
      "商业号（已确认） / 苹果 / 蓝标"
    );
    assert.equal(
      accountTypeDeviceLabel({
        account_type: "商业号",
        declared_account_type: "个人号",
        account_type_verify_status: 2,
        device_os: "安卓"
      }),
      "商业号（已纠正，导入个人号） / 安卓"
    );
    assert.equal(
      accountTypeDeviceLabel({
        account_type: "个人号",
        declared_account_type: "个人号",
        account_type_verify_status: 0,
        device_os: null
      }),
      "个人号（校验中）"
    );
    assert.equal(
      sourceLabel({ channel_name: "Google", number_source: "买量" }),
      "Google / 买量"
    );
    assert.equal(
      sourceLabel({ channel_name: "", number_source: "自购" }),
      "自购"
    );
  });

  it("uses backend pending-online and restricted account statistics", () => {
    const cards = buildAccountStatCards({
      total: 10,
      banned: 1,
      unbound: 2,
      muted: 3,
      exported: 4,
      restricted: 5,
      restrictedTotal: 15,
      online: 3,
      offline: 2,
      pendingOnline: 1,
      risk: 1,
      assigned: 4,
      unassigned: 6
    });

    assert.deepEqual(
      cards.map(card => [card.key, card.label, card.value]),
      [
        ["total", "总账号数", 10],
        ["restricted", "异常账号", 15],
        ["online", "在线账号", 3],
        ["offline", "离线账号", 2],
        ["pendingOnline", "待上线账号", 1],
        ["risk", "风控账号", 1],
        ["assigned", "已分配账号", 4],
        ["unassigned", "未分配账号", 6]
      ]
    );
    assert.deepEqual(cards[1].subItems, [
      { label: "封禁", value: 1 },
      { label: "解绑", value: 2 },
      { label: "操作受限", value: 3 },
      { label: "导出", value: 4 },
      { label: "受限", value: 5 }
    ]);
  });

  it("only enables delete for terminal and undispatched accounts", () => {
    assert.equal(
      canDeleteAccount({ account_state: 3, dispatched_at: null }),
      true
    );
    assert.equal(
      canDeleteAccount({ account_state: 4, dispatched_at: null }),
      true
    );
    assert.equal(
      canDeleteAccount({ account_state: 5, dispatched_at: null }),
      true
    );
    assert.equal(
      canDeleteAccount({ account_state: 6, dispatched_at: null }),
      true
    );
    assert.equal(
      canDeleteAccount({ account_state: 2, dispatched_at: null }),
      false
    );
    assert.equal(
      canDeleteAccount({ account_state: null, dispatched_at: null }),
      false
    );
    assert.equal(
      canDeleteAccount({
        account_state: 4,
        dispatched_at: "2026-06-29 12:00:00"
      }),
      false
    );
    assert.equal(
      canDeleteAccount({
        account_state: 6,
        dispatched_at: "2026-06-29 12:00:00"
      }),
      false
    );
  });

  it("allows deregistered accounts to be deleted only after task release", () => {
    assert.equal(
      canDeleteAccount({ account_state: 9, dispatched_at: null }),
      true
    );
    assert.equal(
      canDeleteAccount({
        account_state: 9,
        dispatched_at: "2026-10-08 12:00:00"
      }),
      false
    );
  });
});

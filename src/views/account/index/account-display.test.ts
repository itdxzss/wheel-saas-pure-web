import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountStatusLabel,
  accountStatusTagType,
  accountTypeDeviceLabel,
  buildAccountStatCards,
  canDeleteAccount,
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

  it("keeps mute status ahead of normal account state labels", () => {
    assert.equal(
      accountStatusLabel({ account_state: 2, mute_status: "6h" }),
      "禁言6小时"
    );
    assert.equal(
      accountStatusLabel({ account_state: 2, mute_status: "24h" }),
      "禁言24小时"
    );
  });

  it("maps account status labels to tag types", () => {
    assert.equal(accountStatusTagType({ account_state: 2 }), "success");
    assert.equal(accountStatusTagType({ account_state: 4 }), "success");
    assert.equal(accountStatusTagType({ account_state: 3 }), "danger");
    assert.equal(accountStatusTagType({ account_state: 5 }), "danger");
    assert.equal(
      accountStatusTagType({ account_state: 2, mute_status: "6h" }),
      "danger"
    );
    assert.equal(
      accountStatusTagType({ account_state: 2, mute_status: "24h" }),
      "danger"
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
      restrictedTotal: 10,
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
        ["restricted", "异常账号", 10],
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
      { label: "禁言", value: 3 },
      { label: "导出", value: 4 }
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
  });
});

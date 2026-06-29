import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountStatusLabel,
  accountTypeDeviceLabel,
  buildAccountStatCards,
  canDeleteAccount,
  loginStateLabel,
  riskStatusLabel,
  sourceLabel
} from "./account-display";

describe("account list display helpers", () => {
  it("shows pending-online state for accounts without reported status", () => {
    assert.equal(accountStatusLabel({ account_state: null }), "待上线");
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

  it("adds pending-online statistic from total minus online and offline", () => {
    const cards = buildAccountStatCards({
      total: 10,
      banned: 1,
      online: 3,
      offline: 2,
      risk: 1,
      assigned: 4,
      unassigned: 6
    });

    assert.deepEqual(
      cards.map(card => [card.key, card.label, card.value]),
      [
        ["total", "总账号数", 10],
        ["banned", "封禁账号", 1],
        ["online", "在线账号", 3],
        ["offline", "离线账号", 2],
        ["pendingOnline", "待上线账号", 5],
        ["risk", "风控账号", 1],
        ["assigned", "已分配账号", 4],
        ["unassigned", "未分配账号", 6]
      ]
    );
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

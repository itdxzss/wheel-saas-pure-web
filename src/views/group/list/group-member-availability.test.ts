import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupMemberFallbackReason } from "./group-member-availability";

describe("group member availability", () => {
  it("shows a drawer member-list fallback for target-only groups", () => {
    const row = {
      id: 12,
      url: "chat.whatsapp.com/test",
      membershipState: 1,
      membershipStateLabel: "目标未进群",
      groupJid: null
    };

    assert.equal(
      groupMemberFallbackReason(row),
      "目标未进群，获取不到成员信息"
    );
  });

  it("shows a drawer member-list fallback for joined groups that still lack groupJid", () => {
    const row = {
      id: 13,
      url: "chat.whatsapp.com/test",
      membershipState: 2,
      membershipStateLabel: "已进群",
      groupJid: null
    };

    assert.equal(
      groupMemberFallbackReason(row),
      "群 JID 未解析，请先预览或等待账号群同步"
    );
  });

  it("loads members for groups that are joined and have groupJid", () => {
    const row = {
      id: 14,
      url: "chat.whatsapp.com/test",
      membershipState: 2,
      membershipStateLabel: "已进群",
      groupJid: "120363@test.g.us"
    };

    assert.equal(groupMemberFallbackReason(row), null);
  });
});

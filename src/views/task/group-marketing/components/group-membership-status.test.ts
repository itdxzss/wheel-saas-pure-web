import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { groupMembershipStatusMeta } from "./group-membership-status.ts";

describe("group membership status meta", () => {
  it("maps all confirmed membership states", () => {
    assert.equal(groupMembershipStatusMeta("IN_GROUP").label, "在群");
    assert.equal(groupMembershipStatusMeta("UNCONFIRMED").label, "未确认");
    assert.equal(groupMembershipStatusMeta("KICKED_OUT").label, "被踢出");
    assert.equal(groupMembershipStatusMeta("LEFT").label, "已主动退出");
    assert.equal(groupMembershipStatusMeta("NOT_IN_GROUP").label, "已不在群");
  });

  it("falls back safely for old and future responses", () => {
    assert.equal(groupMembershipStatusMeta(undefined).label, "未确认");
    assert.equal(groupMembershipStatusMeta("FUTURE_STATE").label, "未确认");
  });
});

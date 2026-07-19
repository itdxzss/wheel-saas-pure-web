import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { groupSendStatusMeta } from "./group-send-status.ts";

describe("group send status meta", () => {
  it("maps the unified backend states to the required labels and colors", () => {
    assert.equal(groupSendStatusMeta("NORMAL").label, "正常");
    assert.equal(groupSendStatusMeta("NORMAL").tagType, "success");
    assert.equal(groupSendStatusMeta("ACCOUNT_BANNED").label, "账号封禁");
    assert.equal(groupSendStatusMeta("ACCOUNT_BANNED").tagType, "danger");
    assert.equal(groupSendStatusMeta("GROUP_BANNED").label, "群组封禁");
    assert.equal(groupSendStatusMeta("GROUP_BANNED").tagType, "danger");
    assert.equal(groupSendStatusMeta("NO_PERMISSION").label, "没有权限");
    assert.equal(groupSendStatusMeta("NO_PERMISSION").tagType, "info");
    assert.equal(groupSendStatusMeta("KICKED_OUT").label, "被踢出群聊");
    assert.equal(groupSendStatusMeta("KICKED_OUT").tagType, "danger");
    assert.equal(groupSendStatusMeta("UNCONFIRMED").label, "未确认");
    assert.equal(groupSendStatusMeta("UNCONFIRMED").tagType, "info");
  });

  it("falls back to unconfirmed for a missing or future status", () => {
    assert.equal(groupSendStatusMeta(null).label, "未确认");
    assert.equal(groupSendStatusMeta("FUTURE_STATUS").label, "未确认");
  });
});

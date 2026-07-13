import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { groupSendStatusMeta } from "./group-send-status.ts";

describe("group send status meta", () => {
  it("maps the four backend states to the required labels and colors", () => {
    assert.deepEqual(groupSendStatusMeta("NORMAL"), {
      label: "正常",
      tagType: "success",
      className: ""
    });
    assert.deepEqual(groupSendStatusMeta("BANNED"), {
      label: "封禁",
      tagType: "danger",
      className: ""
    });
    assert.deepEqual(groupSendStatusMeta("NO_PERMISSION"), {
      label: "没有权限",
      tagType: "info",
      className: "group-status--no-permission"
    });
    assert.deepEqual(groupSendStatusMeta("UNCONFIRMED"), {
      label: "未确认",
      tagType: "info",
      className: ""
    });
  });

  it("falls back to unconfirmed for a missing or future status", () => {
    assert.equal(groupSendStatusMeta(null).label, "未确认");
    assert.equal(groupSendStatusMeta("FUTURE_STATUS").label, "未确认");
  });
});

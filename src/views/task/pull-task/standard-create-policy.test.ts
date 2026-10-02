import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPullInterval } from "./standard-create-policy";

describe("saved pull interval display", () => {
  it("renders historical settings without a maximum as a fixed interval", () => {
    assert.equal(formatPullInterval(15), "15 秒");
    assert.equal(formatPullInterval(15, null), "15 秒");
    assert.equal(formatPullInterval(15, 15), "15 秒");
  });

  it("shows both persisted endpoints without turning a range into a fixed delay", () => {
    assert.equal(formatPullInterval(10, 15), "10–15 秒（随机）");
    assert.equal(formatPullInterval(11, 14), "11–14 秒（随机）");
  });
});

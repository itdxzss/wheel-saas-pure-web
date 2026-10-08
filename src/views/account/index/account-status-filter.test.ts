import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountStatusOptions,
  accountStatusToQuery
} from "./account-status-filter";

describe("account status filter mapping", () => {
  it("includes restricted account status option", () => {
    assert.equal(accountStatusOptions.includes("账号受限"), true);
  });

  it("maps restricted status to accountState 8", () => {
    assert.deepEqual(accountStatusToQuery("账号受限"), { accountState: 8 });
  });

  it("offers a deregistered filter and maps it to accountState 9", () => {
    assert.equal(accountStatusOptions.includes("注销"), true);
    assert.deepEqual(accountStatusToQuery("注销"), { accountState: 9 });
  });

  it("maps operation restriction status without accountState", () => {
    assert.deepEqual(accountStatusToQuery("消息发送受限"), { muteStatus: 1 });
    assert.deepEqual(accountStatusToQuery("拉人受限"), { muteStatus: 2 });
    assert.deepEqual(accountStatusToQuery("消息和拉人受限"), {
      muteStatus: 3
    });
  });

  it("maps empty status to empty query patch", () => {
    assert.deepEqual(accountStatusToQuery(""), {});
  });
});

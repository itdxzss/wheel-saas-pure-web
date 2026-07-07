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

  it("maps mute status without accountState", () => {
    assert.deepEqual(accountStatusToQuery("禁言6小时"), { muteStatus: 1 });
    assert.deepEqual(accountStatusToQuery("禁言24小时"), { muteStatus: 2 });
  });

  it("maps empty status to empty query patch", () => {
    assert.deepEqual(accountStatusToQuery(""), {});
  });
});

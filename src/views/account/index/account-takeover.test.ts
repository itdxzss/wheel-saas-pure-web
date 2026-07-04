import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isTakeoverCandidate,
  takeoverBatchDisabledTip,
  TAKEOVER_SELECTION_MESSAGE
} from "./account-takeover";

describe("account takeover helpers", () => {
  it("accepts only login replaced accounts without mute status", () => {
    assert.equal(isTakeoverCandidate({ account_state: 6, mute_status: null }), true);
    assert.equal(isTakeoverCandidate({ account_state: 6, mute_status: "6h" }), false);
    assert.equal(isTakeoverCandidate({ account_state: 7, mute_status: null }), false);
    assert.equal(isTakeoverCandidate({ account_state: 2, mute_status: null }), false);
  });

  it("returns disabled tips for empty or mixed takeover selections", () => {
    assert.equal(takeoverBatchDisabledTip([]), "请先选择账号");
    assert.equal(
      takeoverBatchDisabledTip([
        { account_state: 6, mute_status: null },
        { account_state: 2, mute_status: null }
      ]),
      TAKEOVER_SELECTION_MESSAGE
    );
    assert.equal(
      takeoverBatchDisabledTip([
        { account_state: 6, mute_status: null },
        { account_state: 6, mute_status: null }
      ]),
      ""
    );
  });
});

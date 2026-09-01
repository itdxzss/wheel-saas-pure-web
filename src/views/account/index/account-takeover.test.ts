import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterOnlineSubmittableAccounts,
  isTakeoverCandidate,
  isTerminalOnlineBlockedAccount,
  onlineBlockedTip,
  singleOnlineBlockedTip,
  takeoverBatchDisabledTip,
  TERMINAL_ONLINE_BLOCKED_MESSAGE,
  TAKING_OVER_ONLINE_MESSAGE,
  TAKEOVER_SELECTION_MESSAGE
} from "./account-takeover";

describe("account takeover helpers", () => {
  it("accepts only login replaced accounts without mute status", () => {
    assert.equal(
      isTakeoverCandidate({ account_state: 6, mute_status: null }),
      true
    );
    assert.equal(
      isTakeoverCandidate({ account_state: 6, mute_status: 1 }),
      false
    );
    assert.equal(
      isTakeoverCandidate({ account_state: 7, mute_status: null }),
      false
    );
    assert.equal(
      isTakeoverCandidate({ account_state: 2, mute_status: null }),
      false
    );
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

  it("blocks online actions for taking-over accounts", () => {
    assert.equal(onlineBlockedTip([{ account_state: 2 }]), "");
    assert.equal(
      onlineBlockedTip([{ account_state: 2 }, { account_state: 7 }]),
      TAKING_OVER_ONLINE_MESSAGE
    );
  });

  it("blocks online actions for terminal account states", () => {
    assert.equal(isTerminalOnlineBlockedAccount({ account_state: 3 }), true);
    assert.equal(isTerminalOnlineBlockedAccount({ account_state: 5 }), true);
    assert.equal(isTerminalOnlineBlockedAccount({ account_state: 4 }), false);
    assert.equal(isTerminalOnlineBlockedAccount({ account_state: 2 }), false);
    assert.equal(
      singleOnlineBlockedTip({ account_state: 3 }),
      TERMINAL_ONLINE_BLOCKED_MESSAGE
    );
    assert.equal(
      onlineBlockedTip([{ account_state: 2 }, { account_state: 3 }]),
      ""
    );
  });

  it("filters terminal account states from batch online submission", () => {
    const result = filterOnlineSubmittableAccounts([
      { id: 100, account_state: 2 },
      { id: 101, account_state: 3 },
      { id: 102, account_state: 5 },
      { id: 103, account_state: 4 }
    ]);

    assert.deepEqual(result.submittableIds, [100, 103]);
    assert.equal(result.skippedCount, 2);
  });
});

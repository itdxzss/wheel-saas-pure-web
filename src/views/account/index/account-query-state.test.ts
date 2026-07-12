import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TenantAccountBatchQuery } from "../../../api/account";
import { createAccountQueryState } from "./account-query-state";

describe("account applied query state", () => {
  it("has no applied filters until the first successful query commits", () => {
    const state = createAccountQueryState();

    assert.equal(state.hasApplied(), false);
    assert.equal(state.applied(), null);

    const initialRequest = state.begin({ accountGroupId: 7 });
    assert.equal(state.commit(initialRequest), true);
    assert.equal(state.hasApplied(), true);
    assert.deepEqual(state.applied(), { accountGroupId: 7 });
  });

  it("does not apply edited filters before a successful request", () => {
    const state = createAccountQueryState();
    state.commit(state.begin({ loginState: 2 }));

    const pending = state.begin({ country: "美国", accountState: 3 });

    assert.deepEqual(state.applied(), { loginState: 2 });
    assert.deepEqual(pending.filters, { country: "美国", accountState: 3 });
  });

  it("only lets the latest successful request replace applied filters", () => {
    const state = createAccountQueryState();
    const oldRequest = state.begin({ country: "印度" });
    const latestRequest = state.begin({ country: "美国" });

    assert.equal(state.commit(oldRequest), false);
    assert.equal(state.commit(latestRequest), true);
    assert.deepEqual(state.applied(), { country: "美国" });
  });

  it("keeps defensive copies of pending and applied filters", () => {
    const initial: TenantAccountBatchQuery = { loginState: 2 };
    const state = createAccountQueryState();
    state.commit(state.begin(initial));
    const editing = { country: "印度" };
    const pending = state.begin(editing);

    initial.loginState = 1;
    editing.country = "美国";

    assert.deepEqual(state.applied(), { loginState: 2 });
    assert.deepEqual(pending.filters, { country: "印度" });
  });

  it("changes the applied revision only after the latest query commits", () => {
    const state = createAccountQueryState();
    const originalRevision = state.appliedRevision();
    const pending = state.begin({ country: "美国" });

    assert.equal(state.appliedRevision(), originalRevision);
    assert.equal(state.commit(pending), true);
    assert.notEqual(state.appliedRevision(), originalRevision);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEmptyGroupPullDraft,
  emptyTargetDataMetrics,
  showScheduledStart,
  showSendRounds
} from "./create-draft";

describe("group pull marketing create draft", () => {
  it("creates an independent draft with prototype defaults", () => {
    const first = createEmptyGroupPullDraft();
    const second = createEmptyGroupPullDraft();

    assert.equal(first.groupSource, "HISTORICAL");
    assert.equal(first.sendMode, "ROUNDS");
    assert.equal(first.startMode, "IMMEDIATE");
    assert.equal(first.groupMaxMembers, 300);
    assert.equal(first.pullerCountPerGroup, 2);
    assert.equal(first.marketingIntervalMinutes, 10);
    first.unmetActions.push("MANUAL");
    assert.deepEqual(second.unmetActions, []);
  });

  it("uses missing metrics instead of fabricated zero values", () => {
    assert.deepEqual(Object.values(emptyTargetDataMetrics()), [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ]);
  });

  it("derives conditional field visibility", () => {
    assert.equal(showScheduledStart("IMMEDIATE"), false);
    assert.equal(showScheduledStart("SCHEDULED"), true);
    assert.equal(showSendRounds("ROUNDS"), true);
    assert.equal(showSendRounds("DURATION"), false);
  });
});

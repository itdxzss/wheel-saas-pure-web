import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const moduleUrl = new URL("./create-draft.ts", import.meta.url);

describe("pull task GROUP_MARKETING create draft", () => {
  it("creates independent drafts with the fixed task type", async () => {
    assert.ok(
      existsSync(fileURLToPath(moduleUrl)),
      "create-draft.ts should exist"
    );
    const { createEmptyPullTaskMarketingDraft } = await import(moduleUrl.href);
    const first = createEmptyPullTaskMarketingDraft();
    const second = createEmptyPullTaskMarketingDraft();

    assert.equal(first.taskType, "GROUP_MARKETING");
    assert.equal("subMode" in first, false);
    assert.equal(first.groupSource, "HISTORICAL");
    assert.equal(first.sendMode, "ROUNDS");
    assert.equal(first.startMode, "IMMEDIATE");
    assert.equal(first.groupMaxMembers, 300);
    assert.equal(first.pullerCountPerGroup, 2);
    assert.equal(first.marketingIntervalMinutes, 10);
    first.unmetActions.push("MANUAL");
    assert.deepEqual(second.unmetActions, []);
  });

  it("uses missing metrics instead of fabricated zeros", async () => {
    assert.ok(existsSync(fileURLToPath(moduleUrl)));
    const { emptyTargetDataMetrics } = await import(moduleUrl.href);

    assert.deepEqual(
      Object.values(emptyTargetDataMetrics()),
      Array(9).fill(null)
    );
  });

  it("derives conditional field visibility", async () => {
    assert.ok(existsSync(fileURLToPath(moduleUrl)));
    const { showScheduledStart, showSendRounds } = await import(moduleUrl.href);

    assert.equal(showScheduledStart("IMMEDIATE"), false);
    assert.equal(showScheduledStart("SCHEDULED"), true);
    assert.equal(showSendRounds("ROUNDS"), true);
    assert.equal(showSendRounds("DURATION"), false);
  });
});

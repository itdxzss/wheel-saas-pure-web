import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupPullMarketingSummary.vue", import.meta.url),
  "utf8"
);

describe("group pull marketing summary", () => {
  it("shows the saved material interval and fixed random rule", () => {
    assert.match(source, /label="拉料间隔"/);
    assert.match(source, /detail\.materialEntryIntervalSeconds \/ 60/);
    assert.match(source, /materialEntryIntervalHint/);
  });
});

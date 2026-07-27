import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { materialEntryIntervalHint } from "./material-entry-interval";

describe("group pull material entry interval", () => {
  it("formats the fixed twenty percent random window", () => {
    assert.equal(
      materialEntryIntervalHint(5),
      "实际每次随机等待 4～6 分钟（±20%）"
    );
    assert.equal(
      materialEntryIntervalHint(1),
      "实际每次随机等待 0.8～1.2 分钟（±20%）"
    );
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("group pull marketing index", () => {
  it("renders all five task-list filters", () => {
    for (const label of [
      "任务ID",
      "任务名称",
      "任务状态",
      "阻塞原因",
      "资源状态"
    ]) {
      assert.match(source, new RegExp(`label="${label}"`));
    }
    assert.match(source, /blockReasonOptions/);
    assert.match(source, /resourceStatusOptions/);
    assert.match(source, /searchForm\.blockReason/);
    assert.match(source, /searchForm\.resourceStatus/);
  });
});

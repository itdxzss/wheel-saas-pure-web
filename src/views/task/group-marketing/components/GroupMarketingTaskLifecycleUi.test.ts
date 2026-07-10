import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("group marketing task lifecycle ui", () => {
  it("uses one lifecycle button for start pause and resume, plus manual close for active tasks", () => {
    const table = source("./GroupMarketingTaskTable.vue");

    assert.match(table, /v-if="\[1, 2, 5\]\.includes\(row\.status\)"/);
    assert.match(table, /taskLifecycleAction\(row\.status\)/);
    assert.match(table, /taskLifecycleLabel\(row\.status\)/);
    assert.match(table, /return "start"/);
    assert.match(table, /return "pause"/);
    assert.match(table, /return "resume"/);
    assert.match(table, /'close'/);
    assert.match(table, />\s*手动关闭\s*<\/el-button>/);
    assert.doesNotMatch(table, /重新启动/);
  });

  it("removes restart API and dialog wiring from ordinary marketing", () => {
    const page = source("../index.vue");
    const api = source("../../../../api/marketing-task.ts");

    assert.doesNotMatch(page, /useMarketingTaskRestart/);
    assert.doesNotMatch(page, /GroupMarketingRestartDialog/);
    assert.doesNotMatch(page, /action === "restart"/);
    assert.doesNotMatch(api, /restartMarketingTask/);
    assert.doesNotMatch(api, /\/restart/);
  });

  it("only exposes marketing material editing for non-terminal tasks", () => {
    const table = source("./GroupMarketingTaskTable.vue");

    assert.match(table, /v-if="canModifyTaskMaterial\(row\.status\)"/);
  });
});

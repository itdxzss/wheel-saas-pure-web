import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("group marketing task lifecycle ui", () => {
  it("shows ordinary start only for waiting and stopped tasks, and restart only for ended tasks", () => {
    const table = source("./GroupMarketingTaskTable.vue");

    assert.match(table, /v-if="\[1, 5\]\.includes\(row\.status\)"/);
    assert.match(table, />\s*启动\s*<\/el-button>/);
    assert.match(table, /v-if="row\.status === 7"/);
    assert.match(table, /'restart'/);
    assert.match(table, />\s*重新启动\s*<\/el-button>/);
    assert.doesNotMatch(table, /:disabled="row\.status === 2"/);
  });

  it("provides required start and end datetime fields in the restart dialog", () => {
    const dialog = source("./GroupMarketingRestartDialog.vue");

    assert.match(dialog, /title="重新启动营销任务"/);
    assert.match(dialog, /label="任务开始时间" required/);
    assert.match(dialog, /v-model="form\.taskStartAt"/);
    assert.match(dialog, /label="任务结束时间" required/);
    assert.match(dialog, /v-model="form\.taskEndAt"/);
    assert.equal((dialog.match(/value-format="x"/g) ?? []).length, 2);
    assert.match(dialog, /:loading="submitting"/);
    assert.match(dialog, /:show-close="!submitting"/);
    assert.match(dialog, /:close-on-press-escape="!submitting"/);
  });

  it("wires restart action and dialog through the page", () => {
    const page = source("../index.vue");

    assert.match(page, /useMarketingTaskRestart/);
    assert.match(page, /action === "restart"/);
    assert.match(page, /<GroupMarketingRestartDialog/);
    assert.match(page, /@submit="submitRestart"/);
  });
});

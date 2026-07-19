import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMarketingDetailDrawer.vue", import.meta.url),
  "utf8"
);

describe("group marketing detail drawer", () => {
  it("uses account rollup rows and lightweight group dropdown", () => {
    assert.match(source, /accountTargets/);
    assert.match(source, /label="号发送总条数"/);
    assert.match(source, /type="expand"/);
    assert.match(source, /class="group-rollup-header"/);
    assert.match(source, /class="group-rollup-first-row"/);
    assert.match(source, /class="group-rollup-detail-list"/);
    assert.doesNotMatch(source, /:data="asAccountRow\(row\)\.groups"/);
    assert.match(source, /firstGroupSummary/);
  });

  it("shows status and execution result before the remaining group fields", () => {
    for (const label of [
      "状态",
      "执行情况",
      "单群发送条数",
      "群组链接",
      "群组名称",
      "最近原因",
      "最后发送时间"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(
      source,
      /<span>状态<\/span>\s*<span>执行情况<\/span>\s*<span>单群发送条数<\/span>/
    );
    assert.match(source, /groupSendStatusMeta/);
    assert.match(source, /groupExecutionResultMeta/);
    assert.match(source, /group-status--no-permission/);
    assert.match(source, /group\.executionResult/);
    assert.match(
      source,
      /firstGroup\(asAccountRow\(row\)\)\?\.executionResult/
    );
  });

  it("renames summary sent count and removes summary last sent time", () => {
    const descriptions = source.match(
      /<el-descriptions[\s\S]*?<\/el-descriptions>/
    );
    assert.ok(descriptions, "summary descriptions should exist");
    assert.match(descriptions[0], /label="总发送条数"/);
    assert.doesNotMatch(descriptions[0], /label="最后发送时间"/);
  });
});

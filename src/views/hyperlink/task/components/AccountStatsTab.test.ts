import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(new URL("./AccountStatsTab.vue", import.meta.url)),
  "utf8"
);
const accountCell = readFileSync(
  fileURLToPath(new URL("./AccountStatAccountCell.vue", import.meta.url)),
  "utf8"
);

describe("AccountStatsTab contract", () => {
  it("contains every required filter and real action", () => {
    for (const text of [
      "发送时间",
      "发信国家",
      "成功率",
      "搜索",
      "重置",
      "导出",
      "重试"
    ]) {
      assert.ok(source.includes(text), `missing ${text}`);
    }
    assert.match(source, /<PureTableBar[\s\S]*@refresh="refresh"/);
    assert.match(source, /:columns="columns"/);
    assert.match(source, /@change="load"/);
    assert.match(source, /:page-sizes="\[10, 20, 50, 100, 200\]"/);
  });

  it("renders all eight frozen columns and remote sorting", () => {
    for (const label of [
      "发送账号",
      "国家",
      "账号类型",
      "存活天数",
      "单钩数",
      "双钩数",
      "失败数",
      "最后发送时间"
    ]) {
      assert.ok(source.includes(`label=\"${label}\"`), `missing ${label}`);
    }
    assert.match(source, /sortable="custom"/);
    assert.match(source, /@sort-change="handleSortChange"/);
  });

  it("keeps the competitor-compatible unassigned aggregate row", () => {
    assert.match(accountCell, /row\.accountId == null/);
    assert.match(accountCell, /未分配/);
    assert.match(source, /row\.bucketKey/);
  });

  it("reuses H4 summary rather than rendering another summary", () => {
    assert.match(source, /refresh-summary/);
    assert.doesNotMatch(source, /SummaryCards|summary-card|任务总发送/);
  });
});

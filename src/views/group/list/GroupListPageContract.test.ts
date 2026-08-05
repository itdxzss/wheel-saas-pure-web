import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

test("group list main filters match the approved prototype scope", () => {
  for (const label of [
    "群信息",
    "群组分组",
    "群类型",
    "状态",
    "可用管理员",
    "群成员数量",
    "历史群组筛选",
    "查询",
    "重置"
  ]) {
    assert.match(source, new RegExp(label));
  }
  assert.doesNotMatch(source, /label="来源文件"/);
  assert.doesNotMatch(source, /label="来源"/);
  assert.doesNotMatch(source, /label="关系"/);
  assert.match(source, /HistoricalGroupFilterDrawer/);
});

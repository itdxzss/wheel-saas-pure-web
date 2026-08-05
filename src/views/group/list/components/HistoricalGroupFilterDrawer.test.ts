import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./HistoricalGroupFilterDrawer.vue", import.meta.url),
  "utf8"
);

test("historical drawer contains approved fields, quick ranges and actions", () => {
  assert.match(source, /<el-drawer/);
  for (const label of [
    "群所属大洲",
    "群主国家",
    "建群天数",
    "群成员数量",
    "0-7天",
    "365天以上",
    "0-50人",
    "500人以上",
    "清空",
    "应用",
    "查询"
  ]) {
    assert.match(source, new RegExp(label));
  }
  for (const code of [
    "ASIA",
    "AFRICA",
    "EUROPE",
    "NORTH_AMERICA",
    "SOUTH_AMERICA",
    "OCEANIA"
  ]) {
    assert.match(source, new RegExp(code));
  }
});

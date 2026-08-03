import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiSource = readFileSync(
  new URL("../../../../api/group.ts", import.meta.url),
  "utf8"
);
const constantsSource = readFileSync(
  new URL("../constants.ts", import.meta.url),
  "utf8"
);
const tableSource = readFileSync(
  new URL("./GroupListTable.vue", import.meta.url),
  "utf8"
);

test("group list renders persisted sync protocol source mask", () => {
  assert.match(apiSource, /syncProtocolMask\?: number/);
  assert.match(constantsSource, /label: "同步协议", prop: "syncProtocolMask"/);
  assert.match(tableSource, /hasSyncProtocol\(row\.syncProtocolMask, 1\)/);
  assert.match(tableSource, /hasSyncProtocol\(row\.syncProtocolMask, 2\)/);
  assert.match(tableSource, />\s*JSON号/);
  assert.match(tableSource, />\s*六段号/);
});

test("group list exposes group folder toolbar and name tag", () => {
  assert.match(apiSource, /folderName\?: string \| null/);
  assert.match(tableSource, /管理群组分组/);
  assert.match(tableSource, /批量分组/);
  assert.match(tableSource, /emit\('manage-folders'\)/);
  assert.match(tableSource, /emit\('assign-folder'\)/);
  assert.match(tableSource, /row\.folderName/);
});

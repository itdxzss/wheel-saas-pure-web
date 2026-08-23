import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./GroupFolderManageDialog.vue", import.meta.url),
  "utf8"
);

test("group folder manager exposes CRUD and safe deletion warning", () => {
  assert.match(source, /listGroupFolders/);
  assert.match(source, /createGroupFolder/);
  assert.match(source, /updateGroupFolder/);
  assert.match(source, /batchDeleteGroupFolders/);
  assert.match(source, /群组数量/);
  assert.match(source, /将进入未分组/);
  assert.match(source, /emit\("changed", \[row\.id\]\)/);
  assert.match(source, /row\.systemBuiltin/);
  assert.match(source, /系统分组/);
});

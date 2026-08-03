import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(
  new URL("./index.vue", import.meta.url),
  "utf8"
);
const tableSource = readFileSync(
  new URL("./components/GroupListTable.vue", import.meta.url),
  "utf8"
);
const composableSource = readFileSync(
  new URL("./composables/useGroupListPage.ts", import.meta.url),
  "utf8"
);

test("group list wires folder filter management and batch assignment", () => {
  assert.match(indexSource, /GroupFolderManageDialog/);
  assert.match(indexSource, /BatchAssignFolderDialog/);
  assert.match(indexSource, /全部分组/);
  assert.match(indexSource, /未分组/);
  assert.match(indexSource, /刷新分组/);
  assert.match(indexSource, /@manage-folders=/);
  assert.match(indexSource, /@assign-folder=/);
  assert.match(tableSource, /event: "manage-folders"/);
  assert.match(tableSource, /event: "assign-folder"/);
  assert.match(tableSource, /row\.folderName/);
  assert.match(composableSource, /folderFilter: "" \| "UNASSIGNED" \| number/);
  assert.match(composableSource, /batchAssignGroupFolder/);
  assert.match(composableSource, /reloadFolderOptions/);
  assert.match(composableSource, /withoutFolder:/);
});

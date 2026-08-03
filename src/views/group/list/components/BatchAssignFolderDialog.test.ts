import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("./BatchAssignFolderDialog.vue", import.meta.url),
  "utf8"
);

test("batch folder dialog supports assignment and unassignment", () => {
  assert.match(source, /selectedCount/);
  assert.match(source, /不绑定/);
  assert.match(source, /"submit", folderId: number \| null/);
  assert.match(source, /selectedFolderId\.value === "UNASSIGNED"/);
  assert.match(source, /:loading="loading"/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupCreationMarketingTaskTable.vue", import.meta.url),
  "utf8"
);

describe("group creation marketing task table", () => {
  it("exposes row selection before ID and an export action next to create", () => {
    assert.match(
      source,
      /\(event: "selection-change", rows: GroupCreationMarketingTaskRow\[\]\): void/
    );
    assert.match(
      source,
      /<el-table-column\s+type="selection"\s+width="48"\s+\/>/
    );
    assert.match(
      source,
      /新增建群营销[\s\S]*<el-button[\s\S]*@click="emit\('export-selected'\)"[\s\S]*>\s*导出/
    );
  });
});

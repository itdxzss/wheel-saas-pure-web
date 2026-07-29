import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("marketing task export UI", () => {
  it("places an authorized export action before create without selection disabling", () => {
    const table = source("./GroupMarketingTaskTable.vue");
    const exportAction = table.indexOf("emit('export')");
    const createAction = table.indexOf("emit('create')");

    assert.ok(exportAction >= 0 && exportAction < createAction);
    assert.match(table, /v-auth="'tenant:marketing_task:export'"/);
    assert.match(table, /:loading="exporting"/);
    assert.match(table, />\s*导出\s*<\/el-button>/);
  });

  it("uses an Element Plus dialog with both modes and searchable countries", () => {
    const dialog = source("./MarketingTaskExportDialog.vue");

    assert.match(dialog, /title="导出营销任务数据"/);
    assert.match(dialog, /value="COUNTRY_ENTRY"/);
    assert.match(dialog, /value="FULL"/);
    assert.match(dialog, /multiple/);
    assert.match(dialog, /filterable/);
    assert.match(dialog, /全选/);
    assert.match(dialog, /清空/);
    assert.match(dialog, /请至少选择一个国家或地区。/);
  });

  it("wires export through a separate composable and API module", () => {
    const page = source("../index.vue");
    const composable = source("../composables/useMarketingTaskExport.ts");

    assert.match(page, /useMarketingTaskExport/);
    assert.match(page, /MarketingTaskExportDialog/);
    assert.match(page, /@export="openExportDialog"/);
    assert.match(composable, /createMarketingTaskExport/);
    assert.match(composable, /downloadMarketingTaskExport/);
    assert.match(composable, /downloadBlobFile/);
  });
});

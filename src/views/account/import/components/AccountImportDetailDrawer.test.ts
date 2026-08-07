import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./AccountImportDetailDrawer.vue", import.meta.url),
  "utf8"
);

describe("account import detail drawer template", () => {
  it("renders the import task summary header before detail stats", () => {
    assert.match(
      source,
      /<div\s+class="detail-summary">[\s\S]*<strong>导入明细<\/strong>[\s\S]*<el-tag[\s\S]*{{\s*task\.import_type\s*\|\|\s*"未知类型"\s*}}[\s\S]*<el-tag[\s\S]*{{\s*task\.status\s*\|\|\s*"-"\s*}}[\s\S]*{{\s*task\.filename\s*\|\|\s*"-"\s*}}[\s\S]*创建时间 {{\s*formatDate\(task\.created_at\)\s*}}[\s\S]*当前展示 {{\s*detailRows\.length\s*}} 条明细记录[\s\S]*导出全部[\s\S]*导出失败[\s\S]*<\/div>/
    );
  });

  it("shows import, online and current account statuses as separate columns", () => {
    assert.match(source, /prop="status"\s+label="导入状态"/);
    assert.match(source, /prop="reason"\s+label="导入失败原因"/);
    assert.match(source, /row\.online_status/);
    assert.match(source, /label="上线\/状态原因"/);
    assert.match(source, /row\.account_status/);
    assert.match(source, /row\.login_status/);
  });
});

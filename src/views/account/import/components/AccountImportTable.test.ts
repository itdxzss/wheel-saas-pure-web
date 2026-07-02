import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./AccountImportTable.vue", import.meta.url),
  "utf8"
);

describe("account import table template", () => {
  it("aligns row operation links in one action container", () => {
    assert.match(
      source,
      /<div\s+class="account-import-actions">[\s\S]*>\s*明细\s*<\/el-button>[\s\S]*<el-dropdown[\s\S]*>\s*导出\s*<\/el-button>[\s\S]*<\/el-dropdown>[\s\S]*<\/div>/
    );
    assert.match(
      source,
      /\.account-import-actions\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;/
    );
  });
});

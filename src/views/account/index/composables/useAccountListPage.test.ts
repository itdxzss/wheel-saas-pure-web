import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(new URL("./useAccountListPage.ts", import.meta.url)),
  "utf8"
);

describe("account list applied filter readiness", () => {
  it("commits the initial form only after a successful load and guards batch actions before then", () => {
    assert.match(source, /const queryState = createAccountQueryState\(\);/);
    assert.match(source, /if \(appliedFilters === null\)/);
    assert.match(source, /loadAccountList\(initialRequest, 1, true\)/);
    assert.match(source, /if \(!queryState\.hasApplied\(\)/);
    assert.match(source, /账号列表尚未加载成功，请先查询后再执行批量操作/);
  });
});

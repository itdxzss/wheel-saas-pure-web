import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./ContactTaskAccountDrawer.vue", import.meta.url),
  "utf8"
);

describe("contact task account drawer", () => {
  it("renders the six competitor columns", () => {
    for (const label of [
      "账号ID",
      "账号手机号",
      "计划发送",
      "已发送",
      "失败",
      "进度"
    ]) {
      assert.match(source, new RegExp(label));
    }
  });

  it("tags each phone as valid or invalid", () => {
    assert.match(source, /有效/);
    assert.match(source, /无效/);
  });

  it("shows a progress bar per row", () => {
    assert.match(source, /<el-progress/);
    assert.match(source, /progressOf\(row\)/);
  });

  it("never divides by zero when nothing is planned", () => {
    assert.match(source, /if \(need <= 0\)/);
  });

  it("sorts the three numeric columns on the server", () => {
    assert.match(
      source,
      /SORTABLE_COLUMNS = \["needSendNum", "sentNum", "failNum"\]/
    );
    assert.match(source, /sortable="custom"/);
    assert.match(
      source,
      /sortOrder\.value = order === "ascending" \? "asc" : "desc"/
    );
  });

  it("refuses to sort by a column the backend ignores", () => {
    assert.match(source, /!SORTABLE_COLUMNS\.includes\(prop\)/);
  });

  it("offers the competitor page sizes", () => {
    assert.match(source, /\[10, 20, 50, 100, 200\]/);
  });

  it("resets paging and sorting each time it opens", () => {
    assert.match(source, /page\.value = 1;\s*\n\s*sortBy\.value = undefined;/);
  });
});

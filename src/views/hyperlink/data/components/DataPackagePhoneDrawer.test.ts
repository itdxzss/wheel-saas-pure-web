import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./DataPackagePhoneDrawer.vue", import.meta.url),
  "utf8"
);

describe("data package phone drawer", () => {
  it("shows contract phone fields and server-side filters", () => {
    for (const label of [
      "手机号",
      "国家",
      "池状态",
      "导入批次",
      "代次",
      "导入时间"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /v-model:current-page="currentPage"/);
    assert.match(source, /v-model:page-size="currentPageSize"/);
    assert.match(source, /:page-sizes="\[50, 100, 200\]"/);
    assert.match(source, /<el-empty description="暂无符合条件的号码"/);
  });
});

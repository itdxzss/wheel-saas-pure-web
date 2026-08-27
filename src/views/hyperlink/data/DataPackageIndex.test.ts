import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("hyperlink data package index", () => {
  it("renders contract filters, metrics and server pagination", () => {
    for (const label of [
      "数据包名称",
      "创建日期",
      "国家",
      "超链数据包",
      "查看号码",
      "追加导入",
      "覆盖导入",
      "编辑",
      "删除"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /v-model:current-page="page"/);
    assert.match(source, /v-model:page-size="pageSize"/);
    assert.match(source, /<el-empty description="暂无符合条件的数据包"/);
    assert.match(source, /v-if="errorMessage"/);
  });

  it("protects every operation with the frozen permission keys", () => {
    assert.match(source, /tenant:hyperlink_data:create/);
    assert.match(source, /tenant:hyperlink_data:view/);
    assert.equal(source.match(/tenant:hyperlink_data:import/g)?.length, 2);
    assert.match(source, /tenant:hyperlink_data:edit/);
    assert.match(source, /tenant:hyperlink_data:delete/);
  });

  it("does not introduce production mocks or direct request clients", () => {
    assert.doesNotMatch(source, /\bmock\b/i);
    assert.doesNotMatch(source, /axios|armadaRequest|@\/utils\/http/);
  });
});

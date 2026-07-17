import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("buyer template index", () => {
  it("renders the required table columns and actions", () => {
    for (const label of [
      "ID",
      "模板编码",
      "模板名称",
      "预览图",
      "子账号可见",
      "支持参数",
      "备注",
      "创建时间",
      "更新时间",
      "操作"
    ]) {
      assert.match(source, new RegExp(`label=["']${label}["']`));
    }
    assert.match(source, /title=["']模板列表["']/);
    assert.match(source, />\s*预览\s*</);
    assert.match(source, />\s*编辑备注\s*</);
    assert.match(source, /tenant:buyer-template:visibility/);
    assert.match(source, /tenant:buyer-template:remark/);
  });

  it("does not add out-of-scope controls", () => {
    assert.doesNotMatch(
      source,
      />\s*(?:查询|搜索|新增|添加|删除|批量删除)\s*</
    );
    assert.doesNotMatch(
      source,
      /WheelPagination|el-pagination|type=["']selection["']/
    );
  });
});

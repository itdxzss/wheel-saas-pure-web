import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createIpManageTableColumns } from "./useResourceIpPage";

describe("resource IP page state", () => {
  it("keeps IP management table columns aligned with the PRD list", () => {
    const columns = createIpManageTableColumns();

    assert.deepEqual(
      columns.map(column => String(column.label)),
      [
        "国家",
        "类型",
        "代理地址",
        "用户名",
        "密码",
        "IP来源（二期）",
        "有效账号",
        "创建时间"
      ]
    );
  });
});

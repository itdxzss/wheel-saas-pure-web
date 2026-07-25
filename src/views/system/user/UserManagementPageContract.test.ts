import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("system user page contract", () => {
  it("contains filters, user fields and all approved actions", () => {
    for (const text of [
      "登录账号",
      "用户昵称",
      "例如 test0001",
      "例如 普通用户测试",
      "角色",
      "状态",
      "新增用户",
      "编辑",
      "重置密码",
      "启用",
      "禁用"
    ])
      assert.ok(page.includes(text), text);
    assert.ok(page.includes("multiple"));
    assert.ok(page.includes("8至64"));
    assert.ok(page.includes("只能包含字母、数字、点、下划线和短横线"));
  });

  it("uses API wrappers, visible error state and permission directives", () => {
    for (const name of [
      "listSystemUsers",
      "createSystemUser",
      "updateSystemUser",
      "resetSystemUserPassword",
      "changeSystemUserStatus",
      "errorMessage"
    ])
      assert.ok(page.includes(name), name);
    for (const permission of [
      "tenant:system-user:create",
      "tenant:system-user:edit",
      "tenant:system-user:reset-password",
      "tenant:system-user:status"
    ])
      assert.ok(page.includes(permission), permission);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("system role page contract", () => {
  it("contains role fields, state actions and a strict permission tree", () => {
    for (const text of [
      "角色名称",
      "角色编码",
      "用户数量",
      "备注",
      "新增角色",
      "分配权限",
      "启用",
      "禁用"
    ])
      assert.ok(page.includes(text), text);
    assert.ok(page.includes("el-tree"));
    assert.ok(page.includes("check-strictly"));
    assert.ok(page.includes("menuType"));
  });

  it("uses approved APIs, errors and permissions", () => {
    for (const name of [
      "listSystemRoles",
      "getSystemMenuTree",
      "getSystemRoleMenuIds",
      "replaceSystemRoleMenus",
      "errorMessage"
    ])
      assert.ok(page.includes(name), name);
    for (const permission of [
      "tenant:system-role:create",
      "tenant:system-role:edit",
      "tenant:system-role:grant",
      "tenant:system-role:status"
    ])
      assert.ok(page.includes(permission), permission);
  });
});

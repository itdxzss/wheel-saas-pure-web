import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("system menu page contract", () => {
  it("renders a tree table and every approved menu field", () => {
    for (const text of [
      "节点名称",
      "菜单标识",
      "节点类型",
      "路由路径",
      "组件路径",
      "权限编码",
      "图标",
      "排序",
      "状态"
    ])
      assert.ok(page.includes(text), text);
    assert.ok(page.includes('row-key="id"'));
    assert.ok(page.includes("treeProps"));
    assert.ok(page.includes("D目录"));
    assert.ok(page.includes("M菜单"));
    assert.ok(page.includes("B按钮"));
  });

  it("uses a searchable icon picker with visible icon previews", () => {
    assert.ok(page.includes("IconifyIconOnline"));
    assert.ok(page.includes("iconOptions"));
    assert.ok(page.includes("请选择菜单图标"));
    assert.ok(page.includes('value: "ep:setting"'));
    assert.ok(!page.includes('placeholder="例如 ep:setting"'));
  });

  it("treats the toolbar action as creating a fixed top-level directory", () => {
    assert.ok(page.includes("新增一级目录"));
    assert.ok(page.includes("isRootCreate"));
    assert.ok(page.includes('v-if="!isRootCreate"'));
    assert.ok(page.includes("createParent?.menuName"));
    assert.ok(!page.includes("新增根目录"));
  });

  it("limits child node types according to the selected parent", () => {
    assert.ok(page.includes("selectableTypeOptions"));
    assert.ok(page.includes('parent.menuType === "M"'));
    assert.ok(page.includes('item.value !== "B"'));
  });

  it("uses approved APIs, errors and permissions without delete action", () => {
    for (const name of [
      "getSystemMenuTree",
      "createSystemMenu",
      "updateSystemMenu",
      "changeSystemMenuStatus",
      "errorMessage"
    ])
      assert.ok(page.includes(name), name);
    for (const permission of [
      "tenant:system-menu:create",
      "tenant:system-menu:edit",
      "tenant:system-menu:status"
    ])
      assert.ok(page.includes(permission), permission);
    assert.ok(!page.includes("deleteSystemMenu"));
  });
});

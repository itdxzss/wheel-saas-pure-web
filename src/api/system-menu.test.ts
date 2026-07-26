import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  changeSystemMenuStatus,
  createSystemMenu,
  getSystemMenuTree,
  updateSystemMenu
} from "./system-menu";

describe("system menu API contract", () => {
  it("uses the approved menu management endpoints", async () => {
    resetArmadaMock([]);
    const payload = {
      parentId: 1,
      menuName: "用户管理",
      menuKey: "SystemUser",
      menuType: "M" as const,
      routePath: "/system/user",
      componentPath: "system/user/index",
      permKey: "tenant:system-user:view",
      icon: undefined,
      sortNo: 10
    };

    await getSystemMenuTree();
    await createSystemMenu(payload);
    await updateSystemMenu(8, payload);
    await changeSystemMenuStatus(8, 0);

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/admin/menus/tree", opts: undefined },
      {
        method: "post",
        url: "/api/admin/menus",
        opts: { data: payload }
      },
      {
        method: "put",
        url: "/api/admin/menus/8",
        opts: { data: payload }
      },
      {
        method: "patch",
        url: "/api/admin/menus/8/status",
        opts: { data: { status: 0 } }
      }
    ]);
  });
});

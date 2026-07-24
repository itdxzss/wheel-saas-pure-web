import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  changeSystemRoleStatus,
  createSystemRole,
  getSystemRoleMenuIds,
  listSystemRoles,
  replaceSystemRoleMenus,
  updateSystemRole
} from "./system-role";

describe("system role API contract", () => {
  it("uses the approved role management endpoints", async () => {
    resetArmadaMock([]);
    const createPayload = {
      roleName: "运营",
      roleCode: "OPERATOR",
      remark: "运营角色"
    };
    const updatePayload = { roleName: "高级运营", remark: "已调整" };

    await listSystemRoles();
    await createSystemRole(createPayload);
    await updateSystemRole(3, updatePayload);
    await changeSystemRoleStatus(3, 0);
    await getSystemRoleMenuIds(3);
    await replaceSystemRoleMenus(3, [11, 12]);

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/admin/roles", opts: undefined },
      {
        method: "post",
        url: "/api/admin/roles",
        opts: { data: createPayload }
      },
      {
        method: "put",
        url: "/api/admin/roles/3",
        opts: { data: updatePayload }
      },
      {
        method: "patch",
        url: "/api/admin/roles/3/status",
        opts: { data: { status: 0 } }
      },
      { method: "get", url: "/api/admin/roles/3/menus", opts: undefined },
      {
        method: "put",
        url: "/api/admin/roles/3/menus",
        opts: { data: { menuIds: [11, 12] } }
      }
    ]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  changeSystemUserStatus,
  createSystemUser,
  getSystemUser,
  listSystemUsers,
  resetSystemUserPassword,
  updateSystemUser
} from "./system-user";

describe("system user API contract", () => {
  it("uses the approved user management endpoints", async () => {
    resetArmadaMock([]);
    const createPayload = {
      username: "operator",
      nickname: "运营",
      password: "password-123",
      roleIds: [1, 2]
    };
    const updatePayload = { nickname: "运营一组", roleIds: [2] };

    await listSystemUsers();
    await getSystemUser(7);
    await createSystemUser(createPayload);
    await updateSystemUser(7, updatePayload);
    await resetSystemUserPassword(7, "new-password-123");
    await changeSystemUserStatus(7, 0);

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/admin/users", opts: undefined },
      { method: "get", url: "/api/admin/users/7", opts: undefined },
      {
        method: "post",
        url: "/api/admin/users",
        opts: { data: createPayload }
      },
      {
        method: "put",
        url: "/api/admin/users/7",
        opts: { data: updatePayload }
      },
      {
        method: "post",
        url: "/api/admin/users/7/reset-password",
        opts: { data: { newPassword: "new-password-123" } }
      },
      {
        method: "patch",
        url: "/api/admin/users/7/status",
        opts: { data: { status: 0 } }
      }
    ]);
  });
});

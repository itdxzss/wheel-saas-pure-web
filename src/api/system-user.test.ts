import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { listSystemUserOptions } from "./system-user";

describe("system user option API", () => {
  it("loads admin users and formats distinguishable option labels", async () => {
    resetArmadaMock([
      {
        id: 3,
        username: "test0001",
        nickname: "普通用户测试",
        status: 1,
        roleIds: [4],
        createdAt: 1_784_954_087_001,
        updatedAt: 1_784_955_124_921
      },
      {
        id: 2,
        username: "daizx",
        nickname: "代宣照",
        status: 0,
        roleIds: [1],
        createdAt: 1_784_942_657_599,
        updatedAt: 1_784_942_657_599
      },
      {
        id: 1,
        username: "admin",
        nickname: "admin",
        status: 1,
        roleIds: [1],
        createdAt: 1_784_912_880_180,
        updatedAt: 1_784_915_589_469
      }
    ]);

    const result = await listSystemUserOptions();

    assert.deepEqual(result, [
      { id: 3, name: "普通用户测试（test0001）", status: 1 },
      { id: 2, name: "代宣照（daizx）", status: 0 },
      { id: 1, name: "admin", status: 1 }
    ]);
    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/admin/users", opts: undefined }
    ]);
  });
});

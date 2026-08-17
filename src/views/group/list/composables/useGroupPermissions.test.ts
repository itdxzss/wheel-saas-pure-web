import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import { useGroupPermissions } from "./useGroupPermissions";

const knownPermissions = {
  editGroupSettings: true,
  sendMessages: true,
  addMembers: false,
  inviteViaLink: false,
  adminApproveNewMembers: false
};

describe("group permission state", () => {
  it("uses the fixed backend key and reloads confirmed detail", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    let reloads = 0;
    const state = useGroupPermissions({
      groupId: () => 42,
      reload: async () => {
        reloads += 1;
      }
    });
    state.setPermissions(knownPermissions);

    await state.toggle("addMembers");

    assert.equal(state.permissions.addMembers, true);
    assert.equal(reloads, 1);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/42/settings",
        opts: { data: { key: "ADD_MEMBERS", enabled: true } }
      }
    ]);
  });

  it("restores the prior switch state when the backend rejects it", async () => {
    resetArmadaMockFailure(new Error("执行账号没有管理员权限"));
    resetElementPlusMock();
    const state = useGroupPermissions({
      groupId: () => 42,
      reload: async () => undefined
    });
    state.setPermissions(knownPermissions);

    await state.toggle("sendMessages");

    assert.equal(state.permissions.sendMessages, true);
    assert.deepEqual(elementPlusCalls(), [
      { type: "error", text: "执行账号没有管理员权限" }
    ]);
  });

  it("posts the independent invite-via-link key when capability provides a value", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    const state = useGroupPermissions({
      groupId: () => 42,
      reload: async () => undefined
    });
    state.setPermissions(knownPermissions);

    await state.toggle("inviteViaLink");

    assert.equal(state.permissions.inviteViaLink, true);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/42/settings",
        opts: { data: { key: "INVITE_VIA_LINK", enabled: true } }
      }
    ]);
  });

  it("keeps the submitted value while metadata refresh runs asynchronously", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    let reloads = 0;
    let refreshes = 0;
    const state = useGroupPermissions({
      groupId: () => 42,
      reload: async () => {
        reloads += 1;
      },
      refreshAfterSubmit: async () => {
        refreshes += 1;
      }
    });
    state.setPermissions(knownPermissions);

    await state.toggle("addMembers");

    assert.equal(state.permissions.addMembers, true);
    assert.equal(reloads, 0);
    assert.equal(refreshes, 1);
  });

  it("allows enabling a permission when its current metadata state is unknown", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    const state = useGroupPermissions({
      groupId: () => 42,
      reload: async () => undefined
    });
    state.setPermissions({
      ...knownPermissions,
      adminApproveNewMembers: null
    });

    await state.toggle("adminApproveNewMembers", true);

    assert.equal(state.permissions.adminApproveNewMembers, true);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/42/settings",
        opts: {
          data: { key: "ADMIN_APPROVE_NEW_MEMBERS", enabled: true }
        }
      }
    ]);
  });
});

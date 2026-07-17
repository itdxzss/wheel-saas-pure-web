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
import { useGroupTimedMessage } from "./useGroupTimedMessage";

describe("group timed message state", () => {
  it("updates the mode and reloads confirmed detail", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    let reloads = 0;
    const state = useGroupTimedMessage({
      groupId: () => 42,
      reload: async () => {
        reloads += 1;
      }
    });
    state.setMode("24h");

    await state.changeMode("7d");

    assert.equal(state.mode.value, "7d");
    assert.equal(reloads, 1);
    assert.equal(state.saving.value, false);
    assert.equal(armadaCalls()[0].url, "/api/group-links/42/timed-message");
  });

  it("restores the confirmed mode when the update fails", async () => {
    resetArmadaMockFailure(new Error("账号没有群管理权限"));
    resetElementPlusMock();
    let reloads = 0;
    const state = useGroupTimedMessage({
      groupId: () => 42,
      reload: async () => {
        reloads += 1;
      }
    });
    state.setMode("24h");

    await state.changeMode("90d");

    assert.equal(state.mode.value, "24h");
    assert.equal(reloads, 0);
    assert.deepEqual(elementPlusCalls(), [
      { type: "error", text: "账号没有群管理权限" }
    ]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import { useGroupCreatorLeave } from "./useGroupCreatorLeave";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("group creator leave drawer state", () => {
  it("uses the local capability endpoint and submits creator leave", async () => {
    resetArmadaMockQueue([
      { executable: true, blockedReasonCode: null, blockedReason: null },
      { status: "SUCCESS", message: "群主退群成功" }
    ]);
    resetElementPlusMock();
    let refreshes = 0;
    const state = useGroupCreatorLeave({
      groupId: () => 7,
      active: () => true,
      onSuccess: () => {
        refreshes += 1;
      }
    });

    await state.loadCreatorLeaveCapability();
    assert.equal(state.creatorLeaveExecutable.value, true);

    await state.runCreatorLeave();

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["get", "/api/group-links/7/creator-leave-capability"],
        ["post", "/api/group-links/7/creator-leave"]
      ]
    );
    assert.equal(refreshes, 1);
    assert.deepEqual(elementPlusCalls().at(-1), {
      type: "success",
      text: "群主退群成功"
    });
  });

  it("disables the old group capability while a new group is loading", async () => {
    const first = deferred<{
      executable: boolean;
      blockedReasonCode: string | null;
      blockedReason: string | null;
    }>();
    resetArmadaMockQueue([
      first.promise,
      { executable: true, blockedReasonCode: null, blockedReason: null }
    ]);
    let groupId = 7;
    const state = useGroupCreatorLeave({
      groupId: () => groupId,
      active: () => true,
      onSuccess: () => undefined
    });

    const staleLoad = state.loadCreatorLeaveCapability();
    groupId = 8;
    const currentLoad = state.loadCreatorLeaveCapability();

    assert.equal(state.creatorLeaveExecutable.value, false);
    await currentLoad;
    assert.equal(state.creatorLeaveExecutable.value, true);

    first.resolve({
      executable: false,
      blockedReasonCode: "NO_AVAILABLE_CONTROLLER",
      blockedReason: "无可用控端"
    });
    await staleLoad;
    assert.equal(state.creatorLeaveExecutable.value, true);
  });
});

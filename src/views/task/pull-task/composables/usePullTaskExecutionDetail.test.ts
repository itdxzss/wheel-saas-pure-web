import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { resetElementPlusMock } from "@/api/__tests__/element-plus-test-double";
import { usePullTaskExecutionDetail } from "./usePullTaskExecutionDetail";

describe("normal-link execution detail state", () => {
  const fixture = (id: number) => ({
    execution: { executionId: id, observation: { observedAt: 5000 } },
    roles: [],
    calls: [],
    actions: []
  });

  it("keeps the previous snapshot on refresh failure and never writes a task", async () => {
    resetArmadaMockQueue([fixture(19), []]);
    const state = usePullTaskExecutionDetail();
    await state.open(7, 19);
    resetArmadaMockFailure(new Error("网络断开"));
    await state.refresh(true);
    assert.equal(state.detail.value?.execution.executionId, 19);
    assert.equal(state.refreshedAt.value, 5000);
    assert.ok(state.refreshError.value);
    assert.ok(armadaCalls().every(call => call.method === "get"));
    state.visible.value = false;
    resetArmadaMockQueue([]);
    await state.refresh(true);
    assert.deepEqual(armadaCalls(), []);
  });

  it("ignores late responses after switching groups and prevents overlapping refresh", async () => {
    let release: (value: unknown) => void;
    const pending = new Promise(resolve => {
      release = resolve;
    });
    resetArmadaMockQueue([pending, []]);
    const state = usePullTaskExecutionDetail();
    const first = state.open(7, 19);
    await state.refresh(true);
    assert.equal(armadaCalls().length, 2);
    resetArmadaMockQueue([fixture(20), []]);
    await state.open(7, 20);
    release(fixture(19));
    await first;
    assert.equal(state.detail.value?.execution.executionId, 20);
    assert.equal(state.loading.value, false);
    state.visible.value = false;
  });

  it("loads execution facts and member outcomes from their real endpoints", async () => {
    resetArmadaMockQueue([
      {
        execution: {
          executionId: 19,
          seq: 1,
          normalizedLink: "chat.whatsapp.com/code",
          groupJid: "120363@test.g.us",
          executionStatus: 2,
          stage: 5,
          manualPaused: false,
          validMemberCount: 1,
          reasonCode: null,
          reasonMessage: null,
          lastBusinessExecutedAt: 1,
          materialSummary: null,
          managers: null,
          pullers: null,
          stations: null
        },
        roles: [],
        calls: [],
        actions: []
      },
      [
        {
          memberId: 101,
          memberSeq: 1,
          normalizedPhone: "8613900000000",
          adminRequired: true,
          pullCallId: 201,
          pullStatus: 2,
          pullReasonCode: null,
          pullReasonMessage: null,
          waJid: "8613900000000@s.whatsapp.net",
          adminStatus: 3,
          adminReasonCode: null
        }
      ]
    ]);
    resetElementPlusMock();
    const state = usePullTaskExecutionDetail();

    await state.open(7, 19);

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["get", "/api/pull-tasks/standard/7/executions/19"],
        ["get", "/api/pull-tasks/standard/7/executions/19/members"]
      ]
    );
    assert.equal(state.visible.value, true);
    assert.equal(state.detail.value?.execution.executionId, 19);
    assert.equal(state.members.value[0]?.memberId, 101);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { resetElementPlusMock } from "@/api/__tests__/element-plus-test-double";
import { usePullTaskExecutionDetail } from "./usePullTaskExecutionDetail";

describe("normal-link execution detail state", () => {
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

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  createHistoricalGroupPullExecution,
  demoteHistoricalGroupParticipants,
  getHistoricalGroupDetail,
  getHistoricalGroupPullExecution,
  getLatestHistoricalGroupPullExecution,
  listHistoricalGroups,
  promoteHistoricalGroupParticipants,
  refreshHistoricalGroups,
  removeHistoricalGroupParticipants,
  sendHistoricalGroupMarketing,
  startHistoricalGroupPullExecution
} from "./historical-group";

describe("historical group API", () => {
  it("loads the fixed account historical group list", async () => {
    resetArmadaMock([]);

    await listHistoricalGroups(17);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/historical-groups",
        opts: { params: { accountId: 17 } }
      }
    ]);
  });

  it("refreshes the fixed account and loads one group detail", async () => {
    resetArmadaMockQueue([[], { groupJid: "120363detail@g.us" }]);

    await refreshHistoricalGroups(17);
    await getHistoricalGroupDetail({
      accountId: 17,
      groupJid: "120363detail@g.us"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/historical-groups/refresh",
        opts: { data: { accountId: 17 } },
        config: { timeout: 60_000 }
      },
      {
        method: "get",
        url: "/api/historical-groups/detail",
        opts: {
          params: { accountId: 17, groupJid: "120363detail@g.us" }
        }
      }
    ]);
  });

  it("posts each participant action and preserves per-member errors", async () => {
    const response = {
      ok: false,
      partial: true,
      results: [
        {
          participantJid: "8613800000000@s.whatsapp.net",
          success: false,
          errorCode: "GROUP_PERMISSION_DENIED",
          errorMessage: "protocol member update denied"
        }
      ]
    };
    resetArmadaMock(response);
    const input = {
      accountId: 17,
      groupJid: "120363detail@g.us",
      participantJids: ["8613800000000@s.whatsapp.net"]
    };

    const promoteResult = await promoteHistoricalGroupParticipants(input);
    await demoteHistoricalGroupParticipants(input);
    await removeHistoricalGroupParticipants(input);

    assert.equal(promoteResult.results[0].errorCode, "GROUP_PERMISSION_DENIED");
    assert.equal(
      promoteResult.results[0].errorMessage,
      "protocol member update denied"
    );
    assert.deepEqual(
      armadaCalls(),
      ["promote", "demote", "remove"].map(action => ({
        method: "post",
        url: `/api/historical-groups/participants/${action}`,
        opts: { data: input }
      }))
    );
  });

  it("creates a multipart pull execution without accepting an invite link", async () => {
    const file = new File(["8613800000000"], "members.txt", {
      type: "text/plain"
    });
    resetArmadaMock({ id: 91 });

    await createHistoricalGroupPullExecution({
      file,
      operationAccountId: 17,
      groupJid: "120363detail@g.us",
      pullerAccountGroupId: 8,
      singleAddCount: 25,
      idempotencyKey: "history-pull-91"
    });

    const call = armadaCalls()[0];
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/historical-group-pull-executions");
    const data = (call.opts as { data: FormData }).data;
    assert.ok(data instanceof FormData);
    assert.equal(data.get("file"), file);
    assert.equal(data.get("operationAccountId"), "17");
    assert.equal(data.get("groupJid"), "120363detail@g.us");
    assert.equal(data.get("pullerAccountGroupId"), "8");
    assert.equal(data.get("singleAddCount"), "25");
    assert.equal(data.get("idempotencyKey"), "history-pull-91");
    assert.equal(data.has("inviteLink"), false);
    assert.equal(data.has("inviteUrl"), false);
    assert.equal(data.has("marketingTemplateId"), false);

    const config = call.config as {
      beforeRequestCallback: (config: {
        headers: Record<string, string>;
      }) => void;
    };
    const requestConfig = {
      headers: { "Content-Type": "multipart/form-data" }
    };
    config.beforeRequestCallback(requestConfig);
    assert.equal("Content-Type" in requestConfig.headers, false);
  });

  it("starts and polls executions, loads latest and starts marketing once", async () => {
    const execution = {
      id: 91,
      pullStatus: "PARTIAL_SUCCESS",
      marketingStatus: "NOT_STARTED",
      errorCode: "PARTICIPANT_ADD_PARTIAL",
      errorMessage: "one member failed",
      members: [
        {
          phone: "8613800000000",
          participantJid: "8613800000000@s.whatsapp.net",
          contactStatus: "FAILED",
          contactErrorCode: "CONTACT_SAVE_FAILED",
          contactErrorMessage: "save failed",
          addStatus: "SUCCESS",
          addErrorCode: null,
          addErrorMessage: null,
          sendStatus: "NOT_APPLICABLE",
          sendErrorCode: null,
          sendErrorMessage: null
        }
      ]
    };
    resetArmadaMock(execution);

    await startHistoricalGroupPullExecution(91);
    const polled = await getHistoricalGroupPullExecution(91);
    await getLatestHistoricalGroupPullExecution({
      accountId: 17,
      groupJid: "120363detail@g.us"
    });
    await sendHistoricalGroupMarketing(91, 33);

    assert.equal(polled.errorCode, "PARTICIPANT_ADD_PARTIAL");
    assert.equal(polled.errorMessage, "one member failed");
    assert.equal(polled.members[0].contactErrorMessage, "save failed");
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/historical-group-pull-executions/91/start",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/historical-group-pull-executions/91",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/historical-group-pull-executions/latest",
        opts: {
          params: { accountId: 17, groupJid: "120363detail@g.us" }
        }
      },
      {
        method: "post",
        url: "/api/historical-group-pull-executions/91/marketing-send",
        opts: { data: { marketingTemplateId: 33 } }
      }
    ]);
  });
});

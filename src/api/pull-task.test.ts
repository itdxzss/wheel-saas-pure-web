import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  addPullTaskGroupMarketingWaiting,
  clearPullTaskStandardDraft,
  createPullTaskStandard,
  endPullTaskStandard,
  getPullTaskManagerSupplementOptions,
  getPullTaskPullerSupplementOptions,
  getPullTaskStationSupplementOptions,
  getPullTaskStandardDraft,
  getPullTaskStandardDetail,
  getPullTaskStandardExecutionDetail,
  getPullTaskStandardExecutionMembers,
  getPullTaskGroupMarketingWaiting,
  getPullTaskGroupMarketingSetting,
  listPullTaskGroupMarketingCandidates,
  listPullTaskStandardExecutions,
  listPullTasks,
  planPullTaskStandardDraft,
  pausePullTaskStandard,
  pausePullTaskStandardExecution,
  releasePullTaskGroupMarketingWaiting,
  removePullTaskStandardDraftRow,
  removePullTaskGroupMarketingWaiting,
  resumePullTaskStandard,
  resumePullTaskStandardExecution,
  startPullTaskStandard,
  supplementPullTaskManager,
  supplementPullTaskPuller,
  supplementPullTaskStation,
  endPullTaskStandardExecution,
  updatePullTaskGroupMarketingSetting
} from "./pull-task";

describe("pull task unified API", () => {
  it("uses only the confirmed unified-list filters and trims text", async () => {
    resetArmadaMockQueue([{}, {}, {}]);

    await listPullTasks({
      page: 2,
      pageSize: 20,
      id: 8,
      keyword: "  印度  ",
      status: "EXECUTING",
      taskType: "GROUP_MARKETING",
      groupSource: "HISTORICAL",
      operator: "  运营甲  "
    });
    await getPullTaskGroupMarketingSetting();
    await updatePullTaskGroupMarketingSetting({
      marketingSilenceMinutes: 30,
      groupLockdownMinutes: 60,
      maxMarketingAccountsPerGroup: 2
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            id: 8,
            keyword: "印度",
            status: "EXECUTING",
            taskType: "GROUP_MARKETING",
            groupSource: "HISTORICAL",
            operator: "运营甲"
          }
        }
      },
      {
        method: "get",
        url: "/api/pull-tasks/group-marketing-setting",
        opts: undefined
      },
      {
        method: "put",
        url: "/api/pull-tasks/group-marketing-setting",
        opts: {
          data: {
            marketingSilenceMinutes: 30,
            groupLockdownMinutes: 60,
            maxMarketingAccountsPerGroup: 2
          }
        }
      }
    ]);
  });

  it("uses the candidate-group and server waiting-pool contracts", async () => {
    resetArmadaMockQueue([{}, {}, {}, {}, {}]);

    await listPullTaskGroupMarketingCandidates({
      page: 2,
      pageSize: 20,
      source: "SELF_COLLECTED",
      keyword: "  游戏群  ",
      groupJid: " 120363@test.g.us ",
      managerPhone: " 86138 ",
      showRegularGroups: true,
      minMemberCount: 10,
      maxMemberCount: 300,
      announceOnly: true,
      reservationToken: "  pool-token  "
    });
    await addPullTaskGroupMarketingWaiting({
      reservationToken: null,
      taskName: "印度营销",
      plannedStartAt: null,
      groupJids: ["120363@test.g.us"]
    });
    await getPullTaskGroupMarketingWaiting("pool-token");
    await removePullTaskGroupMarketingWaiting({
      reservationToken: "pool-token",
      groupJid: "120363@test.g.us"
    });
    await releasePullTaskGroupMarketingWaiting("pool-token");

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/group-marketing/candidate-groups",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            source: "SELF_COLLECTED",
            keyword: "游戏群",
            groupJid: "120363@test.g.us",
            managerPhone: "86138",
            accountGroupId: undefined,
            showRegularGroups: true,
            minMemberCount: 10,
            maxMemberCount: 300,
            announceOnly: true,
            reservationToken: "pool-token"
          }
        }
      },
      {
        method: "post",
        url: "/api/pull-tasks/group-marketing/waiting-pool",
        opts: {
          data: {
            reservationToken: null,
            taskName: "印度营销",
            plannedStartAt: null,
            groupJids: ["120363@test.g.us"]
          }
        }
      },
      {
        method: "get",
        url: "/api/pull-tasks/group-marketing/waiting-pool",
        opts: { params: { reservationToken: "pool-token" } }
      },
      {
        method: "post",
        url: "/api/pull-tasks/group-marketing/waiting-pool/remove",
        opts: {
          data: {
            reservationToken: "pool-token",
            groupJid: "120363@test.g.us"
          }
        }
      },
      {
        method: "delete",
        url: "/api/pull-tasks/group-marketing/waiting-pool",
        opts: { params: { reservationToken: "pool-token" } }
      }
    ]);
  });

  it("uses the normal-link draft and frozen-create contracts", async () => {
    resetArmadaMockQueue([{}, {}, {}, {}, {}]);
    const material = new File(["8613900000000"], "material.txt", {
      type: "text/plain"
    });

    await getPullTaskStandardDraft();
    await planPullTaskStandardDraft(" https://chat.whatsapp.com/code ", [
      material
    ]);
    await removePullTaskStandardDraftRow(19);
    await clearPullTaskStandardDraft();
    await createPullTaskStandard({
      draftTaskId: 7,
      version: 3,
      taskName: "普通群链接",
      remark: null,
      autoStart: 1,
      materialAdminTiming: 1,
      pullCountMin: 3,
      pullCountMax: 5,
      pullIntervalSeconds: 6,
      pullerCountPerGroup: 1,
      stationCountPerCall: 0,
      concurrentGroupCount: 2,
      pullerRiskMinutes: 30,
      managerGroupId: 11,
      pullerGroupId: 12,
      stationGroupId: 13
    });

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["get", "/api/pull-tasks/standard/draft"],
        ["post", "/api/pull-tasks/standard/draft/plan"],
        ["delete", "/api/pull-tasks/standard/draft/rows/19"],
        ["delete", "/api/pull-tasks/standard/draft"],
        ["post", "/api/pull-tasks/standard"]
      ]
    );
    const formData = (armadaCalls()[1].opts as { data: FormData }).data;
    assert.equal(formData.get("linksText"), " https://chat.whatsapp.com/code ");
    assert.equal((formData.get("files") as File).name, "material.txt");
    assert.equal(
      (armadaCalls()[4].opts as { data: { managerGroupId: number } }).data
        .managerGroupId,
      11
    );
  });

  it("uses the immutable manager-supplement options and command contracts", async () => {
    resetArmadaMockQueue([{}, {}]);

    await getPullTaskManagerSupplementOptions(7, 19, 11);
    await supplementPullTaskManager(7, 19, {
      accountGroupId: 11,
      accountId: 901,
      entryMode: 2,
      executorRoleRowId: 88
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/standard/7/executions/19/manager-supplement/options",
        opts: { params: { accountGroupId: 11 } }
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/executions/19/manager-supplement",
        opts: {
          data: {
            accountGroupId: 11,
            accountId: 901,
            entryMode: 2,
            executorRoleRowId: 88
          }
        }
      }
    ]);
  });

  it("uses the immutable puller-supplement options and command contracts", async () => {
    resetArmadaMockQueue([{}, {}]);

    await getPullTaskPullerSupplementOptions(7, 19, 12);
    await supplementPullTaskPuller(7, 19, {
      accountGroupId: 12,
      supplementCount: 2,
      selectionMode: 2,
      entryMode: 1,
      accountIds: [901, 902]
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/standard/7/executions/19/puller-supplement/options",
        opts: { params: { accountGroupId: 12 } }
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/executions/19/puller-supplement",
        opts: {
          data: {
            accountGroupId: 12,
            supplementCount: 2,
            selectionMode: 2,
            entryMode: 1,
            accountIds: [901, 902]
          }
        }
      }
    ]);
  });

  it("uses the immutable station-supplement contract without an entry mode", async () => {
    resetArmadaMockQueue([{}, {}]);

    await getPullTaskStationSupplementOptions(7, 19, 13);
    await supplementPullTaskStation(7, 19, {
      accountGroupId: 13,
      supplementCount: 1,
      selectionMode: 2,
      accountIds: [903]
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/standard/7/executions/19/station-supplement/options",
        opts: { params: { accountGroupId: 13 } }
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/executions/19/station-supplement",
        opts: {
          data: {
            accountGroupId: 13,
            supplementCount: 1,
            selectionMode: 2,
            accountIds: [903]
          }
        }
      }
    ]);
  });

  it("reads normal-link execution rows from the standard detail contract", async () => {
    resetArmadaMockQueue([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]);

    await getPullTaskStandardDetail(7);
    await listPullTaskStandardExecutions(7, {
      page: 2,
      pageSize: 20,
      keyword: "AAAA",
      executionStatus: 3,
      waitResourceType: 2
    });
    await getPullTaskStandardExecutionDetail(7, 19);
    await getPullTaskStandardExecutionMembers(7, 19);
    await startPullTaskStandard(7);
    await pausePullTaskStandard(7);
    await resumePullTaskStandard(7);
    await endPullTaskStandard(7);
    await pausePullTaskStandardExecution(7, 19);
    await resumePullTaskStandardExecution(7, 19);
    await endPullTaskStandardExecution(7, 19);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/standard/7",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/pull-tasks/standard/7/executions",
        opts: {
          params: {
            page: 2,
            pageSize: 20,
            keyword: "AAAA",
            executionStatus: 3,
            waitResourceType: 2
          }
        }
      },
      {
        method: "get",
        url: "/api/pull-tasks/standard/7/executions/19",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/pull-tasks/standard/7/executions/19/members",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/start",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/pause",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/resume",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/end",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/executions/19/pause",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/executions/19/resume",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/pull-tasks/standard/7/executions/19/end",
        opts: undefined
      }
    ]);
  });
});

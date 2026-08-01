import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  addPullTaskGroupMarketingWaiting,
  getPullTaskGroupMarketingWaiting,
  getPullTaskGroupMarketingSetting,
  listPullTaskGroupMarketingCandidates,
  listPullTasks,
  releasePullTaskGroupMarketingWaiting,
  removePullTaskGroupMarketingWaiting,
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
});

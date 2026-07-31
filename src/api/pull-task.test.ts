import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  getPullTaskGroupMarketingSetting,
  listPullTasks,
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
});

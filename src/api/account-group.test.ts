import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  getAccountGroupMarketingOccupancy,
  listAccountGroups
} from "./account-group";

describe("account group API", () => {
  it("maps abnormal account count from restrictedCount before riskCount", async () => {
    resetArmadaMock({
      list: [
        {
          id: 10,
          name: "A",
          accountCount: 12,
          onlineCount: 3,
          restrictedCount: 4,
          riskCount: 2,
          bannedCount: 1,
          systemBuiltin: 0,
          updatedAt: 1782705600000
        }
      ],
      total: 1
    });

    const result = await listAccountGroups({ page: 1, pageSize: 20 });

    assert.equal(result.list?.[0]?.abnormalAccounts, 4);
    assert.equal(result.list?.[0]?.accountCountSummary, "12 - 3 / 4 / 1");
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/account-groups",
        opts: {
          params: { page: 1, pageSize: 20, keyword: undefined, id: undefined }
        }
      }
    ]);
  });

  it("falls back to riskCount for old account group responses", async () => {
    resetArmadaMock({
      list: [
        {
          id: 11,
          name: "B",
          accountCount: 8,
          onlineCount: 2,
          riskCount: 3,
          bannedCount: 1,
          systemBuiltin: false,
          updatedAt: 1782705600000
        }
      ],
      total: 1
    });

    const result = await listAccountGroups();

    assert.equal(result.list?.[0]?.abnormalAccounts, 3);
    assert.equal(result.list?.[0]?.accountCountSummary, "8 - 2 / 3 / 1");
  });

  it("maps marketing occupancy facts without loading task details", async () => {
    resetArmadaMock({
      list: [
        {
          id: 12,
          name: "营销组",
          marketingOccupancyType: 2,
          marketingOccupancyTaskId: 88,
          marketingLockedAt: 1782705600000
        }
      ],
      total: 1
    });

    const result = await listAccountGroups();

    assert.deepEqual(
      {
        type: result.list?.[0]?.marketingOccupancyType,
        taskId: result.list?.[0]?.marketingOccupancyTaskId,
        lockedAt: result.list?.[0]?.marketingLockedAt
      },
      { type: 2, taskId: 88, lockedAt: 1782705600000 }
    );
    assert.equal(armadaCalls().length, 1);
  });

  it("loads marketing occupancy details only for the selected group", async () => {
    resetArmadaMock({
      groupId: 12,
      occupancyType: "GROUP_PULL_MARKETING",
      taskBusinessType: 2,
      taskId: 88,
      taskName: "印度拉群任务",
      taskStatus: 2,
      resourceStatus: 2,
      lockedAt: 1782705600000,
      marketingAccountTotalCount: 50,
      marketingAccountUsedCount: 18
    });

    const result = await getAccountGroupMarketingOccupancy(12);

    assert.equal(result.taskName, "印度拉群任务");
    assert.equal(result.marketingAccountUsedCount, 18);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/account-groups/12/marketing-occupancy",
        opts: undefined
      }
    ]);
  });
});

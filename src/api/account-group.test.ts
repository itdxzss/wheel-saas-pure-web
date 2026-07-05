import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { listAccountGroups } from "./account-group";

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
});

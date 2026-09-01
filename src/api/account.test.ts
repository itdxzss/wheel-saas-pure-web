import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  batchClearTenantAccountOperationRestrictions,
  batchDeleteTenantAccounts,
  batchMigrateTenantAccountsToGroup,
  batchOfflineTenantAccounts,
  batchOfflineTenantAccountsByQuery,
  batchOnlineTenantAccounts,
  batchOnlineTenantAccountsByQuery,
  batchTakeoverTenantAccounts,
  exportTenantAccountWsPhones,
  listTenantAccounts,
  previewTenantAccountBatch
} from "./account";

describe("account operation API", () => {
  it("posts batch online requests to armada", async () => {
    resetArmadaMock({
      requested: 2,
      submitted: 2,
      accepted: 2,
      timeout: 0,
      proxyRequired: 0,
      error: 0,
      remote: 0,
      elapsedMs: 0,
      results: [],
      remoteRoutes: []
    });

    const result = await batchOnlineTenantAccounts([100, 101]);

    assert.equal(result.accepted, 2);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-online",
        opts: { data: { ids: [100, 101] } }
      }
    ]);
  });

  it("posts single account offline through the batch offline endpoint", async () => {
    resetArmadaMock({
      requested: 1,
      submitted: 1,
      accepted: 1,
      timeout: 0,
      proxyRequired: 0,
      error: 0,
      remote: 0,
      elapsedMs: 0,
      results: [],
      remoteRoutes: []
    });

    const result = await batchOfflineTenantAccounts([100]);

    assert.equal(result.requested, 1);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-offline",
        opts: { data: { ids: [100] } }
      }
    ]);
  });

  it("posts filtered online requests to the query endpoint", async () => {
    resetArmadaMock({
      requested: 2,
      submitted: 2,
      accepted: 2,
      skipped: 0,
      failed: 0,
      skipReasons: {},
      batchErrors: []
    });

    await batchOnlineTenantAccountsByQuery({
      loginState: 2,
      country: "美国"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-online-by-query",
        opts: { data: { loginState: 2, country: "美国" } }
      }
    ]);
  });

  it("posts filtered offline requests to the query endpoint", async () => {
    resetArmadaMock({
      requested: 2,
      submitted: 2,
      accepted: 2,
      skipped: 0,
      failed: 0,
      skipReasons: {},
      batchErrors: []
    });

    await batchOfflineTenantAccountsByQuery({ loginState: 1 });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-offline-by-query",
        opts: { data: { loginState: 1 } }
      }
    ]);
  });

  it("posts explicit query preview requests", async () => {
    resetArmadaMock({
      matched: 1256,
      executable: 1200,
      skipped: 56,
      skipReasons: { BANNED: 56 }
    });

    const result = await previewTenantAccountBatch({
      operation: "ONLINE",
      scope: "QUERY",
      query: { loginState: 2 }
    });

    assert.equal(result.executable, 1200);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-operation-preview",
        opts: {
          data: {
            operation: "ONLINE",
            scope: "QUERY",
            query: { loginState: 2 }
          }
        }
      }
    ]);
  });

  it("posts batch takeover requests to armada", async () => {
    resetArmadaMock({
      requested: 2,
      submitted: 2,
      accepted: 2,
      timeout: 0,
      proxyRequired: 0,
      error: 0,
      remote: 0,
      elapsedMs: 0,
      results: [],
      remoteRoutes: []
    });

    const result = await batchTakeoverTenantAccounts([100, 101]);

    assert.equal(result.accepted, 2);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-takeover",
        opts: { data: { ids: [100, 101] } }
      }
    ]);
  });

  it("posts account group migration payloads", async () => {
    resetArmadaMock(undefined);

    await batchMigrateTenantAccountsToGroup({
      ids: [100, 101],
      accountGroupId: 8,
      newGroupRemark: "ignore for existing group"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-migrate-group",
        opts: {
          data: {
            ids: [100, 101],
            accountGroupId: 8,
            newGroupRemark: "ignore for existing group"
          }
        }
      }
    ]);
  });

  it("posts new account group migration payloads", async () => {
    resetArmadaMock(undefined);

    await batchMigrateTenantAccountsToGroup({
      ids: [100, 101],
      accountGroupId: null,
      newGroupName: "新分组 A",
      newGroupRemark: "新分组备注"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-migrate-group",
        opts: {
          data: {
            ids: [100, 101],
            accountGroupId: null,
            newGroupName: "新分组 A",
            newGroupRemark: "新分组备注"
          }
        }
      }
    ]);
  });

  it("posts batch delete requests to armada", async () => {
    resetArmadaMock(undefined);

    await batchDeleteTenantAccounts([100, 101]);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-delete",
        opts: { data: { ids: [100, 101] } }
      }
    ]);
  });

  it("posts manual business restriction clear requests to armada", async () => {
    resetArmadaMock({ requested: 2, cleared: 2 });

    const result = await batchClearTenantAccountOperationRestrictions([
      100, 101
    ]);

    assert.equal(result.cleared, 2);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/accounts/batch-clear-operation-restrictions",
        opts: { data: { ids: [100, 101] } }
      }
    ]);
  });

  it("maps device and dispatch fields from account list rows", async () => {
    resetArmadaMock({
      list: [
        {
          id: 100,
          accountType: 1,
          declaredAccountType: 2,
          accountTypeVerifyStatus: 2,
          accountTypeVerifySource: 3,
          accountTypeVerifiedAt: 1782705600000,
          businessVerificationLevel: 1,
          businessVerificationSource: 3,
          businessVerificationVerifiedAt: 1782705600000,
          deviceOs: 1,
          numberSource: 1,
          friendsNum: 0,
          groupsNum: 2,
          country: "印度",
          countryFlag: "🇮🇳",
          dispatchedAt: 1782705600000,
          messageRestrictionUntil: 1782792000000,
          pullingRestrictionUntil: 1782878400000
        }
      ],
      total: 1
    });

    const result = await listTenantAccounts();

    assert.equal(result.list?.[0]?.account_type, "个人号");
    assert.equal(result.list?.[0]?.declared_account_type, "商业号");
    assert.equal(result.list?.[0]?.account_type_verify_status, 2);
    assert.equal(result.list?.[0]?.account_type_verify_source, 3);
    assert.equal(result.list?.[0]?.business_verification_level, 1);
    assert.equal(result.list?.[0]?.business_verification_source, 3);
    assert.equal(
      result.list?.[0]?.account_type_verified_at,
      "2026-06-29 12:00:00"
    );
    assert.equal(result.list?.[0]?.device_os, "安卓");
    assert.equal(result.list?.[0]?.number_source, "买量");
    assert.equal(result.list?.[0]?.friends_num, 0);
    assert.equal(result.list?.[0]?.groups_num, 2);
    assert.equal(result.list?.[0]?.country, "印度");
    assert.equal(result.list?.[0]?.country_flag, "🇮🇳");
    assert.equal(result.list?.[0]?.dispatched_at, "2026-06-29 12:00:00");
    assert.equal(
      result.list?.[0]?.message_restriction_until,
      "2026-06-30 12:00:00"
    );
    assert.equal(
      result.list?.[0]?.pulling_restriction_until,
      "2026-07-01 12:00:00"
    );
  });

  it("maps marketing occupancy facts returned by the account list", async () => {
    resetArmadaMock({
      list: [
        {
          id: 100,
          marketingOccupancyType: "GROUP_PULL_MARKETING",
          marketingOccupancyTaskId: 88,
          marketingLockedAt: 1782705600000
        }
      ],
      total: 1
    });

    const result = await listTenantAccounts();

    assert.deepEqual(
      {
        type: result.list?.[0]?.marketing_occupancy_type,
        taskId: result.list?.[0]?.marketing_occupancy_task_id,
        lockedAt: result.list?.[0]?.marketing_locked_at
      },
      {
        type: "GROUP_PULL_MARKETING",
        taskId: 88,
        lockedAt: "2026-06-29 12:00:00"
      }
    );
  });

  it("exports selected WS phones as a blob with backend filename and count", async () => {
    const blob = new Blob(["60123456789\n6598765432"], {
      type: "text/plain;charset=UTF-8"
    });
    resetHttpMock(blob, {
      "Content-Type": "text/plain;charset=UTF-8",
      "Content-Disposition":
        "attachment; filename*=UTF-8''%E9%A9%AC%E6%9D%A5%E8%A5%BF%E4%BA%9A%E5%AE%A2%E6%88%B7%E7%BB%84_2026-07-15.txt",
      "X-Export-Count": "2"
    });

    const result = await exportTenantAccountWsPhones({
      ids: [101, 102],
      groupName: "马来西亚客户组"
    });

    assert.equal(result.filename, "马来西亚客户组_2026-07-15.txt");
    assert.equal(result.exportedCount, 2);
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "post",
        url: "/api/accounts/export-ws-phones",
        opts: {
          data: { ids: [101, 102], groupName: "马来西亚客户组" },
          responseType: "blob"
        },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });

  it("surfaces the backend message from a JSON export response", async () => {
    const blob = new Blob(
      [
        JSON.stringify({
          code: 40001,
          message: "当前所选账号中没有可导出的有效WS号码。",
          data: null
        })
      ],
      { type: "application/json" }
    );
    resetHttpMock(blob, { "Content-Type": "application/json" });

    await assert.rejects(
      exportTenantAccountWsPhones({ ids: [101] }),
      /当前所选账号中没有可导出的有效WS号码。/
    );
  });
});

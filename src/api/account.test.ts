import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  batchDeleteTenantAccounts,
  batchMigrateTenantAccountsToGroup,
  batchOfflineTenantAccounts,
  batchOfflineTenantAccountsByQuery,
  batchOnlineTenantAccounts,
  batchOnlineTenantAccountsByQuery,
  batchTakeoverTenantAccounts,
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

  it("maps device and dispatch fields from account list rows", async () => {
    resetArmadaMock({
      list: [
        {
          id: 100,
          accountType: 1,
          deviceOs: 1,
          numberSource: 1,
          friendsNum: 0,
          groupsNum: 2,
          dispatchedAt: 1782705600000
        }
      ],
      total: 1
    });

    const result = await listTenantAccounts();

    assert.equal(result.list?.[0]?.account_type, "个人号");
    assert.equal(result.list?.[0]?.device_os, "安卓");
    assert.equal(result.list?.[0]?.number_source, "买量");
    assert.equal(result.list?.[0]?.friends_num, 0);
    assert.equal(result.list?.[0]?.groups_num, 2);
    assert.equal(result.list?.[0]?.dispatched_at, "2026-06-29 12:00:00");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  batchCommandResultMessage,
  batchConfirmMessage,
  buildBatchPreviewRequest
} from "./account-batch-operation";

describe("account batch operation", () => {
  it("uses selected IDs before applied filters", () => {
    assert.deepEqual(
      buildBatchPreviewRequest("ONLINE", [10, 11], { loginState: 2 }),
      {
        operation: "ONLINE",
        scope: "IDS",
        ids: [10, 11]
      }
    );
  });

  it("describes a selected online operation with skipped accounts", () => {
    assert.equal(
      batchConfirmMessage("ONLINE", 10, true, {
        matched: 10,
        executable: 8,
        skipped: 2,
        skipReasons: { BANNED: 2 }
      }),
      "当前已勾选 10 个账号，预计执行批量登录 8 个，跳过 2 个不可登录账号，是否继续？"
    );
  });

  it("describes a filtered unselected online operation", () => {
    assert.equal(
      batchConfirmMessage("ONLINE", 0, true, {
        matched: 1256,
        executable: 1200,
        skipped: 56,
        skipReasons: {}
      }),
      "当前未勾选账号，符合已生效筛选条件共 1,256 个；预计执行批量登录 1,200 个，跳过 56 个不可登录账号，是否继续？"
    );
  });

  it("shows deregistered skip counts for selected, filtered and all-account operations", () => {
    for (const [selectedCount, hasAppliedFilters] of [
      [10, true],
      [0, true],
      [0, false]
    ] as const) {
      const message = batchConfirmMessage(
        "ONLINE",
        selectedCount,
        hasAppliedFilters,
        {
          matched: 10,
          executable: 7,
          skipped: 3,
          skipReasons: { DEREGISTERED: 3 }
        }
      );
      assert.match(message, /预计执行批量登录 7 个/);
      assert.match(message, /已注销 3/);
    }
  });

  it("shows deregistered skips in the final batch result", () => {
    const message = batchCommandResultMessage("ONLINE", {
      requested: 282,
      submitted: 279,
      accepted: 279,
      timeout: 0,
      proxyRequired: 0,
      error: 0,
      remote: 0,
      elapsedMs: 0,
      skipped: 3,
      failed: 0,
      skipReasons: { DEREGISTERED: 3 },
      batchErrors: [],
      results: [],
      remoteRoutes: []
    });
    assert.match(message, /跳过 3（已注销 3）/);
  });

  it("describes an unfiltered offline operation as all accounts", () => {
    assert.equal(
      batchConfirmMessage("OFFLINE", 0, false, {
        matched: 1256,
        executable: 1256,
        skipped: 0,
        skipReasons: {}
      }),
      "当前未勾选账号，将对全部 1,256 个账号执行批量离线，是否继续？"
    );
  });

  it("summarizes accepted skipped and failed command counts", () => {
    assert.equal(
      batchCommandResultMessage("ONLINE", {
        requested: 1256,
        submitted: 1200,
        accepted: 1190,
        timeout: 0,
        proxyRequired: 0,
        error: 10,
        remote: 0,
        elapsedMs: 0,
        skipped: 56,
        failed: 10,
        skipReasons: {},
        batchErrors: [],
        results: [],
        remoteRoutes: []
      }),
      "批量登录请求已提交，已受理 1,190/1,256，跳过 56，失败 10"
    );
  });
});

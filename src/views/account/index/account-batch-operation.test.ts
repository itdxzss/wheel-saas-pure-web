import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TenantAccountBatchCommandResult } from "../../../api/account";
import {
  batchCommandResultFeedback,
  batchCommandResultMessage,
  batchConfirmMessage,
  buildBatchPreviewRequest
} from "./account-batch-operation";

function commandResult(
  overrides: Partial<TenantAccountBatchCommandResult> = {}
): TenantAccountBatchCommandResult {
  return {
    requested: 282,
    submitted: 282,
    accepted: 282,
    timeout: 0,
    proxyRequired: 0,
    error: 0,
    remote: 0,
    elapsedMs: 0,
    skipped: 0,
    failed: 0,
    skipReasons: {},
    batchErrors: [],
    results: [],
    remoteRoutes: [],
    ...overrides
  };
}

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
    const feedback = batchCommandResultFeedback(
      "ONLINE",
      commandResult({
        accepted: 279,
        skipped: 3,
        skipReasons: { DEREGISTERED: 3 }
      })
    );
    assert.equal(feedback.type, "warning");
    assert.match(feedback.message, /跳过 3（已注销 3）/);
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
      "批量登录请求部分受理，已受理 1,190/1,256，跳过 56，失败 10"
    );
  });

  for (const operation of ["ONLINE", "OFFLINE"] as const) {
    it(`reports fully accepted ${operation} commands without claiming final account state`, () => {
      const feedback = batchCommandResultFeedback(operation, commandResult());

      assert.equal(feedback.type, "success");
      assert.match(feedback.message, /请求已受理，已受理 282\/282/);
      assert.doesNotMatch(feedback.message, /成功|已上线|已离线/);
    });

    it(`reports fully rejected ${operation} commands as an error with the backend reason`, () => {
      const reason = "账号 2755：账号已被一次性建群任务预留或进入永久注销流程";
      const feedback = batchCommandResultFeedback(
        operation,
        commandResult({
          accepted: 0,
          failed: 282,
          batchErrors: [reason]
        })
      );

      assert.equal(feedback.type, "error");
      assert.match(feedback.message, /请求未受理，已受理 0\/282/);
      assert.ok(feedback.message.includes(reason));
      assert.doesNotMatch(feedback.message, /请求已提交|成功/);
    });

    it(`warns when one account is rejected while the remaining ${operation} commands are accepted`, () => {
      const feedback = batchCommandResultFeedback(
        operation,
        commandResult({
          accepted: 281,
          failed: 1,
          batchErrors: ["账号 2755：账号已被一次性建群任务预留"]
        })
      );

      assert.equal(feedback.type, "warning");
      assert.match(feedback.message, /请求部分受理，已受理 281\/282/);
      assert.match(feedback.message, /失败 1；原因：账号 2755/);
    });
  }

  it("reports a rejected single-account offline request as an error", () => {
    const feedback = batchCommandResultFeedback(
      "OFFLINE",
      commandResult({
        requested: 1,
        submitted: 1,
        accepted: 0,
        failed: 1,
        batchErrors: ["账号 2755：账号已被一次性建群任务预留"]
      }),
      true
    );

    assert.equal(feedback.type, "error");
    assert.match(feedback.message, /^下线请求未受理，已受理 0\/1/);
    assert.match(feedback.message, /账号 2755：账号已被一次性建群任务预留/);
  });

  it("warns when accounts are skipped, including when no command is accepted", () => {
    for (const accepted of [0, 281]) {
      const feedback = batchCommandResultFeedback(
        "ONLINE",
        commandResult({ accepted, skipped: 282 - accepted })
      );

      assert.equal(feedback.type, "warning");
    }
  });

  it("does not report an empty request as a success", () => {
    assert.equal(
      batchCommandResultFeedback(
        "OFFLINE",
        commandResult({ requested: 0, submitted: 0, accepted: 0 })
      ).type,
      "warning"
    );
  });

  it("redacts phone-like numbers and limits duplicated backend error details", () => {
    const feedback = batchCommandResultFeedback(
      "OFFLINE",
      commandResult({
        accepted: 0,
        failed: 282,
        batchErrors: [
          "账号 2755：会话 15551234567 不可用\n请稍后重试",
          "账号 2755：会话 15551234567 不可用\n请稍后重试",
          "账号 2756：会话 +1 (555) 123-4567 不可用",
          "账号 2757：已预留",
          "账号 2758：已预留"
        ]
      })
    );

    assert.doesNotMatch(feedback.message, /15551234567|555|\n/);
    assert.match(feedback.message, /账号 2755：会话 \[号码已隐藏\] 不可用/);
    assert.match(feedback.message, /账号 2756：会话 \[号码已隐藏\] 不可用/);
    assert.equal(feedback.message.match(/账号 2755/g)?.length, 1);
    assert.match(feedback.message, /另有 1 条原因/);
  });
});

it("shows takeover partial acceptance and the rejected account", () => {
  const feedback = batchCommandResultFeedback(
    "TAKEOVER",
    commandResult({
      requested: 3,
      submitted: 3,
      accepted: 2,
      failed: 1,
      batchErrors: ["账号 2794：账号已被一次性建群任务预留或进入永久注销流程"]
    })
  );
  assert.equal(feedback.type, "warning");
  assert.match(feedback.message, /一键抢登请求部分受理，已受理 2\/3/);
  assert.match(feedback.message, /失败 1/);
  assert.match(feedback.message, /账号 2794：/);
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { groupExecutionResultMeta } from "./group-execution-result.ts";

describe("group execution result meta", () => {
  it("maps backend results to the confirmed Chinese labels", () => {
    assert.deepEqual(groupExecutionResultMeta("SUCCESS"), {
      label: "发送成功",
      tagType: "success",
      tagged: true
    });
    assert.deepEqual(groupExecutionResultMeta("FAILED"), {
      label: "发送失败",
      tagType: "danger",
      tagged: true
    });
    assert.deepEqual(groupExecutionResultMeta("SKIPPED"), {
      label: "已跳过",
      tagType: "warning",
      tagged: true
    });
  });

  it("shows a plain dash for missing or unknown values", () => {
    assert.deepEqual(groupExecutionResultMeta(null), {
      label: "-",
      tagType: "info",
      tagged: false
    });
    assert.equal(groupExecutionResultMeta("FUTURE_VALUE").label, "-");
  });
});

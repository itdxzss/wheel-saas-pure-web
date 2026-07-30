import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GROUP_PULL_MARKETING_LIST_PATH,
  normalizeThreshold,
  notifyUnconfirmedCreateAction,
  reconcileSelectedGroupIds,
  resolveTargetFileSelection,
  thresholdMaximum
} from "./create-interactions";

describe("group pull marketing create interactions", () => {
  it("preserves selections from other pages and replaces the current page", () => {
    assert.deepEqual(
      reconcileSelectedGroupIds([1, 2, 8], [1, 2, 3], [2, 3]),
      [8, 2, 3]
    );
    assert.deepEqual(reconcileSelectedGroupIds([8, 2, 3], [1, 2, 3], []), [8]);
  });

  it("deduplicates selected group ids", () => {
    assert.deepEqual(reconcileSelectedGroupIds([8, 8], [1, 2], [2, 2]), [8, 2]);
  });

  it("caps rate thresholds without limiting count thresholds", () => {
    assert.equal(thresholdMaximum("RATE"), 100);
    assert.equal(thresholdMaximum("COUNT"), undefined);
    assert.equal(normalizeThreshold(140, "RATE"), 100);
    assert.equal(normalizeThreshold(140, "COUNT"), 140);
    assert.equal(normalizeThreshold(-1, "COUNT"), 0);
  });

  it("accepts only TXT targets and preserves the previous valid file", () => {
    const previous = { name: "previous.txt" };
    const valid = { name: "TARGETS.TXT" };
    const invalid = { name: "targets.txt.exe" };

    assert.deepEqual(resolveTargetFileSelection(previous, valid), {
      file: valid,
      warning: null
    });
    assert.deepEqual(resolveTargetFileSelection(previous, invalid), {
      file: previous,
      warning: "仅支持 TXT 文件"
    });
    assert.deepEqual(resolveTargetFileSelection(previous, null), {
      file: previous,
      warning: null
    });
  });

  it("reports unconfirmed actions without exposing an API execution hook", () => {
    const notifications: string[] = [];
    const apiCalls: string[] = [];

    notifyUnconfirmedCreateAction("创建并启动", message => {
      notifications.push(message);
    });

    assert.deepEqual(notifications, [
      "创建并启动接口契约待确认，当前仅完成前端配置"
    ]);
    assert.deepEqual(apiCalls, []);
    assert.equal(GROUP_PULL_MARKETING_LIST_PATH, "/task/group-pull-marketing");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayMetric,
  displayRate,
  groupSourceLabel,
  progressPercentage,
  resourceShortageLabel,
  taskTypeLabel
} from "./task-list-display";

describe("group pull marketing task list display", () => {
  it("keeps missing metrics separate from real zero values", () => {
    assert.equal(displayMetric(undefined), "--");
    assert.equal(displayMetric(null), "--");
    assert.equal(displayMetric(0), "0");
    assert.equal(displayMetric(29886), "29,886");
    assert.equal(displayRate(undefined), "--");
    assert.equal(displayRate(0), "0.0%");
    assert.equal(displayRate(72.6), "72.6%");
  });

  it("only calculates progress from a known positive target", () => {
    assert.equal(progressPercentage(68, 100), 68);
    assert.equal(progressPercentage(120, 100), 100);
    assert.equal(progressPercentage(-1, 100), 0);
    assert.equal(progressPercentage(undefined, 100), null);
    assert.equal(progressPercentage(0, 0), null);
  });

  it("maps confirmed task metadata without guessing unknown values", () => {
    assert.equal(taskTypeLabel("GROUP_MARKETING"), "拉群营销");
    assert.equal(taskTypeLabel(undefined), "--");
    assert.equal(groupSourceLabel("HISTORICAL"), "历史老群");
    assert.equal(groupSourceLabel("SELF_COLLECTED"), "自收群");
    assert.equal(groupSourceLabel("MIXED"), "混合来源");
    assert.equal(groupSourceLabel(undefined), "--");
  });

  it("formats every resource shortage type", () => {
    assert.equal(
      resourceShortageLabel({
        type: "MARKETING_ADMIN",
        shortageCount: 2
      }),
      "缺营销管理员2个"
    );
    assert.equal(
      resourceShortageLabel({ type: "PULLER", shortageCount: null }),
      "拉手不足"
    );
  });
});

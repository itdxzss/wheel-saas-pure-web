import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const displayModuleUrl = new URL("./task-list-display.ts", import.meta.url);
const constantsSource = readFileSync(
  fileURLToPath(new URL("./constants.ts", import.meta.url)),
  "utf8"
);

describe("pull task list display", () => {
  it("keeps missing metrics separate from real zero values", async () => {
    assert.ok(
      existsSync(fileURLToPath(displayModuleUrl)),
      "task-list-display.ts should exist"
    );
    const { displayMetric, displayRate } = await import(displayModuleUrl.href);

    assert.equal(displayMetric(undefined), "--");
    assert.equal(displayMetric(null), "--");
    assert.equal(displayMetric(0), "0");
    assert.equal(displayMetric(29886), "29,886");
    assert.equal(displayRate(undefined), "--");
    assert.equal(displayRate(0), "0.0%");
    assert.equal(displayRate(72.6), "72.6%");
  });

  it("calculates progress only from a known positive target", async () => {
    assert.ok(existsSync(fileURLToPath(displayModuleUrl)));
    const { progressPercentage } = await import(displayModuleUrl.href);

    assert.equal(progressPercentage(68, 100), 68);
    assert.equal(progressPercentage(120, 100), 100);
    assert.equal(progressPercentage(-1, 100), 0);
    assert.equal(progressPercentage(undefined, 100), null);
    assert.equal(progressPercentage(0, 0), null);
  });

  it("maps confirmed task metadata and resource shortages", async () => {
    assert.ok(existsSync(fileURLToPath(displayModuleUrl)));
    const { groupSourceLabel, resourceShortageLabel, taskTypeLabel } =
      await import(displayModuleUrl.href);

    assert.equal(taskTypeLabel("STANDARD"), "普通拉群");
    assert.equal(taskTypeLabel("GROUP_MARKETING"), "拉群营销");
    assert.equal(taskTypeLabel(undefined), "--");
    assert.equal(groupSourceLabel("HISTORICAL"), "历史老群");
    assert.equal(groupSourceLabel("SELF_COLLECTED"), "自收群");
    assert.equal(groupSourceLabel("MIXED"), "混合来源");
    assert.equal(groupSourceLabel(undefined), "--");
    assert.equal(
      resourceShortageLabel({ type: "MARKETING_ADMIN" }),
      "营销管理员不足"
    );
    assert.equal(resourceShortageLabel({ type: "PULLER" }), "拉手不足");
  });

  it("shows unknown messages only when their count is positive", async () => {
    const { shouldShowUnknownMessage } = await import(displayModuleUrl.href);

    assert.equal(shouldShowUnknownMessage(undefined), false);
    assert.equal(shouldShowUnknownMessage(null), false);
    assert.equal(shouldShowUnknownMessage(0), false);
    assert.equal(shouldShowUnknownMessage(9), true);
  });

  it("declares the nine confirmed column groups", () => {
    for (const label of [
      "任务信息",
      "任务状态",
      "群组处理进度",
      "拉人结果",
      "营销进度",
      "消息发送",
      "异常情况",
      "剩余资源",
      "时间/操作"
    ]) {
      assert.match(constantsSource, new RegExp(`label: "${label}"`));
    }
    assert.doesNotMatch(constantsSource, /\{ label: "时间",/);
    assert.doesNotMatch(constantsSource, /\{ label: "操作",/);
  });
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8"
  );
}

describe("normal-link puller supplement selection", () => {
  it("shows the four immutable selection combinations and fixed data policy", () => {
    const componentUrl = new URL(
      "./PullTaskPullerSupplementDrawer.vue",
      import.meta.url
    );
    assert.equal(existsSync(fileURLToPath(componentUrl)), true);
    const drawer = source("./PullTaskPullerSupplementDrawer.vue");

    for (const label of [
      "当前拉手",
      "计划拉手",
      "缺少拉手",
      "拉手账号分组",
      "补充数量",
      "选择方式",
      "进入群组方式",
      "候选拉手账号",
      "继续使用当前剩余目标数据"
    ]) {
      assert.match(drawer, new RegExp(label));
    }
    assert.match(drawer, /自动选择/);
    assert.match(drawer, /手动选择/);
    assert.match(drawer, /踩链接进群/);
    assert.match(drawer, /当前管理员邀请进群/);
    assert.match(drawer, /disabled/);
    assert.match(drawer, /managerInviteAvailable/);
  });

  it("mounts puller and manager flows behind execution-row resource types", () => {
    const detail = source("./PullTaskDetailDrawer.vue");
    const actions = source("./PullTaskExecutionResourceActions.vue");
    const index = source("../index.vue");
    const flows = source("./PullTaskResourceSupplementFlows.vue");

    assert.match(detail, /open-puller-supplement/);
    assert.match(actions, /waitResourceType === 2/);
    assert.match(actions, /waitResourceType === 1/);
    assert.match(actions, /tenant:pull_task:operate/);
    assert.match(index, /<PullTaskResourceSupplementFlows/);
    assert.match(flows, /<PullTaskManagerSupplementFlow/);
    assert.match(flows, /<PullTaskPullerSupplementFlow/);
  });
});

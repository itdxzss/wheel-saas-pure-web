import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8"
  );
}

describe("normal-link station supplement selection", () => {
  it("shows group, gap, quantity and automatic or manual candidates only", () => {
    const drawer = source("./PullTaskStationSupplementDrawer.vue");
    for (const label of [
      "站台账号分组",
      "当前缺口",
      "补充数量",
      "选择方式",
      "自动选择",
      "手动选择",
      "候选站台账号"
    ]) {
      assert.match(drawer, new RegExp(label));
    }
    assert.doesNotMatch(drawer, /进入群组方式/);
    assert.doesNotMatch(drawer, /踩链接进群/);
    assert.doesNotMatch(drawer, /管理员邀请进群/);
  });

  it("routes only station waits to the station locking flow", () => {
    const actions = source("./PullTaskExecutionResourceActions.vue");
    const detail = source("./PullTaskDetailDrawer.vue");
    const flows = source("./PullTaskResourceSupplementFlows.vue");

    assert.match(actions, /waitResourceType === 3/);
    assert.match(actions, /补充站台/);
    assert.match(detail, /open-station-supplement/);
    assert.match(flows, /<PullTaskStationSupplementFlow/);
  });
});

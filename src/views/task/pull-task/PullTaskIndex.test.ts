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

const indexSource = source("./index.vue");
const pageStateSource = source("./composables/usePullTaskPage.ts");

describe("pull task list prototype", () => {
  it("renders the ten prototype information groups", () => {
    for (const label of [
      "任务信息",
      "任务状态",
      "群组处理进度",
      "拉人结果",
      "营销进度",
      "消息发送",
      "异常情况",
      "剩余资源",
      "时间",
      "操作"
    ]) {
      assert.match(indexSource, new RegExp(`label="${label}"`));
    }
    assert.match(indexSource, /displayMetric/);
    assert.match(indexSource, /displayRate/);
    assert.match(indexSource, /progressPercentage/);
  });

  it("opens the correct create page and removes the legacy drawer", () => {
    assert.match(indexSource, /useRouter/);
    assert.match(indexSource, /router\.push\("\/task\/pull-task\/create"\)/);
    assert.doesNotMatch(indexSource, /PullTaskCreateDrawer|openCreateDrawer/);
    assert.equal(
      existsSync(
        fileURLToPath(
          new URL("./components/PullTaskCreateDrawer.vue", import.meta.url)
        )
      ),
      false
    );
  });

  it("preserves pull task permissions, detail and lifecycle actions", () => {
    assert.match(indexSource, /tenant:pull_task:create/);
    assert.match(indexSource, /tenant:pull_task:delete/);
    assert.match(indexSource, /openDetailDrawer/);
    for (const action of ["start", "pause", "stop"]) {
      assert.match(indexSource, new RegExp(`'${action}'`));
    }
    assert.match(indexSource, /PullTaskDetailDrawer/);
  });

  it("removes only the obsolete create state and legacy API call", () => {
    for (const obsolete of [
      "createPullTask",
      "PullTaskCreateForm",
      "subMode",
      "createDrawerOpen",
      "loadGroupLinks"
    ]) {
      assert.doesNotMatch(pageStateSource, new RegExp(obsolete));
    }
    assert.match(pageStateSource, /listPullTasks/);
    assert.match(pageStateSource, /getPullTaskDetail/);
    assert.match(pageStateSource, /listAccountGroups/);
  });
});

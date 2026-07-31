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
  it("delegates the nine-column markup to PullTaskTable", () => {
    assert.match(indexSource, /import PullTaskTable/);
    assert.match(indexSource, /<PullTaskTable/);
    assert.doesNotMatch(indexSource, /<el-table-column/);
    assert.doesNotMatch(indexSource, /label="时间"/);
    assert.doesNotMatch(indexSource, /label="操作"/);
  });

  it("opens a task-type selector and mounts the standard drawer", () => {
    assert.match(indexSource, /useRouter/);
    assert.match(indexSource, /PullTaskTypeDialog/);
    assert.match(indexSource, /PullTaskCreateDrawer/);
    assert.match(indexSource, /openTaskTypeDialog/);
    assert.match(indexSource, /handleTaskTypeSelect/);
    assert.match(indexSource, /router\.push\("\/task\/pull-task\/create"\)/);
    assert.equal(
      existsSync(
        fileURLToPath(
          new URL("./components/PullTaskCreateDrawer.vue", import.meta.url)
        )
      ),
      true
    );
  });

  it("preserves pull task permissions, detail and lifecycle actions", () => {
    assert.match(indexSource, /tenant:pull_task:create/);
    assert.match(indexSource, /tenant:pull_task:delete/);
    assert.match(indexSource, /openDetailDrawer/);
    for (const action of ["start", "pause", "stop"]) {
      assert.match(indexSource, new RegExp(`["']${action}["']`));
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

  it("keeps only the confirmed unified-list search fields", () => {
    assert.match(pageStateSource, /taskType: "" \| PullTaskType/);
    assert.match(pageStateSource, /groupSource: "" \| PullTaskGroupSource/);
    assert.match(pageStateSource, /taskType: searchForm\.taskType/);
    assert.match(pageStateSource, /groupSource: searchForm\.groupSource/);
    for (const obsolete of ["orderState", "banState"]) {
      assert.doesNotMatch(pageStateSource, new RegExp(obsolete));
      assert.doesNotMatch(indexSource, new RegExp(obsolete));
    }
    assert.doesNotMatch(pageStateSource, /mode: searchForm\.mode/);
  });
});

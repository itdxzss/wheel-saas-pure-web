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
const detailDrawerSource = source("./components/PullTaskDetailDrawer.vue");
const savedSettingsSource = source(
  "./components/PullTaskStandardSavedSettings.vue"
);
const executionResourcesSource = source(
  "./components/PullTaskStandardExecutionResourceCounts.vue"
);
const executionDetailSource = source(
  "./components/PullTaskExecutionDetailDrawer.vue"
);
const standardSummarySource = source(
  "./components/PullTaskStandardTaskSummary.vue"
);

describe("pull task list prototype", () => {
  it("delegates the nine-column markup to PullTaskTable", () => {
    assert.match(indexSource, /import PullTaskTable/);
    assert.match(indexSource, /<PullTaskTable/);
    assert.doesNotMatch(indexSource, /<el-table-column/);
    assert.doesNotMatch(indexSource, /label="时间"/);
    assert.doesNotMatch(indexSource, /label="操作"/);
  });

  it("opens the normal-link create surface directly from the new-task entry", () => {
    assert.match(indexSource, /PullTaskCreateDrawer/);
    assert.match(indexSource, /@click="openStandardCreate"/);
    assert.doesNotMatch(indexSource, /PullTaskTypeDialog/);
    assert.doesNotMatch(indexSource, /openTaskTypeDialog/);
    assert.doesNotMatch(indexSource, /handleTaskTypeSelect/);
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
    for (const action of ["start", "pause", "resume", "end"]) {
      assert.match(indexSource, new RegExp(`["']${action}["']`));
    }
    assert.match(indexSource, /PullTaskDetailDrawer/);
    assert.match(detailDrawerSource, /activeTask\?\.allowedActions/);
    assert.match(detailDrawerSource, /run-task-operation/);
    assert.match(indexSource, /@run-task-operation="handleDetailTaskAction/);
    assert.match(pageStateSource, /结束任务/);
  });

  it("keeps legacy batch operations out of the normal-link detail view", () => {
    assert.match(detailDrawerSource, /const normalLink = computed/);
    assert.match(detailDrawerSource, /v-if="!normalLink"/);
    assert.match(executionResourcesSource, /row\.managers/);
    assert.match(executionResourcesSource, /row\.pullers/);
    assert.match(executionResourcesSource, /row\.stations/);
    assert.match(detailDrawerSource, /row\.lastBusinessExecutedAt/);
    assert.match(detailDrawerSource, /standardStageOptions/);
    assert.match(detailDrawerSource, /standardWaitResourceOptions/);
    assert.match(detailDrawerSource, /row\.stage/);
    assert.match(detailDrawerSource, /row\.materialSummary/);
    assert.match(standardSummarySource, /执行中/);
    assert.match(standardSummarySource, /等待资源/);
    assert.match(standardSummarySource, /已取消/);
  });

  it("mounts the real execution and member detail drawer", () => {
    assert.match(indexSource, /usePullTaskExecutionDetail/);
    assert.match(indexSource, /PullTaskExecutionDetailDrawer/);
    assert.match(indexSource, /open-execution-detail/);
    assert.match(executionDetailSource, /detail\.roles/);
    assert.match(executionDetailSource, /detail\.calls/);
    assert.match(executionDetailSource, /detail\.actions/);
    assert.match(executionDetailSource, /members/);
    assert.doesNotMatch(executionDetailSource, /营销/);
  });

  it("shows normalized saved settings in normal-link task detail", () => {
    assert.match(pageStateSource, /standardSetting: detail\.standardSetting/);
    assert.match(pageStateSource, /groupSetting: detail\.groupSetting/);
    assert.match(indexSource, /:detail-task="detailTask"/);
    assert.match(detailDrawerSource, /PullTaskStandardSavedSettings/);
    assert.match(detailDrawerSource, /detailTask\?\.standardSetting/);
    assert.match(detailDrawerSource, /detailTask\?\.groupSetting/);
    assert.match(savedSettingsSource, /已保存任务配置/);
    assert.match(savedSettingsSource, /前期单次拉人数/);
    assert.match(savedSettingsSource, /前期拉人执行次数/);
    assert.match(savedSettingsSource, /拉手踩链接进群/);
    assert.match(savedSettingsSource, /avatarPreviewUrl/);
    assert.match(savedSettingsSource, /getPullTaskStandardGroupAvatarContent/);
    assert.match(savedSettingsSource, /URL\.createObjectURL/);
    assert.match(savedSettingsSource, /URL\.revokeObjectURL/);
    assert.match(savedSettingsSource, /:src="avatarObjectUrl"/);
    assert.doesNotMatch(
      savedSettingsSource,
      /:src="groupSetting\.avatarPreviewUrl"/
    );
    assert.doesNotMatch(savedSettingsSource, /已应用到 WhatsApp/);
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
    assert.match(pageStateSource, /getPullTaskStandardDetail/);
    assert.match(pageStateSource, /execution\.waitResourceType/);
    assert.match(pageStateSource, /listAccountGroups/);
    assert.match(pageStateSource, /downloadBlobFile/);
    assert.doesNotMatch(pageStateSource, /document\.createElement/);
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

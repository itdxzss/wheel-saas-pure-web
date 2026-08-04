<script setup lang="ts">
import { ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import PullTaskDetailDrawer from "./components/PullTaskDetailDrawer.vue";
import PullTaskExecutionDetailDrawer from "./components/PullTaskExecutionDetailDrawer.vue";
import PullTaskCreateDrawer from "./components/PullTaskCreateDrawer.vue";
import PullTaskGlobalSettingDialog from "./components/PullTaskGlobalSettingDialog.vue";
import PullTaskResourceSupplementFlows from "./components/PullTaskResourceSupplementFlows.vue";
import PullTaskTable from "./components/PullTaskTable.vue";
import {
  pullTaskColumns,
  pullTaskGroupSourceOptions,
  pullTaskStatusOptions,
  pullTaskTypeOptions
} from "./constants";
import { usePullTaskPage } from "./composables/usePullTaskPage";
import { usePullTaskExecutionDetail } from "./composables/usePullTaskExecutionDetail";
import { usePullTaskGlobalSetting } from "./composables/usePullTaskGlobalSetting";
import { useStandardPullTaskCreate } from "./composables/useStandardPullTaskCreate";
import type { PullTaskListAction, PullTaskRow } from "@/api/pull-task";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";
import RefreshRight from "~icons/ep/refresh-right";
import Setting from "~icons/ep/setting";
import Search from "~icons/ri/search-line";

defineOptions({
  name: "TaskPull"
});
type SupplementFlows = InstanceType<typeof PullTaskResourceSupplementFlows>;
const resourceSupplementFlows = ref<SupplementFlows | null>(null);
const lifecycleActions = {
  START: "start",
  PAUSE: "pause",
  RESUME: "resume",
  END: "end"
} as const;
const {
  cancel: cancelGlobalSetting,
  form: globalSettingForm,
  loading: globalSettingLoading,
  open: openGlobalSetting,
  save: saveGlobalSetting,
  saving: globalSettingSaving,
  visible: globalSettingVisible
} = usePullTaskGlobalSetting();
const {
  accountGroups,
  activeTask,
  advancedOpen,
  deleteSelected,
  deleteTask,
  detailDrawerOpen,
  detailGroupRows,
  detailLoading,
  detailPage,
  detailPageSize,
  detailSearchForm,
  detailSelectedCount,
  detailSummary,
  standardTaskSummary,
  detailTotal,
  exportGroupLinks,
  exportReport,
  exportResources,
  loading,
  onDetailSelectionChange,
  onSelectionChange,
  openDetailDrawer,
  openSupplementDrawer,
  page,
  pageSize,
  refreshDetailGroups,
  refreshTasks,
  resetDetailSearch,
  resetSearchForm,
  rows,
  runExecutionAction,
  runGroupOperation,
  runRowsOperation,
  runTaskAction,
  searchForm,
  searchTasks,
  selectedCount,
  supplementDrawerOpen,
  supplementForm,
  supplementPullers,
  toggleAdvanced,
  total
} = usePullTaskPage();

const {
  detail: executionDetail,
  loading: executionDetailLoading,
  members: executionMembers,
  open: openExecutionDetail,
  visible: executionDetailVisible
} = usePullTaskExecutionDetail();

const {
  addFiles: addStandardFiles,
  accountGroups: createAccountGroups,
  clear: clearStandardDraft,
  clearing: standardClearing,
  create: createStandardTask,
  creating: standardCreating,
  draft: standardDraft,
  form: standardCreateForm,
  groupFolders: createGroupFolders,
  linksText: standardLinksText,
  loading: standardCreateLoading,
  movePendingFile: moveStandardPendingFile,
  open: openStandardCreate,
  pendingFiles: standardPendingFiles,
  plan: planStandardDraft,
  planning: standardPlanning,
  removePendingFile: removeStandardPendingFile,
  removeRow: removeStandardRow,
  visible: standardCreateVisible
} = useStandardPullTaskCreate({ onCreated: refreshTasks });

function updateGlobalSettingForm(value: typeof globalSettingForm): void {
  Object.assign(globalSettingForm, value);
}

async function handleTableAction(
  row: PullTaskRow,
  action: PullTaskListAction
): Promise<void> {
  if (action === "DETAIL") {
    await openDetailDrawer(row);
    return;
  }
  if (action === "DELETE") {
    await deleteTask(row);
    return;
  }
  const lifecycleAction =
    lifecycleActions[action as keyof typeof lifecycleActions];
  if (lifecycleAction) await runTaskAction(row, lifecycleAction);
}

async function handleExecutionDetail(row: { id: number }): Promise<void> {
  if (!activeTask.value) return;
  await openExecutionDetail(activeTask.value.id, row.id);
}

async function handleDetailTaskAction(
  action: "start" | "pause" | "resume" | "end"
): Promise<void> {
  if (!activeTask.value) return;
  await runTaskAction(activeTask.value, action);
}
</script>

<template>
  <div class="pull-task-page" aria-label="拉群任务">
    <div class="pull-task-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="ID">
          <el-input
            v-model="searchForm.id"
            clearable
            class="search-id"
            placeholder="精准 ID"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="search-keyword"
            placeholder="任务名 / 群名"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="searchForm.status"
            clearable
            class="search-select"
          >
            <el-option
              v-for="item in pullTaskStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="任务类型">
          <el-select
            v-model="searchForm.taskType"
            clearable
            class="search-select"
          >
            <el-option
              v-for="item in pullTaskTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="群组来源">
          <el-select
            v-model="searchForm.groupSource"
            clearable
            class="search-select"
          >
            <el-option
              v-for="item in pullTaskGroupSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="操作员">
          <el-input
            v-model="searchForm.operator"
            clearable
            class="search-operator"
            placeholder="创建人"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchTasks"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
          <el-button text type="primary" @click="toggleAdvanced">
            {{ advancedOpen ? "收起搜索条件" : "展开搜索条件" }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <PureTableBar
      title="拉群任务"
      :columns="pullTaskColumns"
      @refresh="refreshTasks"
    >
      <template #buttons>
        <el-button
          v-auth="'tenant:pull_task:settings'"
          :icon="useRenderIcon(Setting)"
          @click="openGlobalSetting"
        >
          全局设置
        </el-button>
        <el-button
          v-auth="'tenant:pull_task:create'"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openStandardCreate"
        >
          新建拉群任务
        </el-button>
        <el-button
          v-auth="'tenant:pull_task:delete'"
          type="danger"
          plain
          :disabled="selectedCount === 0"
          :icon="useRenderIcon(Delete)"
          @click="deleteSelected"
        >
          批量删除
          <span v-if="selectedCount">({{ selectedCount }})</span>
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <PullTaskTable
          :columns="dynamicColumns"
          :loading="loading"
          :rows="rows"
          @action="handleTableAction"
          @refresh="refreshTasks"
          @selection-change="onSelectionChange"
        />

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          @change="refreshTasks"
        />
      </template>
    </PureTableBar>

    <PullTaskCreateDrawer
      v-model="standardCreateVisible"
      v-model:form="standardCreateForm"
      v-model:links-text="standardLinksText"
      :account-groups="createAccountGroups"
      :clearing="standardClearing"
      :creating="standardCreating"
      :draft="standardDraft"
      :group-folders="createGroupFolders"
      :loading="standardCreateLoading"
      :pending-files="standardPendingFiles"
      :planning="standardPlanning"
      @add-files="addStandardFiles"
      @clear="clearStandardDraft"
      @create="createStandardTask"
      @move-pending-file="moveStandardPendingFile"
      @plan="planStandardDraft"
      @remove-pending-file="removeStandardPendingFile"
      @remove-row="removeStandardRow"
    />

    <PullTaskGlobalSettingDialog
      v-model="globalSettingVisible"
      :form="globalSettingForm"
      :loading="globalSettingLoading"
      :saving="globalSettingSaving"
      @cancel="cancelGlobalSetting"
      @save="saveGlobalSetting"
      @update:form="updateGlobalSettingForm"
    />

    <PullTaskDetailDrawer
      v-model="detailDrawerOpen"
      v-model:detail-page="detailPage"
      v-model:detail-page-size="detailPageSize"
      v-model:search-form="detailSearchForm"
      v-model:supplement-form="supplementForm"
      v-model:supplement-visible="supplementDrawerOpen"
      :account-groups="accountGroups"
      :active-task="activeTask"
      :detail-group-rows="detailGroupRows"
      :detail-loading="detailLoading"
      :detail-selected-count="detailSelectedCount"
      :detail-summary="detailSummary"
      :standard-task-summary="standardTaskSummary"
      :detail-total="detailTotal"
      @export-group-links="exportGroupLinks"
      @export-report="exportReport"
      @export-resources="exportResources"
      @open-supplement="openSupplementDrawer"
      @open-manager-supplement="resourceSupplementFlows?.openManager"
      @open-execution-detail="handleExecutionDetail"
      @open-puller-supplement="resourceSupplementFlows?.openPuller"
      @open-station-supplement="resourceSupplementFlows?.openStation"
      @refresh-detail-groups="refreshDetailGroups"
      @reset-detail-search="resetDetailSearch"
      @run-execution-operation="runExecutionAction"
      @run-group-operation="runGroupOperation"
      @run-rows-operation="runRowsOperation"
      @run-task-operation="handleDetailTaskAction"
      @selection-change="onDetailSelectionChange"
      @supplement-pullers="supplementPullers"
    />

    <PullTaskExecutionDetailDrawer
      v-model="executionDetailVisible"
      :detail="executionDetail"
      :loading="executionDetailLoading"
      :members="executionMembers"
    />

    <PullTaskResourceSupplementFlows
      ref="resourceSupplementFlows"
      :account-groups="accountGroups"
      :task-id="activeTask?.id"
      @submitted="refreshDetailGroups"
    />
  </div>
</template>

<style scoped>
.pull-task-page {
  min-height: 100%;
}

.pull-task-search {
  padding: 16px 16px 0;
  margin-bottom: 16px;
}

.pull-task-search :deep(.el-form-item) {
  margin-bottom: 16px;
}

.search-id {
  width: 120px;
}

.search-keyword {
  width: 220px;
}

.search-operator,
.search-select {
  width: 150px;
}
</style>

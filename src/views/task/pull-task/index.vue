<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import PullTaskCreateDrawer from "./components/PullTaskCreateDrawer.vue";
import PullTaskDetailDrawer from "./components/PullTaskDetailDrawer.vue";
import {
  formatEpoch,
  pullTaskColumns,
  pullTaskModeLabel,
  pullTaskStatusLabel,
  pullTaskStatusOptions,
  pullTaskStatusTagType
} from "./constants";
import { usePullTaskPage } from "./composables/usePullTaskPage";
import type { PullTaskRow } from "@/api/pull-task";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

defineOptions({
  name: "TaskPull"
});

const {
  accountGroups,
  activeTask,
  advancedOpen,
  createDrawerOpen,
  createForm,
  createTask,
  deleteSelected,
  detailDrawerOpen,
  detailGroupRows,
  detailLoading,
  detailPage,
  detailPageSize,
  detailSearchForm,
  detailSelectedCount,
  detailSummary,
  detailTotal,
  exportGroupLinks,
  exportReport,
  exportResources,
  groupLinkOptions,
  groupLinksLoading,
  linkGroups,
  loadGroupLinks,
  loading,
  onDetailSelectionChange,
  onSelectionChange,
  openCreateDrawer,
  openDetailDrawer,
  openSupplementDrawer,
  page,
  pageSize,
  readMaterialFile,
  readWaterFile,
  refreshDetailGroups,
  refreshTasks,
  resetDetailSearch,
  resetSearchForm,
  rows,
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

function progressPercent(row: unknown): number {
  const task = row as PullTaskRow;
  if (!task.expectedPullCount) return 0;
  return Math.min(
    100,
    Math.floor(
      ((task.joinedCount + task.failedCount) / task.expectedPullCount) * 100
    )
  );
}

function asPullTaskRow(row: unknown): PullTaskRow {
  return row as PullTaskRow;
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
          <el-select v-model="searchForm.mode" clearable class="search-select">
            <el-option label="老群链接" value="OLD_LINK" />
            <el-option label="自建群" value="CREATE_NEW" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="是否交单">
          <el-select
            v-model="searchForm.orderState"
            clearable
            class="search-select"
          >
            <el-option label="交单" value="SUBMITTED" />
            <el-option label="未交单" value="UNSUBMITTED" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="群组是否封禁">
          <el-select
            v-model="searchForm.banState"
            clearable
            class="search-select"
          >
            <el-option label="正常" value="NORMAL" />
            <el-option label="封禁" value="BANNED" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="操作员">
          <el-input
            v-model="searchForm.operator"
            clearable
            class="search-operator"
            placeholder="创建人"
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
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openCreateDrawer"
        >
          新增拉群任务
        </el-button>
        <el-button
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
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          border
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="id"
            label="ID"
            width="90"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            label="任务名称"
            min-width="220"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div class="name-cell">
                <strong>{{ row.taskName }}</strong>
                <small>{{ row.groupName || "老群链接拉群" }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            label="拉群模式"
            width="120"
          >
            <template #default="{ row }">
              {{ pullTaskModeLabel(row.mode) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="groupCount"
            label="群组数量"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            label="任务状态"
            width="120"
          >
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="pullTaskStatusTagType(row.status)"
                effect="plain"
              >
                {{ pullTaskStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            label="进度"
            width="140"
          >
            <template #default="{ row }">
              <el-progress
                :percentage="progressPercent(row)"
                :stroke-width="8"
                :show-text="false"
              />
              <small>{{ row.joinedCount }} / {{ row.expectedPullCount }}</small>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="pullerCount"
            label="拉手数"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="joinedCount"
            label="成功进群"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[8].hide"
            prop="failedCount"
            label="异常数"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[9].hide"
            prop="bannedCount"
            label="封禁数"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[10].hide"
            prop="unusedCount"
            label="未使用"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[11].hide"
            label="操作员"
            width="130"
          >
            <template #default="{ row }">{{ row.operator || "-" }}</template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[12].hide"
            label="创建时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatEpoch(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="230">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openDetailDrawer(asPullTaskRow(row))"
              >
                查看详情
              </el-button>
              <el-button
                link
                type="success"
                :disabled="row.status !== 'WAIT_START'"
                @click="runTaskAction(asPullTaskRow(row), 'start')"
              >
                启动
              </el-button>
              <el-button
                link
                type="warning"
                :disabled="row.status !== 'EXECUTING'"
                @click="runTaskAction(asPullTaskRow(row), 'pause')"
              >
                暂停
              </el-button>
              <el-button
                link
                type="danger"
                :disabled="row.status === 'COMPLETED' || row.status === 'ENDED'"
                @click="runTaskAction(asPullTaskRow(row), 'stop')"
              >
                关闭
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无拉群任务" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          @change="refreshTasks"
        />
      </template>
    </PureTableBar>

    <PullTaskCreateDrawer
      v-model="createDrawerOpen"
      v-model:form="createForm"
      :account-groups="accountGroups"
      :group-link-options="groupLinkOptions"
      :group-links-loading="groupLinksLoading"
      :link-groups="linkGroups"
      @create="createTask"
      @load-group-links="loadGroupLinks"
      @read-material-file="readMaterialFile"
      @read-water-file="readWaterFile"
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
      :detail-total="detailTotal"
      @export-group-links="exportGroupLinks"
      @export-report="exportReport"
      @export-resources="exportResources"
      @open-supplement="openSupplementDrawer"
      @refresh-detail-groups="refreshDetailGroups"
      @reset-detail-search="resetDetailSearch"
      @run-group-operation="runGroupOperation"
      @run-rows-operation="runRowsOperation"
      @selection-change="onDetailSelectionChange"
      @supplement-pullers="supplementPullers"
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

.name-cell strong,
.name-cell small {
  display: block;
}

.name-cell small {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
</style>

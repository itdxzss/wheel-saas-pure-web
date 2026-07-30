<script setup lang="ts">
import { useRouter } from "vue-router";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import PullTaskDetailDrawer from "./components/PullTaskDetailDrawer.vue";
import {
  formatEpoch,
  pullTaskColumns,
  pullTaskStatusLabel,
  pullTaskStatusOptions,
  pullTaskStatusTagType
} from "./constants";
import { usePullTaskPage } from "./composables/usePullTaskPage";
import {
  displayMetric,
  displayRate,
  groupSourceLabel,
  progressPercentage,
  resourceShortageLabel,
  taskTypeLabel
} from "./task-list-display";
import type { PullTaskRow } from "@/api/pull-task";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

defineOptions({
  name: "TaskPull"
});

const router = useRouter();

const {
  accountGroups,
  activeTask,
  advancedOpen,
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

function openCreatePage(): void {
  void router.push("/task/pull-task/create");
}

function groupProgress(row: PullTaskRow): number | null {
  return progressPercentage(row.processedGroupCount, row.targetGroupCount);
}

function hasNoExceptions(row: PullTaskRow): boolean {
  return (
    row.abnormalGroupCount === 0 &&
    row.replacementPendingGroupCount === 0 &&
    row.bannedAccountCount === 0
  );
}

function timestampLabel(value?: number | null): string {
  return value == null ? "--" : formatEpoch(value);
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
          v-auth="'tenant:pull_task:create'"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openCreatePage"
        >
          新增拉群任务
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
            label="任务信息"
            fixed="left"
            min-width="260"
          >
            <template #default="{ row }">
              <div class="primary-cell">
                <strong>{{ row.taskName || "--" }}</strong>
                <span class="secondary-line">#{{ row.id }}</span>
                <div class="tag-row">
                  <el-tag size="small" effect="plain" type="success">
                    {{ taskTypeLabel(row.taskType) }}
                  </el-tag>
                  <el-tag size="small" effect="plain" type="info">
                    {{ groupSourceLabel(row.groupSource) }}
                  </el-tag>
                </div>
                <span class="secondary-line">
                  创建人：{{ row.operator || "--" }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            label="任务状态"
            min-width="180"
          >
            <template #default="{ row }">
              <div class="primary-cell">
                <el-tag
                  size="small"
                  :type="pullTaskStatusTagType(row.status)"
                  effect="plain"
                >
                  {{ pullTaskStatusLabel(row.status) }}
                </el-tag>
                <span class="secondary-line">
                  {{ row.primaryStage?.trim() || "--" }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            label="群组处理进度"
            min-width="190"
          >
            <template #default="{ row }">
              <div
                v-if="groupProgress(asPullTaskRow(row)) != null"
                class="metric-cell"
              >
                <strong>
                  {{ displayMetric(row.processedGroupCount) }}/{{
                    displayMetric(row.targetGroupCount)
                  }}
                </strong>
                <el-progress
                  :percentage="groupProgress(asPullTaskRow(row)) || 0"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            label="拉人结果"
            min-width="190"
          >
            <template #default="{ row }">
              <div class="metric-cell">
                <strong>
                  {{ displayMetric(row.joinedSuccessCount) }}/{{
                    displayMetric(row.plannedTargetCount)
                  }}
                </strong>
                <span class="secondary-line">
                  有效成功率 {{ displayRate(row.effectiveSuccessRate) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            label="营销进度"
            min-width="150"
          >
            <template #default="{ row }">
              <div class="metric-cell">
                <span>
                  进行中 {{ displayMetric(row.marketingRunningGroupCount) }}
                </span>
                <span>
                  已完成 {{ displayMetric(row.marketingCompletedGroupCount) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            label="消息发送"
            min-width="170"
          >
            <template #default="{ row }">
              <div class="metric-cell">
                <span class="success-text">
                  成功 {{ displayMetric(row.messageSuccessCount) }}
                </span>
                <span class="danger-text">
                  失败 {{ displayMetric(row.messageFailedCount) }}
                </span>
                <span>未知 {{ displayMetric(row.messageUnknownCount) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            label="异常情况"
            min-width="180"
          >
            <template #default="{ row }">
              <el-tag
                v-if="hasNoExceptions(asPullTaskRow(row))"
                size="small"
                type="success"
              >
                无异常
              </el-tag>
              <div v-else class="metric-cell">
                <span>
                  异常群组 {{ displayMetric(row.abnormalGroupCount) }}
                </span>
                <span>
                  待补位 {{ displayMetric(row.replacementPendingGroupCount) }}
                </span>
                <span>
                  封禁账号 {{ displayMetric(row.bannedAccountCount) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            label="剩余资源"
            min-width="220"
          >
            <template #default="{ row }">
              <div class="metric-cell">
                <span>
                  目标数据 {{ displayMetric(row.remainingTargetCount) }}
                </span>
                <span>
                  可用拉手 {{ displayMetric(row.availablePullerCount) }}
                </span>
                <div v-if="row.resourceShortages?.length" class="tag-row">
                  <el-tag
                    v-for="shortage in row.resourceShortages"
                    :key="shortage.type"
                    size="small"
                    type="danger"
                    effect="plain"
                  >
                    {{ resourceShortageLabel(shortage) }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[8].hide"
            label="时间"
            min-width="190"
          >
            <template #default="{ row }">
              <div class="metric-cell">
                <span>创建 {{ timestampLabel(row.createdAt) }}</span>
                <span>
                  最近执行 {{ timestampLabel(row.lastExecutedAt) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[9].hide"
            label="操作"
            fixed="right"
            width="230"
          >
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openDetailDrawer(asPullTaskRow(row))"
              >
                查看详情
              </el-button>
              <el-button
                v-auth="'tenant:pull_task:operate'"
                link
                type="success"
                :disabled="row.status !== 'WAIT_START'"
                @click="runTaskAction(asPullTaskRow(row), 'start')"
              >
                启动
              </el-button>
              <el-button
                v-auth="'tenant:pull_task:operate'"
                link
                type="warning"
                :disabled="row.status !== 'EXECUTING'"
                @click="runTaskAction(asPullTaskRow(row), 'pause')"
              >
                暂停
              </el-button>
              <el-button
                v-auth="'tenant:pull_task:operate'"
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

.primary-cell,
.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.secondary-line {
  color: var(--el-text-color-secondary);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.metric-cell :deep(.el-progress) {
  width: 150px;
}

.success-text {
  color: var(--el-color-success);
}

.danger-text {
  color: var(--el-color-danger);
}
</style>

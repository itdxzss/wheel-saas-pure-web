<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { GroupPullMarketingTaskRow } from "@/api/group-pull-marketing";
import {
  blockReasonLabel,
  formatEpoch,
  groupPullTaskActions,
  resourceStatusLabel,
  taskStatusLabel,
  taskStatusTagType,
  type GroupPullTaskAction
} from "../constants";
import {
  displayMetric,
  displayRate,
  groupSourceLabel,
  progressPercentage,
  resourceShortageLabel,
  taskTypeLabel
} from "../task-list-display";
import Plus from "~icons/ep/plus";

defineOptions({
  name: "GroupPullMarketingTaskTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: GroupPullMarketingTaskRow[];
  total: number;
}>();

const emit = defineEmits<{
  (
    event: "action",
    action: GroupPullTaskAction,
    row: GroupPullMarketingTaskRow
  ): void;
  (event: "create"): void;
  (event: "refresh"): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});

const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});

function asTaskRow(row: unknown): GroupPullMarketingTaskRow {
  return row as GroupPullMarketingTaskRow;
}

function taskActions(row: GroupPullMarketingTaskRow): GroupPullTaskAction[] {
  return groupPullTaskActions(row);
}

function actionLabel(action: GroupPullTaskAction): string {
  return {
    start: "启动",
    pause: "暂停",
    resume: "恢复",
    release: "释放账号",
    detail: "查看详情",
    delete: "删除"
  }[action];
}

function actionType(action: GroupPullTaskAction) {
  if (action === "delete") return "danger";
  if (action === "release" || action === "pause") return "warning";
  return "primary";
}

function statusDetail(row: GroupPullMarketingTaskRow): string {
  if (row.primaryStage?.trim()) return row.primaryStage;
  if (row.blockReason !== 0) return blockReasonLabel(row.blockReason);
  return resourceStatusLabel(row.resourceStatus);
}

function progress(row: GroupPullMarketingTaskRow): number | null {
  return progressPercentage(row.processedGroupCount, row.targetGroupCount);
}

function hasNoExceptions(row: GroupPullMarketingTaskRow): boolean {
  return (
    row.abnormalGroupCount === 0 &&
    row.replacementPendingGroupCount === 0 &&
    row.bannedAccountCount === 0
  );
}
</script>

<template>
  <PureTableBar title="拉群营销" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Plus)"
        @click="emit('create')"
      >
        新增拉群营销
      </el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table v-loading="loading" :data="rows" row-key="id" border>
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
            </div>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!dynamicColumns[1].hide"
          label="任务状态"
          min-width="190"
        >
          <template #default="{ row }">
            <div class="primary-cell">
              <el-tag
                size="small"
                effect="plain"
                :type="taskStatusTagType(row.status)"
              >
                {{ taskStatusLabel(row.status) }}
              </el-tag>
              <span class="secondary-line">{{ statusDetail(row) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="群组处理进度"
          min-width="190"
        >
          <template #default="{ row }">
            <div v-if="progress(row) != null" class="metric-cell">
              <el-tooltip content="已处理群组数 / 目标群组数" placement="top">
                <strong>
                  {{ displayMetric(row.processedGroupCount) }}/{{
                    displayMetric(row.targetGroupCount)
                  }}
                </strong>
              </el-tooltip>
              <el-progress
                :percentage="progress(row) || 0"
                :show-text="false"
                :stroke-width="8"
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
              <span
                >进行中
                {{ displayMetric(row.marketingRunningGroupCount) }}</span
              >
              <span
                >已完成
                {{ displayMetric(row.marketingCompletedGroupCount) }}</span
              >
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
              <span v-if="row.messageUnknownCount !== 0">
                未知 {{ displayMetric(row.messageUnknownCount) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="异常情况"
          min-width="180"
        >
          <template #default="{ row }">
            <el-tag v-if="hasNoExceptions(row)" size="small" type="success">
              无异常
            </el-tag>
            <div v-else class="metric-cell">
              <span>异常群组 {{ displayMetric(row.abnormalGroupCount) }}</span>
              <span>
                待补位 {{ displayMetric(row.replacementPendingGroupCount) }}
              </span>
              <span>封禁账号 {{ displayMetric(row.bannedAccountCount) }}</span>
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
              <span
                >目标数据 {{ displayMetric(row.remainingTargetCount) }}</span
              >
              <span
                >可用拉手 {{ displayMetric(row.availablePullerCount) }}</span
              >
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
          label="时间/操作"
          fixed="right"
          min-width="250"
        >
          <template #default="{ row }">
            <div class="operation-cell">
              <span>{{ formatEpoch(row.lastExecutedAt) }}</span>
              <div class="action-row">
                <el-button
                  v-for="action in taskActions(row)"
                  :key="action"
                  link
                  :type="actionType(action)"
                  @click="emit('action', action, asTaskRow(row))"
                >
                  {{ actionLabel(action) }}
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无拉群营销任务" />
        </template>
      </el-table>

      <WheelPagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :total="total"
        @change="emit('refresh')"
      />
    </template>
  </PureTableBar>
</template>

<style scoped>
.primary-cell,
.metric-cell,
.operation-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.secondary-line {
  color: var(--el-text-color-secondary);
}

.tag-row,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.action-row :deep(.el-button + .el-button) {
  margin-left: 0;
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

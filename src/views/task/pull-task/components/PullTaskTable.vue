<script setup lang="ts">
import PullTaskTableActions from "./PullTaskTableActions.vue";
import {
  formatEpoch,
  pullTaskStatusLabel,
  pullTaskStatusTagType
} from "../constants";
import {
  displayMetric,
  displayRate,
  groupSourceLabel,
  progressPercentage,
  resourceShortageLabel,
  shouldShowUnknownMessage,
  taskTypeLabel
} from "../task-list-display";
import type { PullTaskListAction, PullTaskRow } from "@/api/pull-task";

defineOptions({
  name: "PullTaskTable"
});

defineProps<{
  columns: TableColumnList;
  loading: boolean;
  rows: PullTaskRow[];
}>();

const emit = defineEmits<{
  (event: "action", row: PullTaskRow, action: PullTaskListAction): void;
  (event: "refresh"): void;
  (event: "selection-change", rows: PullTaskRow[]): void;
}>();

function timestampLabel(value?: number | null): string {
  return value == null ? "--" : formatEpoch(value);
}

function creationModeLabel(row: PullTaskRow): string | null {
  if (row.taskType !== "STANDARD" || row.mode !== "NORMAL_LINK") return null;
  if (row.creationMode === "NEW_GROUP") return "新群模式";
  return row.creationMode === "RESOURCE_POOL" ? "资源池模式" : "群链接模式";
}
</script>

<template>
  <el-table
    v-loading="loading"
    :data="rows"
    row-key="id"
    border
    @selection-change="emit('selection-change', $event)"
  >
    <el-table-column type="selection" width="48" />
    <el-table-column
      v-if="!columns[0]?.hide"
      label="任务信息"
      fixed="left"
      min-width="260"
    >
      <template #default="{ row }">
        <div class="primary-cell">
          <strong>{{ row.taskName || "--" }}</strong>
          <span class="secondary-line">
            #{{ row.id }}｜{{ taskTypeLabel(row.taskType) }}｜{{
              groupSourceLabel(row.groupSource)
            }}
          </span>
          <el-tag
            v-if="creationModeLabel(row)"
            size="small"
            effect="plain"
            :type="row.creationMode === 'NEW_GROUP' ? 'primary' : 'info'"
            data-testid="pull-task-creation-mode"
          >
            {{ creationModeLabel(row) }}
          </el-tag>
          <span class="secondary-line">
            创建人：{{ row.operatorName || "--" }}
          </span>
        </div>
      </template>
    </el-table-column>
    <el-table-column v-if="!columns[1]?.hide" label="任务状态" min-width="180">
      <template #default="{ row }">
        <div class="primary-cell">
          <el-tag
            size="small"
            :type="pullTaskStatusTagType(row.status)"
            effect="plain"
          >
            {{ pullTaskStatusLabel(row.status, row.taskType) }}
          </el-tag>
          <span class="secondary-line">
            {{ row.blockingReason || row.primaryStage || "--" }}
          </span>
        </div>
      </template>
    </el-table-column>
    <el-table-column
      v-if="!columns[2]?.hide"
      label="群组处理进度"
      min-width="190"
    >
      <template #default="{ row }">
        <span v-if="!row.groupProgress">--</span>
        <el-tooltip v-else placement="top" effect="light">
          <template #content>
            <div class="tooltip-grid">
              <span
                >转移成功
                {{
                  displayMetric(row.groupProgress.transferSuccessCount)
                }}</span
              >
              <span
                >待收口
                {{
                  displayMetric(row.groupProgress.transferPendingCloseCount)
                }}</span
              >
              <span
                >部分完成
                {{
                  displayMetric(row.groupProgress.transferPartialCount)
                }}</span
              >
              <span
                >转移失败
                {{ displayMetric(row.groupProgress.transferFailedCount) }}</span
              >
              <span
                >执行中
                {{
                  displayMetric(row.groupProgress.transferRunningCount)
                }}</span
              >
              <span
                >等待执行
                {{
                  displayMetric(row.groupProgress.transferWaitingCount)
                }}</span
              >
            </div>
          </template>
          <div class="metric-cell">
            <strong>
              {{ displayMetric(row.groupProgress.processedGroupCount) }}/{{
                displayMetric(row.groupProgress.targetGroupCount)
              }}
            </strong>
            <el-progress
              :percentage="
                progressPercentage(
                  row.groupProgress.processedGroupCount,
                  row.groupProgress.targetGroupCount
                ) || 0
              "
              :stroke-width="8"
              :show-text="false"
            />
          </div>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column v-if="!columns[3]?.hide" label="拉人结果" min-width="200">
      <template #default="{ row }">
        <span v-if="!row.pullResult">--</span>
        <el-tooltip v-else placement="top" effect="light">
          <template #content>
            <div class="tooltip-grid">
              <span
                >有效目标
                {{ displayMetric(row.pullResult.effectiveTargetCount) }}</span
              >
              <span
                >已在群内
                {{ displayMetric(row.pullResult.alreadyInGroupCount) }}</span
              >
              <span
                >隐私限制
                {{ displayMetric(row.pullResult.privacyRestrictedCount) }}</span
              >
              <span
                >无效号码
                {{ displayMetric(row.pullResult.invalidNumberCount) }}</span
              >
              <span
                >未注册
                {{ displayMetric(row.pullResult.unregisteredCount) }}</span
              >
              <span
                >明确失败 {{ displayMetric(row.pullResult.failedCount) }}</span
              >
              <span
                >结果未知 {{ displayMetric(row.pullResult.unknownCount) }}</span
              >
              <span
                >剩余目标
                {{ displayMetric(row.pullResult.remainingTargetCount) }}</span
              >
            </div>
          </template>
          <div class="metric-cell">
            <strong>
              {{ displayMetric(row.pullResult.joinedSuccessCount) }}/{{
                displayMetric(row.pullResult.plannedTargetCount)
              }}
            </strong>
            <span class="secondary-line">
              有效成功率 {{ displayRate(row.pullResult.effectiveSuccessRate) }}
            </span>
          </div>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column v-if="!columns[4]?.hide" label="营销进度" min-width="170">
      <template #default="{ row }">
        <span v-if="!row.marketingProgress">--</span>
        <el-tooltip v-else placement="top" effect="light">
          <template #content>
            <div class="tooltip-grid">
              <span
                >待开始
                {{ displayMetric(row.marketingProgress.waitingCount) }}</span
              >
              <span
                >进行中
                {{ displayMetric(row.marketingProgress.runningCount) }}</span
              >
              <span
                >已暂停
                {{ displayMetric(row.marketingProgress.pausedCount) }}</span
              >
              <span
                >已完成
                {{ displayMetric(row.marketingProgress.completedCount) }}</span
              >
              <span
                >异常停止
                {{
                  displayMetric(row.marketingProgress.abnormalStoppedCount)
                }}</span
              >
            </div>
          </template>
          <div class="metric-cell">
            <span
              >进行中
              {{ displayMetric(row.marketingProgress.runningCount) }}</span
            >
            <span
              >已完成
              {{ displayMetric(row.marketingProgress.completedCount) }}</span
            >
          </div>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column v-if="!columns[5]?.hide" label="消息发送" min-width="170">
      <template #default="{ row }">
        <span v-if="!row.messageStats">--</span>
        <div v-else class="metric-cell">
          <span class="success-text">
            成功 {{ displayMetric(row.messageStats.successCount) }}
          </span>
          <span class="danger-text">
            失败 {{ displayMetric(row.messageStats.failedCount) }}
          </span>
          <span v-if="shouldShowUnknownMessage(row.messageStats?.unknownCount)">
            未知 {{ displayMetric(row.messageStats.unknownCount) }}
          </span>
        </div>
      </template>
    </el-table-column>
    <el-table-column v-if="!columns[6]?.hide" label="异常情况" min-width="210">
      <template #default="{ row }">
        <span v-if="!row.exceptionStats">--</span>
        <el-tag
          v-else-if="
            row.exceptionStats.abnormalGroupCount === 0 &&
            (row.exceptionStats.bannedAccountCount == null ||
              row.exceptionStats.bannedAccountCount === 0)
          "
          size="small"
          type="success"
        >
          无异常
        </el-tag>
        <div v-else class="metric-cell">
          <span>
            异常群组{{
              displayMetric(row.exceptionStats.abnormalGroupCount)
            }}（缺管理员{{
              displayMetric(row.exceptionStats.managerShortageGroupCount)
            }}
            / 缺拉手{{
              displayMetric(row.exceptionStats.pullerShortageGroupCount)
            }}
            / 缺站台{{
              displayMetric(row.exceptionStats.stationShortageGroupCount)
            }}）
          </span>
          <span
            >封禁账号{{
              displayMetric(row.exceptionStats.bannedAccountCount)
            }}</span
          >
        </div>
      </template>
    </el-table-column>
    <el-table-column v-if="!columns[7]?.hide" label="剩余资源" min-width="220">
      <template #default="{ row }">
        <span v-if="!row.resourceStats">--</span>
        <div v-else class="metric-cell">
          <span
            >目标数据
            {{ displayMetric(row.resourceStats.remainingTargetCount) }}</span
          >
          <span
            >可用拉手
            {{ displayMetric(row.resourceStats.availablePullerCount) }}</span
          >
          <div v-if="row.resourceStats.shortages.length" class="tag-row">
            <el-tag
              v-for="shortage in row.resourceStats.shortages"
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
      v-if="!columns[8]?.hide"
      label="时间/操作"
      fixed="right"
      min-width="250"
    >
      <template #default="{ row }">
        <div class="time-action-cell">
          <span class="secondary-line">
            创建时间 {{ timestampLabel(row.createdAt) }}
          </span>
          <span class="secondary-line">
            最近执行 {{ timestampLabel(row.lastExecutedAt) }}
          </span>
          <PullTaskTableActions
            :row="row"
            @action="emit('action', row, $event)"
          />
        </div>
      </template>
    </el-table-column>
    <template #empty>
      <el-empty description="暂无拉群任务" />
    </template>
  </el-table>
</template>

<style scoped>
.primary-cell,
.metric-cell,
.time-action-cell,
.tooltip-grid {
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

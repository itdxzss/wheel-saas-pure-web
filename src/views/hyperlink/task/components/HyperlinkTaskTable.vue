<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import { formatEpochMillis } from "@/utils/time";
import Plus from "~icons/ep/plus";
import Download from "~icons/ep/download";
import InfoFilled from "~icons/ep/info-filled";
import RefreshRight from "~icons/ep/refresh-right";
import {
  average,
  countryLabel,
  formatCycleInterval,
  formatDuration,
  percentage,
  taskScheduleDisplay,
  taskStatus,
  type HyperlinkTaskRowAction,
  type HyperlinkTaskTableColumn
} from "../domain/list-display";
import HyperlinkTaskAccountFilterCell from "./HyperlinkTaskAccountFilterCell.vue";
import HyperlinkTaskIdentityCell from "./HyperlinkTaskIdentityCell.vue";
import HyperlinkTaskProgressCell from "./HyperlinkTaskProgressCell.vue";
import HyperlinkTaskRowActions from "./HyperlinkTaskRowActions.vue";

defineProps<{
  rows: HyperlinkTaskListItem[];
  columns: HyperlinkTaskTableColumn[];
  columnKey: number;
  countries: Array<{ value: string | number; label: string }>;
  groups: Array<{ value: string | number; label: string }>;
  channels: Array<{ value: string | number; label: string }>;
  protocols: Array<{ value: string | number; label: string }>;
  loading: boolean;
  exporting: boolean;
  errorMessage: string;
  filtersActive: boolean;
  page: number;
  pageSize: number;
  total: number;
  busyActions: Record<number, string | null>;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "export"): void;
  (event: "create"): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
  (event: "page-change"): void;
  (
    event: "row-action",
    action: HyperlinkTaskRowAction,
    row: HyperlinkTaskListItem
  ): void;
  (event: "visit-trend", row: HyperlinkTaskListItem): void;
  (
    event: "columns-change",
    columns: HyperlinkTaskTableColumn[],
    reason: "update" | "reset"
  ): void;
}>();

function visible(columns: HyperlinkTaskTableColumn[], prop: string): boolean {
  return columns.find(column => column.prop === prop)?.hide !== true;
}

function onColumnsChange(
  columns: HyperlinkTaskTableColumn[],
  reason: "update" | "reset"
): void {
  emit("columns-change", columns, reason);
}

function metricRateClass(
  numerator: number,
  denominator: number,
  successThreshold: number,
  warningThreshold: number
): string {
  if (denominator <= 0) return "metric-rate--muted";
  const rate = (numerator / denominator) * 100;
  if (rate >= successThreshold) return "metric-rate--success";
  if (rate >= warningThreshold) return "metric-rate--warning";
  return "metric-rate--danger";
}
</script>

<template>
  <el-alert
    v-if="errorMessage"
    class="table-error"
    type="error"
    show-icon
    :closable="false"
    :title="errorMessage"
  >
    <el-button link type="primary" @click="emit('refresh')">重试</el-button>
  </el-alert>

  <PureTableBar
    :key="columnKey"
    class="hyperlink-table-bar"
    title="超链任务"
    :columns="columns"
    table-key="hyperlink-task-list"
    @refresh="emit('refresh')"
    @columns-change="onColumnsChange"
  >
    <template #title>
      <div class="table-title">
        <strong>超链群发任务</strong>
        <el-tag size="small" type="primary" effect="light" round>
          本页进行中 {{ rows.filter(row => row.runStatus === 1).length }}
        </el-tag>
        <el-tag size="small" type="success" effect="light" round>
          本页已完成 {{ rows.filter(row => row.runStatus === 2).length }}
        </el-tag>
      </div>
    </template>
    <template #buttons>
      <div class="toolbar-buttons">
        <el-button
          v-auth="'tenant:hyperlink_task:create'"
          class="create-button"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="emit('create')"
        >
          新建超链群发任务
        </el-button>
        <el-button
          class="manual-refresh-button"
          :icon="useRenderIcon(RefreshRight)"
          @click="emit('refresh')"
        >
          刷新
        </el-button>
        <el-button
          v-auth="'tenant:hyperlink_task:export'"
          :icon="useRenderIcon(Download)"
          :loading="exporting"
          @click="emit('export')"
        >
          导出 CSV
        </el-button>
      </div>
    </template>

    <template #default="{ size, dynamicColumns }">
      <el-table
        v-loading="loading"
        :data="rows"
        :size="size"
        row-key="id"
        border
        stripe
        table-layout="fixed"
      >
        <el-table-column
          v-if="visible(dynamicColumns, 'id')"
          label="ID"
          prop="id"
          width="80"
          align="center"
        />
        <el-table-column
          v-if="visible(dynamicColumns, 'taskName')"
          label="任务名称"
          min-width="240"
        >
          <template #default="{ row }">
            <HyperlinkTaskIdentityCell :row="row" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'dataPackage')"
          label="数据包"
          min-width="180"
          align="center"
        >
          <template #default="{ row }">
            <template v-if="row.dataPackageId">
              <strong>{{
                row.dataPackageName || `#${row.dataPackageId}`
              }}</strong>
              <el-tag
                class="package-count"
                size="small"
                type="success"
                effect="light"
                round
              >
                {{ row.recipientTotal.toLocaleString() }} 条
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'accountFilter')"
          label="账号范围"
          min-width="230"
        >
          <template #default="{ row }">
            <HyperlinkTaskAccountFilterCell
              :row="row"
              :groups="groups"
              :channels="channels"
              :protocols="protocols"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'countries')"
          label="营销目标国家"
          min-width="140"
          align="center"
        >
          <template #default="{ row }">
            <span v-if="row.targetCountryIso2s.length === 0">-</span>
            <div v-else class="tag-list">
              <el-tag
                v-for="country in row.targetCountryIso2s.slice(0, 2)"
                :key="country ?? 'UNKNOWN'"
                size="small"
              >
                🌐 {{ countryLabel(country, countries) }}
              </el-tag>
              <el-tooltip
                v-if="row.targetCountryIso2s.length > 2"
                :content="
                  row.targetCountryIso2s
                    .map(value => countryLabel(value, countries))
                    .join('、')
                "
              >
                <el-tag size="small" type="info"
                  >+{{ row.targetCountryIso2s.length - 2 }}</el-tag
                >
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'status')"
          label="状态"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="taskStatus(row).type">{{
              taskStatus(row).label
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'accountStats')"
          label="账号统计"
          min-width="150"
          align="center"
        >
          <template #default="{ row }">
            <div class="account-stat-cell">
              <span
                >使用号数 <b>{{ row.usedAccountCount }}</b></span
              >
              <span>
                封号数 <b class="danger-text">{{ row.invalidAccountCount }}</b>
              </span>
              <span>
                号均发量
                <b class="success-text">
                  {{ average(row.successNum, row.usedAccountCount) }}
                </b>
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'progress')"
          label="进度"
          min-width="250"
          align="center"
        >
          <template #default="{ row }">
            <HyperlinkTaskProgressCell :row="row" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'delivery')"
          min-width="150"
          align="center"
        >
          <template #header>
            <el-tooltip
              content="双钩表示消息已送达对方设备，回执可能延迟"
              placement="top"
            >
              <span class="metric-header">
                双钩数 / 双钩率
                <component :is="useRenderIcon(InfoFilled)" />
              </span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <el-tooltip
              content="双钩表示送达设备，可能延迟；预计落地率≈双钩率+20个百分点，仅作参考"
            >
              <div class="metric-stack">
                <strong class="metric-primary">
                  <span class="metric-symbol">✓✓</span>
                  {{ row.deliveredNum.toLocaleString() }}
                </strong>
                <span
                  class="metric-rate"
                  :class="
                    metricRateClass(row.deliveredNum, row.successNum, 60, 30)
                  "
                  >{{ percentage(row.deliveredNum, row.successNum, "-") }}</span
                >
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'click')"
          min-width="150"
          align="center"
        >
          <template #header>
            <el-tooltip
              content="点击率 = 点击 UV ÷ 开启短链的单钩数"
              placement="top"
            >
              <span class="metric-header">
                点击 UV / 点击率
                <component :is="useRenderIcon(InfoFilled)" />
              </span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <el-tooltip
              v-if="!row.shortLinkEnabled"
              content="该任务未启用短链，无法统计点击"
              placement="top"
            >
              <span class="empty-value">-</span>
            </el-tooltip>
            <el-button
              v-else
              class="click-metric-button"
              link
              type="primary"
              @click="emit('visit-trend', row)"
            >
              <strong class="metric-primary">
                <span class="metric-symbol">◎</span>
                {{ row.clickUvNum.toLocaleString() }}
              </strong>
              <span
                class="metric-rate"
                :class="metricRateClass(row.clickUvNum, row.successNum, 5, 1)"
              >
                {{ percentage(row.clickUvNum, row.successNum, "-") }}
              </span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'concurrency')"
          width="130"
          align="center"
        >
          <template #header>
            <el-tooltip
              content="当前运行轮次实际同时执行的账号数"
              placement="top"
            >
              <span class="metric-header">
                最大执行账号数
                <component :is="useRenderIcon(InfoFilled)" />
              </span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <strong class="plain-metric">{{ row.actualConcurrency }}</strong>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'duration')"
          width="110"
          align="center"
        >
          <template #header>
            <el-tooltip
              content="累计实际运行时长，暂停期间不计时"
              placement="top"
            >
              <span class="metric-header">
                已执行时长
                <component :is="useRenderIcon(InfoFilled)" />
              </span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span :class="{ 'empty-value': row.executionDurationSec <= 0 }">
              {{ formatDuration(row.executionDurationSec) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'schedule')"
          min-width="170"
          align="center"
        >
          <template #header>
            <el-tooltip
              content="终态显示实际结束时间；运行中显示计划结束时间或周期间隔"
              placement="top"
            >
              <span class="metric-header">
                结束 / 周期
                <component :is="useRenderIcon(InfoFilled)" />
              </span>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <el-tooltip
              v-if="taskScheduleDisplay(row).kind === 'finished'"
              content="实际结束时间"
              placement="top"
            >
              <span class="schedule-time schedule-time--finished">
                {{ formatEpochMillis(row.finishedAt) }}
              </span>
            </el-tooltip>
            <el-tooltip
              v-else-if="taskScheduleDisplay(row).kind === 'planned'"
              content="计划结束时间"
              placement="top"
            >
              <span class="schedule-time schedule-time--planned">
                {{ formatEpochMillis(row.plannedEndAt) }}
              </span>
            </el-tooltip>
            <el-tag
              v-else-if="taskScheduleDisplay(row).kind === 'cycle'"
              type="warning"
              effect="light"
              round
            >
              {{ formatCycleInterval(row.cycleIntervalMinutes) }}
            </el-tag>
            <span v-else class="empty-value">-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'createdAt')"
          label="创建时间"
          width="160"
          align="center"
        >
          <template #default="{ row }">{{
            formatEpochMillis(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'actions')"
          label="操作"
          width="220"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <HyperlinkTaskRowActions
              :row="row"
              :busy-action="busyActions[row.id]"
              @action="emit('row-action', $event, row)"
            />
          </template>
        </el-table-column>
        <template #empty>
          <el-empty
            :description="filtersActive ? '当前条件没有结果' : '暂无超链任务'"
          />
        </template>
      </el-table>

      <WheelPagination
        class="task-pagination"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100, 200]"
        @update:current-page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
        @change="emit('page-change')"
      />
    </template>
  </PureTableBar>
</template>

<style scoped lang="scss" src="./HyperlinkTaskTable.scss"></style>

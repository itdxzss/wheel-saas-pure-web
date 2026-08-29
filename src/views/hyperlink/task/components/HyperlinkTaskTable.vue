<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import { formatEpochMillis } from "@/utils/time";
import Plus from "~icons/ep/plus";
import Download from "~icons/ep/download";
import {
  average,
  countryLabel,
  formatCycleInterval,
  formatDuration,
  percentage,
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
    title="超链任务"
    :columns="columns"
    table-key="hyperlink-task-list"
    @refresh="emit('refresh')"
    @columns-change="onColumnsChange"
  >
    <template #title>
      <div class="table-title">
        <strong>超链任务</strong>
        <el-tag type="primary" effect="light" round>
          运行中 {{ rows.filter(row => row.runStatus === 1).length }}
        </el-tag>
        <el-tag type="success" effect="light" round>
          已完成 {{ rows.filter(row => row.runStatus === 2).length }}
        </el-tag>
      </div>
    </template>
    <template #buttons>
      <div class="toolbar-buttons">
        <el-button
          v-auth="'tenant:hyperlink_task:create'"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="emit('create')"
        >
          新建
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
          width="82"
          fixed="left"
        />
        <el-table-column
          v-if="visible(dynamicColumns, 'taskName')"
          label="任务名称"
          min-width="300"
        >
          <template #default="{ row }">
            <HyperlinkTaskIdentityCell :row="row" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'dataPackage')"
          label="数据包"
          min-width="180"
        >
          <template #default="{ row }">
            <template v-if="row.dataPackageId">
              <strong>{{
                row.dataPackageName || `#${row.dataPackageId}`
              }}</strong>
              <div class="muted">
                {{ row.recipientTotal.toLocaleString() }} 个号码
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'accountFilter')"
          label="账号范围"
          min-width="250"
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
          min-width="180"
        >
          <template #default="{ row }">
            <span v-if="row.targetCountryIso2s.length === 0">-</span>
            <div v-else class="tag-list">
              <el-tag
                v-for="country in row.targetCountryIso2s.slice(0, 2)"
                :key="country ?? 'UNKNOWN'"
                size="small"
              >
                {{ countryLabel(country, countries) }}
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
          min-width="180"
        >
          <template #default="{ row }">
            <div>使用号数：{{ row.usedAccountCount }}</div>
            <div>封号数：{{ row.invalidAccountCount }}</div>
            <div>
              号均发量：{{ average(row.successNum, row.usedAccountCount) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'progress')"
          label="进度"
          min-width="250"
        >
          <template #default="{ row }">
            <HyperlinkTaskProgressCell :row="row" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'delivery')"
          label="双钩数/双钩率"
          min-width="160"
        >
          <template #default="{ row }">
            <el-tooltip
              content="双钩表示送达设备，可能延迟；预计落地率≈双钩率+20个百分点，仅作参考"
            >
              <div class="delivery-cell">
                <strong>{{ row.deliveredNum.toLocaleString() }}</strong>
                <span>{{
                  percentage(row.deliveredNum, row.successNum, "-")
                }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'click')"
          label="点击 UV/点击率"
          min-width="160"
        >
          <template #default="{ row }">
            <span v-if="!row.shortLinkEnabled">-</span>
            <el-button
              v-else
              link
              type="primary"
              @click="emit('visit-trend', row)"
            >
              {{ row.clickUvNum.toLocaleString() }} /
              {{ percentage(row.clickUvNum, row.successNum, "-") }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'concurrency')"
          label="最大执行账号数"
          width="150"
        >
          <template #default="{ row }">{{
            row.actualConcurrency || "-"
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'duration')"
          label="已执行时长"
          width="130"
        >
          <template #default="{ row }">{{
            formatDuration(row.executionDurationSec)
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'schedule')"
          label="结束/周期"
          min-width="180"
        >
          <template #default="{ row }">
            <span v-if="row.taskMode === 'instant'">-</span>
            <span v-else-if="row.taskMode === 'rolling'">
              {{ formatEpochMillis(row.plannedEndAt) }}
            </span>
            <span v-else>{{
              formatCycleInterval(row.cycleIntervalMinutes)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'createdAt')"
          label="创建时间"
          width="180"
        >
          <template #default="{ row }">{{
            formatEpochMillis(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column
          v-if="visible(dynamicColumns, 'actions')"
          label="操作"
          width="238"
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

<style scoped lang="scss">
.table-error {
  margin-bottom: 10px;
}

.table-title,
.toolbar-buttons,
.tag-list {
  display: flex;
  gap: 7px;
  align-items: center;
}

.tag-list {
  flex-wrap: wrap;
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.delivery-cell {
  display: flex;
  flex-direction: column;
  color: var(--el-color-primary);
}
</style>

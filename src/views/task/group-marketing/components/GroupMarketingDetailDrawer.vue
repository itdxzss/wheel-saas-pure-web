<script setup lang="ts">
import { computed } from "vue";
import type {
  MarketingTaskAccountTargetRow,
  MarketingTaskDetail,
  MarketingTaskGroupStatRow
} from "@/api/marketing-task";
import {
  formatEpoch,
  targetStatusLabel,
  targetStatusTagType
} from "../constants";
import {
  firstGroup,
  firstGroupDisplayName,
  firstGroupSummary,
  groupCountLabel,
  hasGroupRows
} from "./detail-rollup";

defineOptions({
  name: "GroupMarketingDetailDrawer"
});

const props = defineProps<{
  detail: MarketingTaskDetail | null;
  loading: boolean;
}>();

const visible = defineModel<boolean>({ required: true });

const accountRows = computed<MarketingTaskAccountTargetRow[]>(
  () => props.detail?.accountTargets ?? []
);

function asAccountRow(row: unknown): MarketingTaskAccountTargetRow {
  return row as MarketingTaskAccountTargetRow;
}

function groupRowKey(group: MarketingTaskGroupStatRow): string {
  return [
    group.groupLinkId ?? "no-link-id",
    group.groupJid ?? group.groupLinkUrl ?? group.groupName ?? "unknown",
    group.lastAttemptAt ?? group.lastSentAt ?? "no-time"
  ].join(":");
}
</script>

<template>
  <el-drawer v-model="visible" size="72%" destroy-on-close title="营销任务明细">
    <div v-loading="loading" class="detail-drawer">
      <el-descriptions v-if="detail" :column="3" border>
        <el-descriptions-item label="任务名称">
          {{ detail.taskName }}
        </el-descriptions-item>
        <el-descriptions-item label="营销账号">
          {{ detail.selectedAccountCount }} 个
        </el-descriptions-item>
        <el-descriptions-item label="营销群组">
          {{ detail.targetGroupCount }} 个
        </el-descriptions-item>
        <el-descriptions-item label="总发送条数">
          {{ detail.sentMessageCount }}
        </el-descriptions-item>
        <el-descriptions-item label="失败条数">
          {{ detail.failedMessageCount }}
        </el-descriptions-item>
        <el-descriptions-item label="账号群组发送时间">
          {{ formatEpoch(detail.accountGroupSendAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="任务开始时间">
          {{ formatEpoch(detail.taskStartAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="任务结束时间">
          {{ formatEpoch(detail.taskEndAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        class="detail-table"
        :data="accountRows"
        row-key="accountId"
        border
      >
        <el-table-column label="当前状态" width="110">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="targetStatusTagType(row.status)"
              effect="plain"
            >
              {{ targetStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="accountPhone"
          label="发言号码"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="sentMessageCount"
          label="号发送总条数"
          width="130"
        />
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="group-rollup-expand">
              <div
                v-if="hasGroupRows(asAccountRow(row))"
                class="group-rollup-detail-list"
              >
                <div
                  v-for="group in asAccountRow(row).groups"
                  :key="groupRowKey(group)"
                  class="group-rollup-detail-row"
                >
                  <span>{{ group.sentMessageCount }}</span>
                  <span
                    class="group-rollup-text"
                    :title="group.groupLinkUrl || '-'"
                  >
                    {{ group.groupLinkUrl || "-" }}
                  </span>
                  <span
                    class="group-rollup-text"
                    :title="group.groupName || group.groupJid || '未命名群组'"
                  >
                    {{ group.groupName || group.groupJid || "未命名群组" }}
                  </span>
                  <span
                    class="group-rollup-text"
                    :title="group.lastReason || '-'"
                  >
                    {{ group.lastReason || "-" }}
                  </span>
                  <span>{{ formatEpoch(group.lastSentAt) }}</span>
                </div>
              </div>
              <div v-else class="group-rollup-empty group-rollup-expand-empty">
                暂无发送记录
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column min-width="760">
          <template #header>
            <div class="group-rollup-header">
              <span>单群发送条数</span>
              <span>群组链接</span>
              <span>群组名称</span>
              <span>最近原因</span>
              <span>最后发送时间</span>
            </div>
          </template>
          <template #default="{ row }">
            <div class="group-rollup-summary">
              <template v-if="firstGroup(asAccountRow(row))">
                <div
                  class="group-rollup-first-row"
                  :title="firstGroupSummary(asAccountRow(row))"
                >
                  <span class="group-rollup-number">
                    {{ firstGroup(asAccountRow(row))?.sentMessageCount ?? 0 }}
                  </span>
                  <span
                    class="group-rollup-text"
                    :title="firstGroup(asAccountRow(row))?.groupLinkUrl || '-'"
                  >
                    {{ firstGroup(asAccountRow(row))?.groupLinkUrl || "-" }}
                  </span>
                  <span
                    class="group-rollup-name"
                    :title="firstGroupDisplayName(asAccountRow(row))"
                  >
                    <span>{{ firstGroupDisplayName(asAccountRow(row)) }}</span>
                    <el-tag
                      v-if="groupCountLabel(asAccountRow(row))"
                      size="small"
                      effect="plain"
                    >
                      {{ groupCountLabel(asAccountRow(row)) }}
                    </el-tag>
                  </span>
                  <span
                    class="group-rollup-text"
                    :title="firstGroup(asAccountRow(row))?.lastReason || '-'"
                  >
                    {{ firstGroup(asAccountRow(row))?.lastReason || "-" }}
                  </span>
                  <span class="group-rollup-time">
                    {{ formatEpoch(firstGroup(asAccountRow(row))?.lastSentAt) }}
                  </span>
                </div>
              </template>
              <span v-else class="group-rollup-empty"> 暂无发送记录 </span>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无账号明细" />
        </template>
      </el-table>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-drawer {
  min-height: 320px;
}

.detail-table {
  margin-top: 16px;
}

.group-rollup-expand {
  padding: 10px 24px 10px 72px;
  background: var(--el-fill-color-lighter);
}

.group-rollup-summary {
  min-width: 0;
}

.group-rollup-header,
.group-rollup-first-row,
.group-rollup-detail-row {
  display: grid;
  grid-template-columns:
    112px minmax(190px, 1.35fr) minmax(150px, 1fr)
    minmax(130px, 0.9fr) 170px;
  gap: 16px;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.group-rollup-header {
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.group-rollup-first-row {
  color: var(--el-text-color-regular);
}

.group-rollup-detail-list {
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.group-rollup-detail-row {
  min-height: 38px;
  padding: 0 16px;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.group-rollup-detail-row:last-child {
  border-bottom: 0;
}

.group-rollup-text,
.group-rollup-name span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-rollup-name {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.group-rollup-number {
  font-variant-numeric: tabular-nums;
}

.group-rollup-time {
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.group-rollup-empty {
  color: var(--el-text-color-secondary);
}

.group-rollup-expand-empty {
  padding: 16px;
  text-align: center;
  background: var(--el-bg-color);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 6px;
}

@media (width <= 960px) {
  .group-rollup-header,
  .group-rollup-first-row,
  .group-rollup-detail-row {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>

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
  groupDisplayName,
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

function asGroupRow(row: unknown): MarketingTaskGroupStatRow {
  return row as MarketingTaskGroupStatRow;
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="72%"
    destroy-on-close
    title="营销任务明细"
  >
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
              <el-table
                v-if="hasGroupRows(asAccountRow(row))"
                :data="asAccountRow(row).groups"
                size="small"
                border
              >
                <el-table-column
                  prop="sentMessageCount"
                  label="单群发送条数"
                  width="120"
                />
                <el-table-column
                  prop="groupLinkUrl"
                  label="群组链接"
                  min-width="240"
                  show-overflow-tooltip
                >
                  <template #default="{ row: group }">
                    {{ group.groupLinkUrl || "-" }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="groupName"
                  label="群组名称"
                  min-width="160"
                  show-overflow-tooltip
                >
                  <template #default="{ row: group }">
                    {{ groupDisplayName(asGroupRow(group)) }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="lastReason"
                  label="最近原因"
                  min-width="180"
                  show-overflow-tooltip
                >
                  <template #default="{ row: group }">
                    {{ group.lastReason || "-" }}
                  </template>
                </el-table-column>
                <el-table-column label="最后发送时间" width="170">
                  <template #default="{ row: group }">
                    {{ formatEpoch(asGroupRow(group).lastSentAt) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty
                v-else
                description="暂无发送记录"
                :image-size="64"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="群组情况" min-width="520">
          <template #default="{ row }">
            <div class="group-rollup-summary">
              <template v-if="firstGroup(asAccountRow(row))">
                <div class="group-rollup-title">
                  <span>{{ firstGroupSummary(asAccountRow(row)) }}</span>
                  <el-tag
                    v-if="groupCountLabel(asAccountRow(row))"
                    size="small"
                    effect="plain"
                  >
                    {{ groupCountLabel(asAccountRow(row)) }}
                  </el-tag>
                </div>
                <div class="group-rollup-fields">
                  <span>
                    <small>单群发送条数</small>
                    {{ firstGroup(asAccountRow(row))?.sentMessageCount ?? 0 }}
                  </span>
                  <span>
                    <small>群组链接</small>
                    {{ firstGroup(asAccountRow(row))?.groupLinkUrl || "-" }}
                  </span>
                  <span>
                    <small>群组名称</small>
                    {{ firstGroupDisplayName(asAccountRow(row)) }}
                  </span>
                  <span>
                    <small>最近原因</small>
                    {{ firstGroup(asAccountRow(row))?.lastReason || "-" }}
                  </span>
                  <span>
                    <small>最后发送时间</small>
                    {{ formatEpoch(firstGroup(asAccountRow(row))?.lastSentAt) }}
                  </span>
                </div>
              </template>
              <span v-else class="group-rollup-empty">
                暂无发送记录
              </span>
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
  padding: 8px 48px;
  background: var(--el-fill-color-lighter);
}

.group-rollup-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.group-rollup-title {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  font-weight: 600;
}

.group-rollup-title span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-rollup-fields {
  display: grid;
  grid-template-columns: repeat(5, minmax(96px, 1fr));
  gap: 6px 12px;
  min-width: 0;
  color: var(--el-text-color-regular);
}

.group-rollup-fields span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-rollup-fields small {
  display: block;
  margin-bottom: 2px;
  color: var(--el-text-color-secondary);
}

.group-rollup-empty {
  color: var(--el-text-color-secondary);
}

@media (max-width: 960px) {
  .group-rollup-fields {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import type {
  MarketingTaskAccountTargetRow,
  MarketingTaskDetail,
  MarketingTaskGroupStatRow
} from "@/api/marketing-task";
import {
  loginStateLabel,
  loginStateTagType
} from "@/views/account/index/account-display";
import { formatEpoch } from "../constants";
import { groupExecutionResultMeta } from "./group-execution-result";
import { groupMembershipStatusMeta } from "./group-membership-status";
import { groupSendStatusMeta } from "./group-send-status";

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
        <el-descriptions-item label="跳过条数">
          {{ detail.skippedMessageCount ?? 0 }}
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
        <el-table-column label="在线状态" width="110">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="plain"
              :type="loginStateTagType(row.loginState)"
            >
              {{ loginStateLabel(row.loginState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="accountPhone"
          label="发送账号"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="sentMessageCount"
          label="账号发送总条数"
          width="150"
        />
        <el-table-column
          prop="failedMessageCount"
          label="账号失败条数"
          width="130"
        />
        <el-table-column label="账号跳过条数" width="130">
          <template #default="{ row }">
            {{ row.skippedMessageCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column type="expand" label="明细" width="80">
          <template #default="{ row }">
            <div class="group-rollup-expand">
              <template v-if="asAccountRow(row).groups.length > 0">
                <div class="group-rollup-header">
                  <span>当前关系</span>
                  <span>最后协议状态</span>
                  <span>群名称</span>
                  <span>群 GID</span>
                  <span>成功</span>
                  <span>失败</span>
                  <span>跳过</span>
                  <span>最后发送时间</span>
                  <span>最后执行</span>
                </div>
                <div class="group-rollup-detail-list">
                  <div
                    v-for="group in asAccountRow(row).groups"
                    :key="groupRowKey(group)"
                    class="group-rollup-detail-row"
                  >
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="
                        groupMembershipStatusMeta(group.membershipStatus)
                          .tagType
                      "
                    >
                      {{
                        groupMembershipStatusMeta(group.membershipStatus).label
                      }}
                    </el-tag>
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="groupSendStatusMeta(group.groupStatus).tagType"
                      :class="groupSendStatusMeta(group.groupStatus).className"
                    >
                      {{ groupSendStatusMeta(group.groupStatus).label }}
                    </el-tag>
                    <span
                      class="group-rollup-text"
                      :title="group.groupName || group.groupJid || '未命名群组'"
                    >
                      {{ group.groupName || group.groupJid || "未命名群组" }}
                    </span>
                    <span
                      class="group-rollup-text"
                      :title="group.groupJid || '-'"
                    >
                      {{ group.groupJid || "-" }}
                    </span>
                    <span class="group-rollup-number">
                      {{ group.sentMessageCount }}
                    </span>
                    <span class="group-rollup-number">
                      {{ group.failedMessageCount }}
                    </span>
                    <span class="group-rollup-number">
                      {{ group.skippedMessageCount ?? 0 }}
                    </span>
                    <span class="group-rollup-time">
                      {{ formatEpoch(group.lastSentAt) }}
                    </span>
                    <div class="group-execution">
                      <el-tag
                        v-if="
                          groupExecutionResultMeta(group.executionResult).tagged
                        "
                        size="small"
                        effect="plain"
                        :type="
                          groupExecutionResultMeta(group.executionResult)
                            .tagType
                        "
                      >
                        {{
                          groupExecutionResultMeta(group.executionResult).label
                        }}
                      </el-tag>
                      <span v-else class="group-rollup-empty">-</span>
                      <span
                        v-if="
                          ['FAILED', 'SKIPPED'].includes(
                            group.executionResult ?? ''
                          )
                        "
                        class="group-execution-reason"
                        :title="group.executionReason || '未知原因'"
                      >
                        {{ group.executionReason || "未知原因" }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="group-rollup-empty group-rollup-expand-empty">
                暂无发送记录
              </div>
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
  overflow-x: auto;
  background: var(--el-fill-color-lighter);
}

.group-rollup-header,
.group-rollup-detail-row {
  display: grid;
  grid-template-columns:
    112px 112px minmax(160px, 1.2fr) minmax(210px, 1.3fr) 64px 64px 64px
    160px minmax(190px, 1fr);
  gap: 16px;
  align-items: center;
  width: 100%;
  min-width: 1280px;
}

.group-rollup-header {
  padding: 0 16px 8px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.group-status--no-permission {
  --el-tag-bg-color: rgb(147 51 234 / 10%);
  --el-tag-border-color: rgb(147 51 234 / 45%);
  --el-tag-text-color: #9333ea;
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

.group-rollup-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-execution {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.group-execution-reason {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
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
  .group-rollup-detail-row {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    min-width: 0;
  }
}
</style>

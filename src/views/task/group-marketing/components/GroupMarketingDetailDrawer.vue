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
              <el-table
                class="group-rollup-table"
                :data="asAccountRow(row).groups"
                :row-key="groupRowKey"
                border
              >
                <el-table-column label="当前关系" width="120" resizable>
                  <template #default="{ row: group }">
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
                  </template>
                </el-table-column>
                <el-table-column label="最后协议状态" width="130" resizable>
                  <template #default="{ row: group }">
                    <el-tag
                      size="small"
                      effect="plain"
                      :type="groupSendStatusMeta(group.groupStatus).tagType"
                      :class="groupSendStatusMeta(group.groupStatus).className"
                    >
                      {{ groupSendStatusMeta(group.groupStatus).label }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  label="群名称"
                  min-width="180"
                  show-overflow-tooltip
                  resizable
                >
                  <template #default="{ row: group }">
                    <span>
                      {{ group.groupName || group.groupJid || "未命名群组" }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="群 GID"
                  width="230"
                  show-overflow-tooltip
                  resizable
                >
                  <template #default="{ row: group }">
                    {{ group.groupJid || "-" }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="sentMessageCount"
                  label="成功"
                  width="80"
                  resizable
                />
                <el-table-column
                  prop="failedMessageCount"
                  label="失败"
                  width="80"
                  resizable
                />
                <el-table-column label="跳过" width="80" resizable>
                  <template #default="{ row: group }">
                    <span>
                      {{ group.skippedMessageCount ?? 0 }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="最后发送时间" width="180" resizable>
                  <template #default="{ row: group }">
                    <span>
                      {{ formatEpoch(group.lastSentAt) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="最后执行" min-width="240" resizable>
                  <template #default="{ row: group }">
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
                  </template>
                </el-table-column>
                <template #empty>
                  <div class="group-rollup-empty group-rollup-expand-empty">
                    暂无发送记录
                  </div>
                </template>
              </el-table>
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

.group-rollup-table {
  width: 100%;
}

.group-status--no-permission {
  --el-tag-bg-color: rgb(147 51 234 / 10%);
  --el-tag-border-color: rgb(147 51 234 / 45%);
  --el-tag-text-color: #9333ea;
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

.group-rollup-empty {
  color: var(--el-text-color-secondary);
}

.group-rollup-expand-empty {
  padding: 16px;
  text-align: center;
}
</style>

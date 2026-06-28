<script setup lang="ts">
import type { MarketingTaskDetail } from "@/api/marketing-task";
import {
  formatEpoch,
  targetStatusLabel,
  targetStatusTagType
} from "../constants";

defineOptions({
  name: "GroupMarketingDetailDrawer"
});

defineProps<{
  detail: MarketingTaskDetail | null;
  loading: boolean;
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <el-drawer
    v-model="visible"
    size="72%"
    destroy-on-close
    title="群组营销任务明细"
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
        <el-descriptions-item label="发送条数">
          {{ detail.sentMessageCount }}
        </el-descriptions-item>
        <el-descriptions-item label="失败条数">
          {{ detail.failedMessageCount }}
        </el-descriptions-item>
        <el-descriptions-item label="最后发送时间">
          {{ formatEpoch(detail.lastSentAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        class="detail-table"
        :data="detail?.targets ?? []"
        row-key="id"
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
        <el-table-column prop="sentMessageCount" label="发送条数" width="100" />
        <el-table-column
          prop="groupLinkUrl"
          label="群组链接"
          min-width="240"
          show-overflow-tooltip
        />
        <el-table-column
          prop="groupName"
          label="群组名称"
          min-width="170"
          show-overflow-tooltip
        />
        <el-table-column
          prop="lastReason"
          label="最近原因"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.lastReason || "-" }}
          </template>
        </el-table-column>
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
</style>

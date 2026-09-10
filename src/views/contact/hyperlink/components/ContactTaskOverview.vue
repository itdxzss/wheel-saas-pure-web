<script setup lang="ts">
import type { ContactTaskStats } from "@/api/contact-task";
import {
  metricRate,
  sendStatusLabels,
  type ReceiptFilter
} from "../domain/receipt-metrics";
import ContactTaskProgress from "./ContactTaskProgress.vue";
defineProps<{ stats: ContactTaskStats }>();
const emit = defineEmits<{
  (event: "filter", filter: ReceiptFilter, errorCode?: string): void;
}>();
</script>

<template>
  <el-alert
    v-if="stats.metrics.inconsistentNum"
    type="error"
    :closable="false"
    title="检测到状态与回执不一致，统计数据待核对。"
  />
  <ContactTaskProgress :metrics="stats.metrics" :accounts="stats.accounts" />
  <div class="receipt-cards">
    <el-card shadow="never"
      ><el-button link @click="emit('filter', 'CONFIRMED')"
        >✓ 已发送 <strong>{{ stats.metrics.confirmedNum }}</strong></el-button
      >
      <div class="metric-note">累计发送确认 · 含已送达和已读</div></el-card
    >
    <el-card shadow="never"
      ><el-button link @click="emit('filter', 'DELIVERED')"
        >✓✓ 已送达 <strong>{{ stats.metrics.deliveredNum }}</strong></el-button
      >
      <div class="metric-note">
        送达率
        {{
          stats.metrics.inconsistentNum
            ? "待核对"
            : metricRate(stats.metrics.deliveredNum, stats.metrics.confirmedNum)
        }}
      </div></el-card
    >
    <el-card shadow="never"
      ><el-button link type="primary" @click="emit('filter', 'READ')"
        >✓✓ 已读 <strong>{{ stats.metrics.readNum }}</strong></el-button
      >
      <div class="metric-note">
        送达后已读率
        {{
          stats.metrics.inconsistentNum
            ? "待核对"
            : metricRate(stats.metrics.readNum, stats.metrics.deliveredNum)
        }}
      </div></el-card
    >
  </div>
  <div class="receipt-links">
    <el-button link type="danger" @click="emit('filter', 'FAILED')"
      >明确失败 {{ stats.metrics.failedNum }}</el-button
    >
    <el-button link type="warning" @click="emit('filter', 'UNKNOWN')"
      >结果未知 {{ stats.metrics.unknownNum }}</el-button
    >
    <el-button link @click="emit('filter', 'SKIPPED')"
      >已跳过 {{ stats.metrics.skippedNum }}</el-button
    >
  </div>
  <el-divider content-position="left">当前回执分布（互斥）</el-divider>
  <div v-if="!stats.metrics.inconsistentNum" class="receipt-links">
    <el-button @click="emit('filter', 'SINGLE_ONLY')"
      >仅单勾
      {{ stats.metrics.confirmedNum - stats.metrics.deliveredNum }}</el-button
    >
    <el-button @click="emit('filter', 'DELIVERED_UNREAD')"
      >已送达未读
      {{ stats.metrics.deliveredNum - stats.metrics.readNum }}</el-button
    >
    <el-button @click="emit('filter', 'READ')"
      >已读 {{ stats.metrics.readNum }}</el-button
    >
  </div>
  <div class="metric-note account-summary">
    参与名单准备 {{ stats.accounts.selectedAccountNum }} 个账号 · 有收件人
    {{ stats.accounts.readyAccountNum }} 个 · 执行异常
    {{ stats.accounts.failedAccountNum }} 个
  </div>
  <el-divider content-position="left">异常原因</el-divider>
  <el-table :data="stats.reasons" empty-text="暂无失败、未知或跳过记录">
    <el-table-column label="处理结果" width="160"
      ><template #default="{ row }">{{
        sendStatusLabels[row.sendStatus] ?? row.sendStatus
      }}</template></el-table-column
    >
    <el-table-column prop="errorCode" label="原因码" min-width="180" />
    <el-table-column label="条数" width="100"
      ><template #default="{ row }"
        ><el-button
          link
          type="primary"
          @click="emit('filter', row.sendStatus, row.errorCode)"
          >{{ row.count }}</el-button
        ></template
      ></el-table-column
    >
  </el-table>
</template>

<style scoped>
.receipt-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.receipt-cards strong {
  margin-left: 10px;
  font-size: 22px;
}

.metric-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.receipt-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.receipt-links .el-button + .el-button {
  margin-left: 0;
}

.account-summary {
  margin-top: 20px;
}

@media (width <= 650px) {
  .receipt-cards {
    grid-template-columns: 1fr;
  }
}
</style>

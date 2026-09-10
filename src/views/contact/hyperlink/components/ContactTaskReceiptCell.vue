<script setup lang="ts">
import type { ContactTaskStats } from "@/api/contact-task";
import { metricRate, type ReceiptFilter } from "../domain/receipt-metrics";
defineProps<{ stats?: ContactTaskStats }>();
defineEmits<{ (event: "filter", filter: ReceiptFilter): void }>();
</script>

<template>
  <span v-if="!stats">统计暂不可用</span>
  <div v-else class="receipt-cell">
    <div>
      <el-button
        link
        type="primary"
        title="累计发送确认，包含送达与已读"
        @click="$emit('filter', 'CONFIRMED')"
        >✓ {{ stats.metrics.confirmedNum }}</el-button
      >
      <el-button
        link
        type="primary"
        title="累计送达，包含已读"
        @click="$emit('filter', 'DELIVERED')"
        >✓✓ {{ stats.metrics.deliveredNum }}</el-button
      >
      <el-button link type="primary" @click="$emit('filter', 'READ')"
        >已读 {{ stats.metrics.readNum }}</el-button
      >
    </div>
    <div>
      送达率：{{
        stats.metrics.inconsistentNum
          ? "数据待核对"
          : metricRate(stats.metrics.deliveredNum, stats.metrics.confirmedNum)
      }}
    </div>
    <div>
      <el-button link type="danger" @click="$emit('filter', 'FAILED')"
        >失败 {{ stats.metrics.failedNum }}</el-button
      >
      <el-button link type="warning" @click="$emit('filter', 'UNKNOWN')"
        >未知 {{ stats.metrics.unknownNum }}</el-button
      >
      <el-button link @click="$emit('filter', 'SKIPPED')"
        >跳过 {{ stats.metrics.skippedNum }}</el-button
      >
    </div>
  </div>
</template>

<style scoped>
.receipt-cell {
  font-size: 12px;
}
</style>

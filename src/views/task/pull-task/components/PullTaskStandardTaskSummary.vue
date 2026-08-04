<script setup lang="ts">
import type { PullTaskStandardTaskSummary } from "@/api/pull-task";

defineOptions({ name: "PullTaskStandardTaskSummary" });
defineProps<{ summary: PullTaskStandardTaskSummary }>();
</script>

<template>
  <div class="summary-grid">
    <el-statistic title="群组总数" :value="summary.totalGroupCount" />
    <el-statistic title="执行中" :value="summary.executingGroupCount" />
    <el-statistic title="等待资源" :value="summary.waitingResourceGroupCount" />
    <el-statistic title="已完成" :value="summary.completedGroupCount" />
    <el-statistic title="执行失败" :value="summary.failedGroupCount" />
    <el-statistic title="已取消" :value="summary.abandonedGroupCount" />
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-grid :deep(.el-statistic) {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

@media (width <= 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

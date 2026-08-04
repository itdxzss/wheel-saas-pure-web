<script setup lang="ts">
import type { PullTaskSummary } from "@/api/pull-task";
import { pullTaskModeLabel, pullTaskStatusLabel } from "../constants";

defineOptions({
  name: "PullTaskDetailSummary"
});

defineProps<{
  summary: PullTaskSummary;
}>();
</script>

<template>
  <div class="summary-grid">
    <div class="summary-card">
      <span>任务状态</span>
      <strong>{{ pullTaskStatusLabel(summary.status) }}</strong>
    </div>
    <div class="summary-card">
      <span>拉群模式</span>
      <strong>{{ pullTaskModeLabel(summary.mode) }}</strong>
    </div>
    <el-statistic title="群组数量" :value="summary.groupCount" />
    <el-statistic title="总群人数" :value="summary.totalMembers" />
    <el-statistic title="异常数" :value="summary.abnormalCount" />
    <el-statistic title="总进入人数" :value="summary.joinedCount" />
    <el-statistic title="未使用数据" :value="summary.unusedCount" />
    <el-statistic title="预计拉人数量" :value="summary.expectedPullCount" />
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card,
.summary-grid :deep(.el-statistic) {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: var(--el-text-color-secondary);
}

.summary-card strong {
  margin-top: 8px;
}

@media (width <= 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>

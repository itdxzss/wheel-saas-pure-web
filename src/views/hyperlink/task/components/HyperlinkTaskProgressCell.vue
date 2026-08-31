<script setup lang="ts">
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import { percentage } from "../domain/list-display";

const props = defineProps<{ row: HyperlinkTaskListItem }>();

function progress(value: number): number {
  return props.row.recipientTotal <= 0
    ? 0
    : Math.min(100, (Math.max(0, value) * 100) / props.row.recipientTotal);
}
</script>

<template>
  <div class="progress-caption">
    <span class="single-hook"
      >✓ 单钩 {{ row.successNum.toLocaleString() }}</span
    >
    <span class="double-hook"
      >✓✓ 双钩 {{ row.deliveredNum.toLocaleString() }}</span
    >
    <span class="danger-text">失败 {{ row.failedNum.toLocaleString() }}</span>
    <span class="muted">共 {{ row.recipientTotal.toLocaleString() }}</span>
  </div>
  <div class="task-progress-bar">
    <span
      class="task-progress-segment task-progress-segment--success"
      :style="{ flexBasis: `${progress(row.successNum)}%` }"
    />
    <span
      class="task-progress-segment task-progress-segment--failed"
      :style="{ flexBasis: `${progress(row.failedNum)}%` }"
    />
  </div>
  <div class="unregistered-line">
    未开通 WS {{ row.unregisteredNum.toLocaleString() }} ·
    {{ percentage(row.unregisteredNum, row.recipientTotal) }}
  </div>
</template>

<style scoped>
.progress-caption {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.single-hook {
  color: var(--el-color-success);
}

.double-hook {
  color: var(--el-color-primary);
}

.danger-text {
  color: var(--el-color-danger);
}

.task-progress-bar {
  display: flex;
  width: 100%;
  height: 8px;
  overflow: hidden;
  background-color: var(--el-fill-color);
  border-radius: 5px;
}

.task-progress-segment {
  display: block;
  flex: 0 0 auto;
  height: 100%;
}

.task-progress-segment--success {
  background-color: var(--el-color-success);
}

.task-progress-segment--failed {
  background-color: var(--el-color-danger, #f56c6c);
}

.muted,
.unregistered-line {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.unregistered-line {
  margin-top: 4px;
  color: var(--el-color-danger);
  text-align: right;
}
</style>

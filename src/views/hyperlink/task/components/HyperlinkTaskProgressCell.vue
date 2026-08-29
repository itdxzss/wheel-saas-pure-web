<script setup lang="ts">
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import { percentage } from "../domain/list-display";

const props = defineProps<{ row: HyperlinkTaskListItem }>();

function progress(value: number): number {
  return props.row.recipientTotal <= 0
    ? 0
    : Math.min(100, (value * 100) / props.row.recipientTotal);
}
</script>

<template>
  <div class="progress-caption">
    <span class="success-text"
      >✓ 单钩 {{ row.successNum.toLocaleString() }}</span
    >
    <span class="danger-text">失败 {{ row.failedNum.toLocaleString() }}</span>
    <span class="muted">共 {{ row.recipientTotal.toLocaleString() }}</span>
  </div>
  <el-progress
    :percentage="progress(row.successNum)"
    :stroke-width="8"
    :show-text="false"
    status="success"
  />
  <div class="unregistered-line">
    未开通 WS {{ row.unregisteredNum.toLocaleString() }} ·
    {{ percentage(row.unregisteredNum, row.recipientTotal) }}
  </div>
</template>

<style scoped>
.progress-caption {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.success-text {
  color: var(--el-color-success);
}

.danger-text {
  color: var(--el-color-danger);
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

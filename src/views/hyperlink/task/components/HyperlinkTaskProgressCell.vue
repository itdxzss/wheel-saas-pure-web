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
    <span>单钩 {{ row.successNum }}/{{ row.recipientTotal }}</span>
    <span>失败 {{ row.failedNum }}</span>
  </div>
  <el-progress
    :percentage="progress(row.successNum)"
    :stroke-width="8"
    :show-text="false"
    status="success"
  />
  <el-progress
    class="failed-progress"
    :percentage="progress(row.failedNum)"
    :stroke-width="6"
    :show-text="false"
    status="exception"
  />
  <div class="muted">
    未开通 WS {{ row.unregisteredNum }}（{{
      percentage(row.unregisteredNum, row.recipientTotal)
    }}）
  </div>
</template>

<style scoped>
.progress-caption {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.failed-progress {
  margin-top: 4px;
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

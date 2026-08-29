<script setup lang="ts">
import { computed } from "vue";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import {
  rowActions,
  type HyperlinkTaskRowAction
} from "../domain/list-display";

const props = defineProps<{
  row: HyperlinkTaskListItem;
  busyAction?: string | null;
}>();

const emit = defineEmits<{
  (
    event: "action",
    action: HyperlinkTaskRowAction,
    row: HyperlinkTaskListItem
  ): void;
}>();

const actions = computed(() => rowActions(props.row));

const labels: Record<HyperlinkTaskRowAction, string> = {
  START: "启动",
  PAUSE: "暂停",
  RESUME: "恢复",
  STOP: "停止",
  EDIT: "编辑",
  VIEW: "查看",
  DETAIL: "详情",
  COPY: "复制"
};

function buttonType(action: HyperlinkTaskRowAction) {
  if (action === "START" || action === "RESUME") return "success";
  if (action === "STOP") return "danger";
  if (action === "PAUSE") return "warning";
  return "primary";
}

function permission(action: HyperlinkTaskRowAction): string {
  if (action === "EDIT") return "tenant:hyperlink_task:edit";
  if (action === "COPY") return "tenant:hyperlink_task:create";
  if (["START", "PAUSE", "RESUME", "STOP"].includes(action)) {
    return "tenant:hyperlink_task:action";
  }
  return "tenant:hyperlink_task:view";
}
</script>

<template>
  <div class="row-actions">
    <el-button
      v-for="action in actions"
      :key="action"
      v-auth="permission(action)"
      link
      :type="buttonType(action)"
      :loading="busyAction === action"
      :disabled="Boolean(busyAction) && busyAction !== action"
      @click="emit('action', action, row)"
    >
      {{ labels[action] }}
    </el-button>
  </div>
</template>

<style scoped>
.row-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px 8px;
}

.row-actions :deep(.el-button) {
  justify-content: flex-start;
  margin-left: 0;
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import {
  rowActions,
  type HyperlinkTaskRowAction
} from "../domain/list-display";
import CopyDocument from "~icons/ep/copy-document";
import DataAnalysis from "~icons/ep/data-analysis";
import EditPen from "~icons/ep/edit-pen";
import VideoPause from "~icons/ep/video-pause";
import VideoPlay from "~icons/ep/video-play";
import View from "~icons/ep/view";

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

function buttonIcon(action: HyperlinkTaskRowAction) {
  if (action === "START" || action === "RESUME") {
    return useRenderIcon(VideoPlay);
  }
  if (action === "PAUSE" || action === "STOP") {
    return useRenderIcon(VideoPause);
  }
  if (action === "EDIT") return useRenderIcon(EditPen);
  if (action === "COPY") return useRenderIcon(CopyDocument);
  if (action === "DETAIL") return useRenderIcon(DataAnalysis);
  return useRenderIcon(View);
}
</script>

<template>
  <div class="row-actions">
    <el-button
      v-for="action in actions"
      :key="action"
      v-auth="permission(action)"
      :plain="['START', 'PAUSE', 'RESUME', 'STOP'].includes(action)"
      :link="!['START', 'PAUSE', 'RESUME', 'STOP'].includes(action)"
      size="small"
      :icon="buttonIcon(action)"
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
  gap: 4px 6px;
}

.row-actions :deep(.el-button) {
  justify-content: center;
  min-height: 26px;
  margin-left: 0;
}
</style>

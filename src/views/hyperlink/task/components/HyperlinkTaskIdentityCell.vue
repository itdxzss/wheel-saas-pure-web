<script setup lang="ts">
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import {
  messageTypeLabel,
  taskModeHelp,
  taskModeLabel
} from "../domain/list-display";

defineProps<{ row: HyperlinkTaskListItem }>();
</script>

<template>
  <div class="task-identity">
    <strong class="task-name" :title="row.taskName">{{ row.taskName }}</strong>
    <div>
      <el-tag size="small" type="success" effect="light" round>{{
        messageTypeLabel(row.messageType)
      }}</el-tag>
      <el-tooltip :content="taskModeHelp(row.taskMode)" placement="top">
        <el-tag size="small" type="info" effect="light" round>
          {{ taskModeLabel(row.taskMode) }}
        </el-tag>
      </el-tooltip>
    </div>
    <el-link
      v-if="row.promotionLink"
      :href="row.promotionLink"
      target="_blank"
      type="primary"
      class="promotion-link"
    >
      {{ row.promotionLink }}
    </el-link>
    <span v-else class="muted">无推广链接</span>
  </div>
</template>

<style scoped lang="scss">
.task-identity {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.task-identity > div {
  display: flex;
  gap: 5px;
}

.task-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  white-space: nowrap;
}

.promotion-link {
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

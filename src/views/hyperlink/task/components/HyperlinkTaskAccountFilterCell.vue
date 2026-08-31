<script setup lang="ts">
import { computed } from "vue";
import type {
  HyperlinkFilterOption,
  HyperlinkTaskListItem
} from "@/api/hyperlink-task-list";
import { accountFilterLabels } from "../domain/list-display";

const props = defineProps<{
  row: HyperlinkTaskListItem;
  groups: HyperlinkFilterOption[];
  channels: HyperlinkFilterOption[];
  protocols: HyperlinkFilterOption[];
}>();

const labels = computed(() =>
  accountFilterLabels(props.row.accountFilter, {
    groups: props.groups,
    channels: props.channels,
    protocols: props.protocols
  })
);
</script>

<template>
  <span v-if="labels.length === 0" class="muted">未限制</span>
  <div v-else class="tag-list">
    <el-tag
      v-for="label in labels.slice(0, 3)"
      :key="label"
      size="small"
      effect="light"
      round
    >
      {{ label }}
    </el-tag>
    <el-tooltip
      v-if="labels.length > 3"
      :content="labels.join('；')"
      placement="top"
    >
      <el-tag size="small" type="warning" effect="light" round>
        +{{ labels.length - 3 }}
      </el-tag>
    </el-tooltip>
  </div>
</template>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.muted {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

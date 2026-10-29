<script setup lang="ts">
import { computed } from "vue";
import type { WbCompanionSummary } from "@/api/wb-companion";

defineOptions({ name: "WbCompanionCell" });

const props = defineProps<{ summary: WbCompanionSummary | null }>();

const MAX_CONNECTIONS = 4;
/** 圆点依次是主连接和影子 1–3：在线、掉线、空位。快照只有在线数，按在线在前展示。 */
const dots = computed(() => {
  const summary = props.summary;
  if (!summary) return [];
  return Array.from({ length: MAX_CONNECTIONS }, (_, index) =>
    index < summary.onlineCount
      ? "on"
      : index < summary.connectionCount
        ? "off"
        : "empty"
  );
});
const offline = computed(() =>
  props.summary ? props.summary.connectionCount - props.summary.onlineCount : 0
);
</script>

<template>
  <span v-if="!summary" class="wb-cell-empty">—</span>
  <div v-else class="wb-cell">
    <el-tag v-if="summary.runningTaskId" size="small">
      进行中 {{ summary.runningDone }}/{{ summary.runningTarget }}
    </el-tag>
    <span v-if="summary.connectionCount > 0" class="wb-cell-line">
      <span class="wb-dots">
        <i v-for="(dot, index) in dots" :key="index" :class="dot" />
      </span>
      {{ summary.connectionCount }}/{{ MAX_CONNECTIONS }}
      <span class="wb-cell-user">· {{ summary.wbUsername }}</span>
    </span>
    <el-tag v-if="offline > 0" size="small" type="warning">
      {{ offline }} 条掉线
    </el-tag>
  </div>
</template>

<style scoped>
.wb-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.wb-cell-line {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.wb-cell-user,
.wb-cell-empty {
  color: var(--el-text-color-secondary);
}

.wb-dots {
  display: inline-flex;
  gap: 3px;
}

.wb-dots i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.wb-dots i.on {
  background: var(--el-color-success);
}

.wb-dots i.off {
  background: var(--el-color-danger);
}

.wb-dots i.empty {
  border: 1px dashed var(--el-border-color);
}
</style>

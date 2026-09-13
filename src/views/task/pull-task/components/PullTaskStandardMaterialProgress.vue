<script setup lang="ts">
import { computed } from "vue";
import type { PullTaskStandardMaterialSummary } from "@/api/pull-task";
import { formatEpoch } from "../constants";
import { standardMaterialProgressLines } from "../standard-execution-display";

const props = defineProps<{
  summary?: PullTaskStandardMaterialSummary | null;
  executionStatus?: number | null;
}>();

const progressLines = computed(() =>
  standardMaterialProgressLines(props.summary, props.executionStatus)
);
</script>

<template>
  <div v-if="summary" class="material-progress">
    <div v-for="line in progressLines" :key="line">{{ line }}</div>
    <div v-if="summary.lastSuccessfulAt !== undefined" class="last-success">
      最近拉入成功：{{ formatEpoch(summary.lastSuccessfulAt) }}
    </div>
  </div>
  <span v-else>-</span>
</template>

<style scoped>
.material-progress {
  line-height: 1.7;
}

.last-success {
  color: var(--el-text-color-secondary);
}
</style>

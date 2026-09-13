<script setup lang="ts">
import type { PullTaskExecutionObservation } from "@/api/pull-task";
import {
  observationBatchLabel,
  observationTagType,
  observationTimeLines
} from "../execution-observation-display";

defineProps<{
  observation?: PullTaskExecutionObservation | null;
  part: "state" | "batch" | "reason" | "time";
}>();
</script>

<template>
  <div v-if="observation" class="observation" :data-observation-part="part">
    <el-tooltip
      v-if="part === 'state'"
      :content="observation.detail"
      placement="top"
    >
      <el-tag
        size="small"
        effect="plain"
        :type="observationTagType(observation.state)"
        >{{ observation.label }}</el-tag
      >
    </el-tooltip>
    <span v-else-if="part === 'batch'">{{
      observationBatchLabel(observation)
    }}</span>
    <template v-else-if="part === 'reason'">
      <div>{{ observation.detail }}</div>
      <div class="next-step">下一步：{{ observation.nextStep }}</div>
    </template>
    <template v-else>
      <div v-for="line in observationTimeLines(observation)" :key="line">
        {{ line }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.observation {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

.next-step {
  margin-top: 4px;
  color: var(--el-text-color-regular);
}
</style>

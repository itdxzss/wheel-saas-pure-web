<script setup lang="ts">
import { computed } from "vue";
import type { ScriptStep } from "@/api/script-marketing";
import { replySummary } from "../reply";

const props = defineProps<{
  step: ScriptStep;
  steps: ScriptStep[];
  clickable?: boolean;
}>();
const emit = defineEmits<{ locate: [stepId: string] }>();
const index = computed(() =>
  props.steps.findIndex(item => item.stepId === props.step.replyToStepId)
);
const summary = computed(() =>
  index.value < 0
    ? "引用消息不存在，请重新选择"
    : replySummary(props.steps[index.value], index.value)
);
</script>

<template>
  <div v-if="step.replyToStepId" class="reply-quote">
    <el-button
      v-if="clickable && index >= 0"
      text
      type="primary"
      @click.stop="emit('locate', step.replyToStepId)"
    >
      回复 {{ summary }}
    </el-button>
    <span v-else>回复 {{ summary }}</span>
  </div>
</template>

<style scoped>
.reply-quote {
  padding: 8px 10px;
  margin-bottom: 10px;
  font-size: 12px;
  overflow-wrap: anywhere;
  background: var(--el-fill-color-light);
  border-left: 3px solid var(--el-color-primary-light-3);
  border-radius: 4px;
}
.reply-quote .el-button {
  height: auto;
  padding: 0;
  font-size: 12px;
  white-space: normal;
}
</style>

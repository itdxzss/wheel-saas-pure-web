<script setup lang="ts">
import QuestionFilled from "~icons/ep/question-filled";

defineOptions({ name: "CommonGroupHelp" });

defineProps<{
  content: string;
}>();
</script>

<template>
  <el-tooltip :content="content" placement="top" :show-after="150">
    <el-icon class="help-icon" tabindex="0" aria-label="查看说明">
      <QuestionFilled />
    </el-icon>
  </el-tooltip>
</template>

<style scoped>
.help-icon {
  margin-left: 5px;
  color: var(--el-text-color-secondary);
  cursor: help;
}
</style>

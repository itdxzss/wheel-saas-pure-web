<script setup lang="ts">
import type { PullTaskType } from "@/api/pull-task";

defineOptions({
  name: "PullTaskTypeDialog"
});

const emit = defineEmits<{
  (event: "select", type: PullTaskType): void;
}>();

const visible = defineModel<boolean>({ required: true });
</script>

<template>
  <el-dialog v-model="visible" title="选择任务类型" width="560px">
    <div class="task-type-grid">
      <button
        type="button"
        class="task-type-card"
        @click="emit('select', 'STANDARD')"
      >
        <strong>普通拉群</strong>
        <span>进入现有普通拉群配置</span>
      </button>
      <button
        type="button"
        class="task-type-card"
        @click="emit('select', 'GROUP_MARKETING')"
      >
        <strong>拉群营销</strong>
        <span>进入拉群营销独立配置页</span>
      </button>
    </div>
  </el-dialog>
</template>

<style scoped>
.task-type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.task-type-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 130px;
  padding: 24px;
  color: var(--el-text-color-primary);
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.task-type-card:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.task-type-card span {
  color: var(--el-text-color-secondary);
}
</style>

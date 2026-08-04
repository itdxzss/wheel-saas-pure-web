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
      <el-button class="task-type-card" @click="emit('select', 'STANDARD')">
        <strong>普通拉群</strong>
        <span>群链接 · 普通群链接版</span>
      </el-button>
      <el-button
        class="task-type-card"
        @click="emit('select', 'GROUP_MARKETING')"
      >
        <strong>拉群营销</strong>
        <span>进入拉群营销独立配置页</span>
      </el-button>
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
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: auto;
  min-height: 130px;
  padding: 24px;
  text-align: left;
}

.task-type-card span {
  color: var(--el-text-color-secondary);
}

.task-type-card + .task-type-card {
  margin-left: 0;
}
</style>

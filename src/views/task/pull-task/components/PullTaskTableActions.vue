<script setup lang="ts">
import type { PullTaskListAction, PullTaskRow } from "@/api/pull-task";

defineOptions({
  name: "PullTaskTableActions"
});

const props = defineProps<{
  row: PullTaskRow;
}>();

const emit = defineEmits<{
  (event: "action", action: PullTaskListAction): void;
}>();

function hasAction(action: PullTaskListAction): boolean {
  return props.row.allowedActions.includes(action);
}
</script>

<template>
  <div class="action-row">
    <el-button
      v-if="hasAction('DETAIL')"
      link
      type="primary"
      @click="emit('action', 'DETAIL')"
      >查看详情</el-button
    >
    <el-button
      v-if="hasAction('START')"
      v-auth="'tenant:pull_task:operate'"
      link
      type="success"
      @click="emit('action', 'START')"
      >启动</el-button
    >
    <el-button
      v-if="hasAction('PAUSE')"
      v-auth="'tenant:pull_task:operate'"
      link
      type="warning"
      @click="emit('action', 'PAUSE')"
      >暂停</el-button
    >
    <el-button
      v-if="hasAction('RESUME')"
      v-auth="'tenant:pull_task:operate'"
      link
      type="success"
      @click="emit('action', 'RESUME')"
      >恢复</el-button
    >
    <el-button
      v-if="hasAction('END')"
      v-auth="'tenant:pull_task:operate'"
      link
      type="danger"
      @click="emit('action', 'END')"
      >结束</el-button
    >
    <el-button
      v-if="hasAction('DELETE')"
      v-auth="'tenant:pull_task:delete'"
      link
      type="danger"
      @click="emit('action', 'DELETE')"
      >删除</el-button
    >
  </div>
</template>

<style scoped>
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
</style>

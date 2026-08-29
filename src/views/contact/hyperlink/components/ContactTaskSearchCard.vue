<script setup lang="ts">
import { RUN_STATUS_OPTIONS } from "../domain/task-status";

defineProps<{
  name: string;
  runStatus: number | null;
  createdRange: [number, number] | null;
}>();

const emit = defineEmits<{
  (e: "update:name", value: string): void;
  (e: "update:runStatus", value: number | null): void;
  (e: "update:createdRange", value: [number, number] | null): void;
  (e: "search"): void;
  (e: "reset"): void;
}>();
</script>

<template>
  <el-card shadow="never" class="search-card">
    <el-form inline>
      <el-form-item label="任务名称">
        <el-input
          :model-value="name"
          clearable
          maxlength="128"
          placeholder="按任务名称搜索"
          class="name-input"
          @update:model-value="emit('update:name', $event)"
          @keyup.enter="emit('search')"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          :model-value="runStatus"
          clearable
          placeholder="全部状态"
          class="status-select"
          @update:model-value="emit('update:runStatus', $event)"
        >
          <el-option
            v-for="option in RUN_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          :model-value="createdRange"
          type="datetimerange"
          value-format="x"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          @update:model-value="emit('update:createdRange', $event)"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('search')">查询</el-button>
        <el-button @click="emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.search-card {
  margin-bottom: 12px;
}

.name-input {
  width: 220px;
}

.status-select {
  width: 160px;
}
</style>

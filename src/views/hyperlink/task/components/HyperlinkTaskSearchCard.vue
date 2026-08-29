<script setup lang="ts">
import type {
  HyperlinkFilterOption,
  HyperlinkTaskMode,
  HyperlinkTaskRunStatus
} from "@/api/hyperlink-task-list";
import type { HyperlinkTaskSearchForm } from "../composables/useHyperlinkTaskPage";

const searchForm = defineModel<HyperlinkTaskSearchForm>("searchForm", {
  required: true
});

defineProps<{ countries: HyperlinkFilterOption[] }>();
defineEmits<{ (event: "search"): void; (event: "reset"): void }>();

const statusOptions: Array<{ label: string; value: HyperlinkTaskRunStatus }> = [
  { label: "未开始", value: 0 },
  { label: "进行中", value: 1 },
  { label: "已完成", value: 2 },
  { label: "已暂停", value: 3 },
  { label: "已停止", value: 4 }
];

const modeOptions: Array<{ label: string; value: HyperlinkTaskMode }> = [
  { label: "即时", value: "instant" },
  { label: "预发布", value: "rolling" },
  { label: "周期", value: "cycle" }
];
</script>

<template>
  <el-card class="search-card" shadow="never">
    <el-form
      :model="searchForm"
      label-width="72px"
      @submit.prevent="$emit('search')"
    >
      <el-row :gutter="14">
        <el-col :xs="24" :sm="12" :lg="6">
          <el-form-item label="任务名">
            <el-input
              v-model="searchForm.taskName"
              clearable
              placeholder="输入任务名称，回车搜索"
              @keyup.enter="$emit('search')"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="4">
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.runStatus"
              clearable
              placeholder="全部状态"
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="4">
          <el-form-item label="任务类型">
            <el-select
              v-model="searchForm.taskMode"
              clearable
              placeholder="全部类型"
            >
              <el-option
                v-for="option in modeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="4">
          <el-form-item label="目标国家">
            <el-select
              v-model="searchForm.countryIso2"
              clearable
              filterable
              placeholder="全部国家"
            >
              <el-option
                v-for="option in countries"
                :key="String(option.value)"
                :label="option.label"
                :value="String(option.value)"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :lg="6">
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="searchForm.createdRange"
              type="datetimerange"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              range-separator="至"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="search-actions">
        <el-button @click="$emit('reset')">重置</el-button>
        <el-button type="primary" @click="$emit('search')">搜索</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.search-card {
  margin-bottom: 12px;
}

.search-card :deep(.el-form-item) {
  margin-bottom: 12px;
}

.search-card :deep(.el-select),
.search-card :deep(.el-date-editor) {
  width: 100%;
}

.search-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type {
  HyperlinkFilterOption,
  HyperlinkTaskMode,
  HyperlinkTaskRunStatus
} from "@/api/hyperlink-task-list";
import type { HyperlinkTaskSearchForm } from "../composables/useHyperlinkTaskPage";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

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

type DatePreset = "all" | "today" | "yesterday" | "week";

const selectedDatePreset = computed(() => {
  const range = searchForm.value.createdRange;
  if (!range) return "all";
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const week = addDays(today, -6);
  const start = range[0].getTime();
  if (start === today.getTime()) return "today";
  if (start === yesterday.getTime()) return "yesterday";
  if (start === week.getTime()) return "week";
  return "";
});

const createdDateDefaultTime: [Date, Date] = [
  new Date(2000, 0, 1, 0, 0, 0),
  new Date(2000, 0, 1, 23, 59, 59, 999)
];

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date): Date {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999
  );
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function selectDatePreset(value: string | number | boolean | undefined): void {
  const preset = String(value) as DatePreset;
  if (preset === "all") {
    searchForm.value = { ...searchForm.value, createdRange: null };
    return;
  }
  const today = startOfDay(new Date());
  const start =
    preset === "today"
      ? today
      : preset === "yesterday"
        ? addDays(today, -1)
        : addDays(today, -6);
  const end = preset === "yesterday" ? endOfDay(start) : endOfDay(today);
  searchForm.value = { ...searchForm.value, createdRange: [start, end] };
}
</script>

<template>
  <el-card class="search-card" shadow="never">
    <el-form :model="searchForm" @submit.prevent="$emit('search')">
      <div class="filter-row primary-row">
        <el-form-item label="任务名" class="task-name-item">
          <el-input
            v-model="searchForm.taskName"
            clearable
            placeholder="任务名称模糊搜索"
            @keyup.enter="$emit('search')"
          />
        </el-form-item>
        <el-form-item label="状态" class="status-item">
          <el-select
            v-model="searchForm.runStatus"
            clearable
            placeholder="全部"
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型" class="mode-item">
          <el-radio-group v-model="searchForm.taskMode">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button
              v-for="option in modeOptions"
              :key="option.value"
              :value="option.value"
              >{{ option.label }}</el-radio-button
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标国家" class="country-item">
          <el-select
            v-model="searchForm.countryIso2"
            clearable
            filterable
            placeholder="按营销目标国家筛选"
          >
            <el-option
              v-for="option in countries"
              :key="String(option.value)"
              :label="option.label"
              :value="String(option.value)"
            />
          </el-select>
        </el-form-item>
      </div>
      <div class="filter-row secondary-row">
        <el-form-item label="创建时间" class="date-item">
          <div class="date-filter-group">
            <el-radio-group
              :model-value="selectedDatePreset"
              @change="selectDatePreset"
            >
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="today">今天</el-radio-button>
              <el-radio-button value="yesterday">昨天</el-radio-button>
              <el-radio-button value="week">近一周</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="searchForm.createdRange"
              type="daterange"
              :default-time="createdDateDefaultTime"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              range-separator="→"
            />
          </div>
        </el-form-item>
        <div class="search-actions">
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="$emit('reset')"
          >
            重置
          </el-button>
          <el-button
            type="primary"
            plain
            :icon="useRenderIcon(Search)"
            @click="$emit('search')"
          >
            搜索
          </el-button>
        </div>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.search-card {
  margin-bottom: 12px;
  border: 0;
  border-radius: 10px;
}

.search-card :deep(.el-card__body) {
  padding: 14px 20px;
}

.filter-row,
.date-filter-group,
.search-actions {
  display: flex;
  align-items: center;
}

.filter-row {
  flex-wrap: wrap;
  gap: 12px 26px;
}

.secondary-row {
  margin-top: 10px;
}

.filter-row :deep(.el-form-item) {
  margin: 0;
}

.task-name-item :deep(.el-input) {
  width: 240px;
}

.status-item :deep(.el-select) {
  width: 160px;
}

.country-item :deep(.el-select) {
  width: 240px;
}

.date-filter-group {
  flex-wrap: wrap;
  gap: 8px;
}

.date-filter-group :deep(.el-date-editor) {
  width: 260px;
}

.search-actions {
  gap: 8px;
  margin-left: 2px;
}

@media (width <= 1200px) {
  .filter-row {
    gap: 10px 18px;
  }
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { DataPackageCountryOption } from "@/api/hyperlink-data-package";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Globe from "~icons/ri/global-line";
import {
  dataPackageCountryFlag,
  dataPackageCountryLabel,
  type DataPackageSearchForm
} from "../composables/useDataPackagePage";

defineOptions({ name: "DataPackageSearchCard" });

const searchForm = defineModel<DataPackageSearchForm>("searchForm", {
  required: true
});

const props = defineProps<{
  countries: DataPackageCountryOption[];
  countryLoading: boolean;
}>();

const emit = defineEmits<{
  (event: "reset"): void;
  (event: "search"): void;
}>();

type DatePreset = "all" | "today" | "yesterday";

const selectedCountry = computed({
  get: () => searchForm.value.countryIso2s[0] ?? "",
  set: (value: string) => {
    searchForm.value = {
      ...searchForm.value,
      countryIso2s: value ? [value] : []
    };
    emit("search");
  }
});

const selectedDatePreset = computed(() => {
  const range = searchForm.value.createdRange;
  if (!range) return "all";
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (range[0].getTime() === today.getTime()) return "today";
  if (range[0].getTime() === yesterday.getTime()) return "yesterday";
  return "";
});

const visibleCountries = computed(() => props.countries.slice(0, 6));

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

function selectDatePreset(value: string | number | boolean | undefined): void {
  const preset = String(value) as DatePreset;
  if (preset === "all") {
    searchForm.value = { ...searchForm.value, createdRange: null };
  } else {
    const date = startOfDay(new Date());
    if (preset === "yesterday") date.setDate(date.getDate() - 1);
    searchForm.value = {
      ...searchForm.value,
      createdRange: [date, endOfDay(date)]
    };
  }
  emit("search");
}
</script>

<template>
  <el-card class="search-card" shadow="never">
    <el-form :model="searchForm" class="filter-form">
      <div class="filter-row">
        <el-form-item label="名称" class="name-item">
          <el-input
            v-model="searchForm.name"
            clearable
            maxlength="128"
            placeholder="数据包名称模糊搜索"
            class="name-filter"
            :prefix-icon="useRenderIcon(Search)"
            @keyup.enter="emit('search')"
          />
        </el-form-item>
        <el-form-item label="创建时间" class="date-item">
          <div class="date-filter-group">
            <el-radio-group
              :model-value="selectedDatePreset"
              @change="selectDatePreset"
            >
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="today">今天</el-radio-button>
              <el-radio-button value="yesterday">昨天</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="searchForm.createdRange"
              type="daterange"
              :default-time="createdDateDefaultTime"
              start-placeholder="开始日期时间"
              end-placeholder="结束日期时间"
              range-separator="→"
              class="date-filter"
              @change="emit('search')"
            />
          </div>
        </el-form-item>
      </div>

      <div class="filter-row secondary-row">
        <el-form-item label="UV 占比" class="uv-item">
          <div class="uv-filter">
            <el-input-number
              v-model="searchForm.minUvPercent"
              :min="0"
              :max="100"
              :precision="2"
              :step="0.5"
              controls-position="right"
              placeholder="最小"
            />
            <span class="range-mark">~</span>
            <el-input-number
              v-model="searchForm.maxUvPercent"
              :min="0"
              :max="100"
              :precision="2"
              :step="0.5"
              controls-position="right"
              placeholder="最大"
            />
          </div>
        </el-form-item>
        <div class="filter-actions">
          <el-button :icon="useRenderIcon(RefreshRight)" @click="emit('reset')">
            重置
          </el-button>
          <el-button
            type="primary"
            plain
            :icon="useRenderIcon(Search)"
            @click="emit('search')"
          >
            搜索
          </el-button>
        </div>
      </div>

      <div v-if="countries.length || countryLoading" class="country-row">
        <div class="country-label">
          <component :is="useRenderIcon(Globe)" />
          <span>主要国家</span>
        </div>
        <el-radio-group
          v-model="selectedCountry"
          class="country-radio-group"
          :disabled="countryLoading"
        >
          <el-radio-button value="">
            <span class="country-option"><span>🌐</span>全部</span>
          </el-radio-button>
          <el-radio-button
            v-for="country in visibleCountries"
            :key="country.value"
            :value="country.value"
          >
            <span class="country-option">
              <span>{{ dataPackageCountryFlag(country.countryIso2) }}</span>
              {{ dataPackageCountryLabel(country.countryIso2, countries) }}
            </span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </el-form>
  </el-card>
</template>

<style scoped>
.search-card {
  margin-bottom: 12px;
}

.search-card :deep(.el-card__body) {
  padding: 18px 20px;
}

.filter-form,
.filter-row,
.date-filter-group,
.uv-filter,
.filter-actions,
.country-row,
.country-label,
.country-option {
  display: flex;
  align-items: center;
}

.filter-form {
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.filter-row {
  flex-wrap: wrap;
  gap: 18px 28px;
}

.filter-row :deep(.el-form-item) {
  margin: 0;
}

.name-filter {
  width: 260px;
}

.date-filter-group {
  flex-wrap: wrap;
  gap: 8px;
}

.date-filter {
  width: 360px;
}

.uv-filter {
  gap: 8px;
}

.uv-filter :deep(.el-input-number) {
  width: 130px;
}

.range-mark {
  color: var(--el-text-color-placeholder);
}

.filter-actions {
  gap: 8px;
}

.country-row {
  flex-wrap: wrap;
  gap: 12px;
  min-height: 34px;
}

.country-label {
  gap: 6px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.country-label :deep(svg) {
  width: 16px;
  height: 16px;
  color: var(--el-color-primary);
}

.country-radio-group {
  display: flex;
  flex-wrap: wrap;
}

.country-option {
  gap: 5px;
}

@media (width <= 1000px) {
  .name-item,
  .date-item,
  .uv-item,
  .name-filter,
  .date-filter-group,
  .date-filter {
    width: 100%;
  }
}
</style>

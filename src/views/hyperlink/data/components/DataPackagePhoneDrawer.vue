<script setup lang="ts">
import { computed } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type {
  DataPackageCountryOption,
  DataPackageListItem,
  DataPackagePhoneItem,
  DataPackagePoolStatus
} from "@/api/hyperlink-data-package";
import { formatEpochMillis } from "@/utils/time";
import {
  dataPackageCountryLabel,
  dataPackagePoolStatusLabel,
  dataPackagePoolStatusOptions,
  dataPackagePoolStatusTagType
} from "../composables/useDataPackagePage";

defineOptions({ name: "DataPackagePhoneDrawer" });

const props = defineProps<{
  countries: DataPackageCountryOption[];
  countryIso2: string;
  dataPackage: DataPackageListItem | null;
  errorMessage: string;
  loading: boolean;
  modelValue: boolean;
  page: number;
  pageSize: number;
  phone: string;
  poolStatus: DataPackagePoolStatus | "";
  rows: DataPackagePhoneItem[];
  total: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "reset"): void;
  (event: "search"): void;
  (event: "update:countryIso2", value: string): void;
  (event: "update:modelValue", value: boolean): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
  (event: "update:phone", value: string): void;
  (event: "update:poolStatus", value: DataPackagePoolStatus | ""): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});
const phoneFilter = computed({
  get: () => props.phone,
  set: value => emit("update:phone", value)
});
const statusFilter = computed({
  get: () => props.poolStatus,
  set: value => emit("update:poolStatus", value)
});
const countryFilter = computed({
  get: () => props.countryIso2,
  set: value => emit("update:countryIso2", value)
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`号码明细 · ${dataPackage?.name ?? '-'}`"
    size="1000px"
    destroy-on-close
  >
    <el-form :inline="true" class="phone-filters">
      <el-form-item label="手机号">
        <el-input
          v-model="phoneFilter"
          clearable
          maxlength="20"
          placeholder="输入数字片段"
          @keyup.enter="emit('search')"
        />
      </el-form-item>
      <el-form-item label="池状态">
        <el-select
          v-model="statusFilter"
          clearable
          placeholder="全部状态"
          class="filter-select"
        >
          <el-option
            v-for="option in dataPackagePoolStatusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="国家">
        <el-select
          v-model="countryFilter"
          clearable
          filterable
          placeholder="全部国家"
          class="filter-select"
        >
          <el-option
            v-for="country in countries"
            :key="country.value"
            :label="dataPackageCountryLabel(country.countryIso2, countries)"
            :value="country.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="emit('search')">查询</el-button>
        <el-button @click="emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="errorMessage"
      class="phone-error"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="emit('refresh')">重试</el-button>
    </el-alert>

    <el-table v-loading="loading" :data="rows" row-key="id" border>
      <el-table-column prop="phone" label="手机号" min-width="180" />
      <el-table-column prop="countryIso2" label="国家" min-width="160">
        <template #default="{ row }">
          {{ dataPackageCountryLabel(row.countryIso2, countries) }}
        </template>
      </el-table-column>
      <el-table-column prop="poolStatus" label="池状态" min-width="160">
        <template #default="{ row }">
          <el-tag :type="dataPackagePoolStatusTagType(row.poolStatus)">
            {{ dataPackagePoolStatusLabel(row.poolStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sourceImportId" label="导入批次" min-width="130" />
      <el-table-column prop="generation" label="代次" width="90" />
      <el-table-column prop="createdAt" label="导入时间" width="180">
        <template #default="{ row }">
          {{ formatEpochMillis(row.createdAt) }}
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无符合条件的号码" />
      </template>
    </el-table>

    <WheelPagination
      v-model:current-page="currentPage"
      v-model:page-size="currentPageSize"
      :page-sizes="[50, 100, 200]"
      :total="total"
      @change="emit('refresh')"
    />
  </el-drawer>
</template>

<style scoped>
.phone-filters {
  padding: 16px 16px 0;
  margin-bottom: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.filter-select {
  width: 190px;
}

.phone-error {
  margin-bottom: 12px;
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type {
  DataPackageListItem,
  DataPackagePhoneItem
} from "@/api/hyperlink-data-package";
import { formatEpochMillis } from "@/utils/time";

defineOptions({ name: "DataPackagePhoneDrawer" });

const props = defineProps<{
  dataPackage: DataPackageListItem | null;
  errorMessage: string;
  loading: boolean;
  modelValue: boolean;
  page: number;
  pageSize: number;
  phone: string;
  rows: DataPackagePhoneItem[];
  total: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "reset"): void;
  (event: "search"): void;
  (event: "update:modelValue", value: boolean): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
  (event: "update:phone", value: string): void;
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

function rowNumber(index: number): number {
  return (props.page - 1) * props.pageSize + index + 1;
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`查看号码 · ${dataPackage?.name ?? '-'}`"
    size="720px"
    destroy-on-close
  >
    <el-form :inline="true" class="phone-filters">
      <el-form-item label="手机号">
        <el-input
          v-model="phoneFilter"
          clearable
          maxlength="20"
          placeholder="请输入手机号"
          @keyup.enter="emit('search')"
        />
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
      <el-table-column label="#" width="80">
        <template #default="{ $index }">
          {{ rowNumber($index) }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" min-width="220" />
      <el-table-column prop="createdAt" label="入库时间" width="190">
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

.phone-error {
  margin-bottom: 12px;
}
</style>

<script setup lang="ts">
import type {
  DataPackageCountryOption,
  DataPackageListItem
} from "@/api/hyperlink-data-package";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Database from "~icons/solar/database-bold-duotone";
import {
  dataPackageCountryFlag,
  dataPackageCountryLabel
} from "../composables/useDataPackagePage";

defineOptions({ name: "DataPackageIdentityCell" });

defineProps<{
  row: DataPackageListItem;
  countries: DataPackageCountryOption[];
}>();

defineEmits<{ (event: "visit"): void }>();
</script>

<template>
  <button type="button" class="package-cell" @click="$emit('visit')">
    <span class="package-icon">
      <component :is="useRenderIcon(Database)" />
    </span>
    <span class="package-copy">
      <span class="package-main">
        <span class="package-name" :title="row.name">{{ row.name }}</span>
        <el-tag
          v-if="row.metrics.totalCount > 0"
          size="small"
          effect="light"
          type="primary"
        >
          {{ dataPackageCountryFlag(row.primaryCountryIso2) }}
          {{ dataPackageCountryLabel(row.primaryCountryIso2, countries) }}
        </el-tag>
      </span>
      <span class="package-remark">{{ row.remark || "暂无备注" }}</span>
    </span>
  </button>
</template>

<style scoped>
.package-cell {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.package-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--el-color-primary);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-8),
    var(--el-color-primary-light-9)
  );
  border-radius: 9px;
}

.package-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.package-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.package-main {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.package-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--el-color-primary);
  white-space: nowrap;
}

.package-cell:hover .package-name {
  text-decoration: underline;
}

.package-remark {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}
</style>

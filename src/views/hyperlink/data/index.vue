<script setup lang="ts">
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { DataPackageListItem } from "@/api/hyperlink-data-package";
import { formatEpochMillis } from "@/utils/time";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Plus from "~icons/ep/plus";
import DataPackageFormDialog from "./components/DataPackageFormDialog.vue";
import DataPackageImportDialog from "./components/DataPackageImportDialog.vue";
import DataPackagePhoneDrawer from "./components/DataPackagePhoneDrawer.vue";
import {
  dataPackageCountryLabel,
  useDataPackagePage
} from "./composables/useDataPackagePage";

defineOptions({ name: "HyperlinkDataPackage" });

const createdDateDefaultTime: [Date, Date] = [
  new Date(2000, 0, 1, 0, 0, 0),
  new Date(2000, 0, 1, 23, 59, 59, 999)
];

const {
  columns,
  countries,
  countryErrorMessage,
  countryLoading,
  editingPackage,
  errorMessage,
  formVisible,
  importMode,
  importResult,
  importTarget,
  importVisible,
  importing,
  loading,
  page,
  pageSize,
  phoneDrawerVisible,
  phoneErrorMessage,
  phoneFilters,
  phoneLoading,
  phonePage,
  phonePageSize,
  phoneRows,
  phoneTarget,
  phoneTotal,
  rows,
  saving,
  searchForm,
  total,
  initialize,
  openCreateForm,
  openEditForm,
  openImport,
  openPhoneDrawer,
  refreshCountryOptions,
  refreshDataPackages,
  refreshPhoneRows,
  removeDataPackage,
  resetPhoneFilters,
  resetSearchForm,
  saveMetadata,
  searchDataPackages,
  searchPhoneRows,
  submitImport
} = useDataPackagePage();

function asDataPackage(row: unknown): DataPackageListItem {
  return row as DataPackageListItem;
}

function tableValue(row: DataPackageListItem, prop: string): string | number {
  switch (prop) {
    case "name":
      return row.name;
    case "metrics.totalCount":
      return row.metrics.totalCount;
    case "metrics.unusedCount":
      return row.metrics.unusedCount;
    case "metrics.usedCount":
      return row.metrics.usedCount;
    case "metrics.sentCount":
      return row.metrics.sentCount;
    case "metrics.deliveredCount":
      return row.metrics.deliveredCount;
    case "metrics.failedCount":
      return row.metrics.failedCount;
    case "metrics.unregisteredCount":
      return row.metrics.unregisteredCount;
    case "metrics.clickUvCount":
      return row.metrics.clickUvCount;
    default:
      return "-";
  }
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <div class="data-package-page">
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="数据包名称">
          <el-input
            v-model="searchForm.name"
            clearable
            maxlength="128"
            placeholder="输入名称关键词"
            class="name-filter"
            @keyup.enter="searchDataPackages"
          />
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="searchForm.createdRange"
            type="daterange"
            :default-time="createdDateDefaultTime"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
            class="date-filter"
          />
        </el-form-item>
        <el-form-item label="国家">
          <el-select
            v-model="searchForm.countryIso2s"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            :loading="countryLoading"
            placeholder="全部国家"
            class="country-filter"
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
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchDataPackages"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="page-alert"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="refreshDataPackages">
        重试
      </el-button>
    </el-alert>
    <el-alert
      v-if="countryErrorMessage"
      class="page-alert"
      type="warning"
      show-icon
      :closable="false"
      :title="countryErrorMessage"
    >
      <el-button link type="primary" @click="refreshCountryOptions">
        重试
      </el-button>
    </el-alert>

    <PureTableBar
      title="超链数据包"
      :columns="columns"
      @refresh="refreshDataPackages"
    >
      <template #buttons>
        <el-button
          v-auth="'tenant:hyperlink_data:create'"
          type="primary"
          :icon="useRenderIcon(Plus)"
          @click="openCreateForm"
        >
          创建数据包
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="rows" row-key="id" border>
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.prop"
            v-bind="column"
          >
            <template #default="{ row }">
              <template v-if="column.prop === 'countries'">
                <div
                  v-if="asDataPackage(row).countries.length > 0"
                  class="country-tags"
                >
                  <el-tag
                    v-for="country in asDataPackage(row).countries"
                    :key="country ?? 'UNKNOWN'"
                    size="small"
                    effect="plain"
                  >
                    {{ dataPackageCountryLabel(country, countries) }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.prop === 'createdAt'">
                {{ formatEpochMillis(asDataPackage(row).createdAt) }}
              </template>
              <template v-else>
                {{ tableValue(asDataPackage(row), column.prop) }}
              </template>
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" width="330">
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:hyperlink_data:view'"
                link
                type="primary"
                @click="openPhoneDrawer(asDataPackage(row))"
              >
                查看号码
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_data:import'"
                link
                type="primary"
                @click="openImport(asDataPackage(row), 'APPEND')"
              >
                追加导入
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_data:import'"
                link
                type="warning"
                @click="openImport(asDataPackage(row), 'OVERWRITE')"
              >
                覆盖导入
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_data:edit'"
                link
                type="primary"
                @click="openEditForm(asDataPackage(row))"
              >
                编辑
              </el-button>
              <el-button
                v-auth="'tenant:hyperlink_data:delete'"
                link
                type="danger"
                @click="removeDataPackage(asDataPackage(row))"
              >
                删除
              </el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="暂无符合条件的数据包" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          @change="refreshDataPackages"
        />
      </template>
    </PureTableBar>

    <DataPackageFormDialog
      v-model="formVisible"
      :data-package="editingPackage"
      :saving="saving"
      @submit="saveMetadata"
    />
    <DataPackageImportDialog
      v-model="importVisible"
      :data-package="importTarget"
      :default-mode="importMode"
      :result="importResult"
      :submitting="importing"
      @submit="submitImport"
    />
    <DataPackagePhoneDrawer
      v-model="phoneDrawerVisible"
      v-model:page="phonePage"
      v-model:page-size="phonePageSize"
      v-model:phone="phoneFilters.phone"
      v-model:pool-status="phoneFilters.poolStatus"
      v-model:country-iso2="phoneFilters.countryIso2"
      :countries="countries"
      :data-package="phoneTarget"
      :error-message="phoneErrorMessage"
      :loading="phoneLoading"
      :rows="phoneRows"
      :total="phoneTotal"
      @refresh="refreshPhoneRows"
      @reset="resetPhoneFilters"
      @search="searchPhoneRows"
    />
  </div>
</template>

<style scoped>
.data-package-page {
  padding: 16px;
}

.search-card,
.page-alert {
  margin-bottom: 12px;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.name-filter {
  width: 220px;
}

.date-filter {
  width: 300px;
}

.country-filter {
  width: 260px;
}

.country-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

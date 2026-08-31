<script setup lang="ts">
import { computed, onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type {
  DataPackageListItem,
  DataPackageUsageStatus
} from "@/api/hyperlink-data-package";
import { formatEpochMillis } from "@/utils/time";
import Plus from "~icons/ep/plus";
import Download from "~icons/ep/download";
import Upload from "~icons/ep/upload";
import RefreshRight from "~icons/ep/refresh-right";
import MoreFilled from "~icons/ep/more-filled";
import FileExcel from "~icons/ri/file-excel-2-line";
import Cursor from "~icons/ri/cursor-line";
import ClickAnalysisDrawer from "./components/ClickAnalysisDrawer.vue";
import DataPackageFormDialog from "./components/DataPackageFormDialog.vue";
import DataPackageFunnelCell from "./components/DataPackageFunnelCell.vue";
import DataPackageIdentityCell from "./components/DataPackageIdentityCell.vue";
import DataPackageImportDialog from "./components/DataPackageImportDialog.vue";
import DataPackageIntro from "./components/DataPackageIntro.vue";
import DataPackagePhoneDrawer from "./components/DataPackagePhoneDrawer.vue";
import DataPackageSearchCard from "./components/DataPackageSearchCard.vue";
import DataPackageUsageCell from "./components/DataPackageUsageCell.vue";
import {
  dataPackageImportBlocked,
  dataPackageExportOptions,
  retryableFailureCount,
  type DataPackageTableColumn,
  useDataPackagePage
} from "./composables/useDataPackagePage";

defineOptions({ name: "HyperlinkDataPackage" });

const {
  clickAnalysisVisible,
  columns,
  countries,
  countryErrorMessage,
  countryLoading,
  editingPackage,
  errorMessage,
  formVisible,
  importMode,
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
  selectedRows,
  total,
  visitTarget,
  visitTrendVisible,
  exportClickRecords,
  exportCurrentPageCsv,
  exportOne,
  exportSelected,
  initialize,
  openClickAnalysis,
  openCreateForm,
  openEditForm,
  openImport,
  openPhoneDrawer,
  openVisitTrend,
  refreshCountryOptions,
  refreshDataPackages,
  refreshPhoneRows,
  removeDataPackage,
  resetFailed,
  resetPhoneFilters,
  resetSearchForm,
  saveMetadata,
  searchDataPackages,
  searchPhoneRows,
  setSelectedRows,
  submitImport
} = useDataPackagePage();

const currentPagePhoneCount = computed(() =>
  rows.value.reduce((sum, row) => sum + row.metrics.totalCount, 0)
);
const currentPageEmptyCount = computed(
  () => rows.value.filter(row => row.metrics.totalCount === 0).length
);

function asDataPackage(row: unknown): DataPackageListItem {
  return row as DataPackageListItem;
}

function columnVisible(
  dynamicColumns: DataPackageTableColumn[],
  prop: string
): boolean {
  return dynamicColumns.find(column => column.prop === prop)?.hide !== true;
}

function handleMore(command: string, row: DataPackageListItem): void {
  if (command === "view") void openPhoneDrawer(row);
  if (command === "rename") openEditForm(row);
  if (command === "delete") void removeDataPackage(row);
}

function handleSingleExport(
  command: DataPackageUsageStatus,
  row: DataPackageListItem
): void {
  void exportOne(row, command);
}

function handleBatchExport(command: DataPackageUsageStatus): void {
  void exportSelected(command);
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <div class="data-package-page">
    <DataPackageIntro />

    <DataPackageSearchCard
      v-model:search-form="searchForm"
      :countries="countries"
      :country-loading="countryLoading"
      @reset="resetSearchForm"
      @search="searchDataPackages"
    />

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
      class="management-table"
      style="margin-top: 0"
      title="数据包管理"
      :columns="columns"
      @refresh="refreshDataPackages"
    >
      <template #title>
        <div class="management-title">
          <strong>数据包管理</strong>
          <el-tag size="small" effect="light" type="primary" round>
            本页 {{ rows.length }} 个
          </el-tag>
          <el-tag size="small" effect="light" type="success" round>
            本页号码 {{ currentPagePhoneCount.toLocaleString() }}
          </el-tag>
          <el-tag
            v-if="currentPageEmptyCount > 0"
            size="small"
            effect="light"
            type="warning"
            round
          >
            空包 {{ currentPageEmptyCount }}
          </el-tag>
        </div>
      </template>
      <template #buttons>
        <div class="table-actions">
          <el-button
            v-auth="'tenant:hyperlink_data:create'"
            type="primary"
            :icon="useRenderIcon(Plus)"
            @click="openCreateForm"
          >
            新建数据包
          </el-button>
          <el-dropdown
            v-auth="'tenant:hyperlink_data:export'"
            trigger="click"
            @command="handleBatchExport"
          >
            <el-button
              type="primary"
              plain
              :icon="useRenderIcon(Download)"
              :disabled="selectedRows.length === 0"
            >
              批量导出号码<span v-if="selectedRows.length">
                （已选 {{ selectedRows.length }}）
              </span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in dataPackageExportOptions"
                  :key="option.value"
                  :command="option.value"
                >
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown
            v-auth="'tenant:hyperlink_data:export'"
            trigger="click"
            @command="exportClickRecords"
          >
            <el-button
              type="info"
              plain
              :icon="useRenderIcon(Cursor)"
              :disabled="selectedRows.length === 0"
            >
              批量导出点击记录<span v-if="selectedRows.length">
                （已选 {{ selectedRows.length }}）
              </span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="txt">
                  TXT（仅收件人手机号）
                </el-dropdown-item>
                <el-dropdown-item command="csv">
                  CSV（含数据包名称等字段）
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            v-auth="'tenant:hyperlink_data:view'"
            type="warning"
            plain
            :icon="useRenderIcon(Cursor)"
            @click="openClickAnalysis"
          >
            超链点击分析
          </el-button>
          <el-button
            v-auth="'tenant:hyperlink_data:view'"
            type="primary"
            plain
            :icon="useRenderIcon(FileExcel)"
            @click="exportCurrentPageCsv"
          >
            导出 CSV
          </el-button>
        </div>
      </template>

      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          border
          size="small"
          @selection-change="setSelectedRows"
        >
          <el-table-column type="selection" width="48" fixed="left" />
          <el-table-column
            v-if="columnVisible(dynamicColumns, 'id')"
            prop="id"
            label="ID"
            width="80"
            fixed="left"
          >
            <template #default="{ row }">
              <span class="package-id">#{{ asDataPackage(row).id }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-if="columnVisible(dynamicColumns, 'dataPackage')"
            label="数据包"
            min-width="340"
            fixed="left"
          >
            <template #default="{ row }">
              <DataPackageIdentityCell
                v-auth="'tenant:hyperlink_data:view'"
                :row="asDataPackage(row)"
                :countries="countries"
                @visit="openVisitTrend(asDataPackage(row))"
              />
            </template>
          </el-table-column>
          <el-table-column
            v-if="columnVisible(dynamicColumns, 'phoneUsage')"
            label="号码使用"
            min-width="280"
          >
            <template #default="{ row }">
              <DataPackageUsageCell :row="asDataPackage(row)" />
            </template>
          </el-table-column>
          <el-table-column
            v-if="columnVisible(dynamicColumns, 'deliveryFunnel')"
            label="投递漏斗"
            min-width="250"
          >
            <template #default="{ row }">
              <DataPackageFunnelCell :row="asDataPackage(row)" />
            </template>
          </el-table-column>
          <el-table-column
            v-if="columnVisible(dynamicColumns, 'createdAt')"
            label="创建时间"
            width="180"
          >
            <template #default="{ row }">
              {{ formatEpochMillis(asDataPackage(row).createdAt) }}
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            fixed="right"
            width="390"
            align="center"
          >
            <template #default="{ row }">
              <el-tooltip
                :disabled="!dataPackageImportBlocked(asDataPackage(row))"
                content="该数据包包含禁止上传号码的国家或地区"
                placement="top"
              >
                <span>
                  <el-button
                    v-auth="'tenant:hyperlink_data:import'"
                    size="small"
                    type="success"
                    plain
                    :icon="useRenderIcon(Upload)"
                    :disabled="dataPackageImportBlocked(asDataPackage(row))"
                    @click="openImport(asDataPackage(row))"
                  >
                    导入
                  </el-button>
                </span>
              </el-tooltip>
              <el-dropdown
                v-auth="'tenant:hyperlink_data:export'"
                trigger="click"
                @command="
                  command => handleSingleExport(command, asDataPackage(row))
                "
              >
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :icon="useRenderIcon(Download)"
                >
                  导出
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="option in dataPackageExportOptions"
                      :key="option.value"
                      :command="option.value"
                    >
                      {{ option.label }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                v-auth="'tenant:hyperlink_data:edit'"
                size="small"
                type="warning"
                plain
                :icon="useRenderIcon(RefreshRight)"
                :disabled="retryableFailureCount(asDataPackage(row)) === 0"
                @click="resetFailed(asDataPackage(row))"
              >
                重置失败
              </el-button>
              <el-dropdown
                trigger="click"
                @command="command => handleMore(command, asDataPackage(row))"
              >
                <el-button size="small" :icon="useRenderIcon(MoreFilled)">
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-auth="'tenant:hyperlink_data:view'"
                      command="view"
                    >
                      查看号码
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-auth="'tenant:hyperlink_data:edit'"
                      command="rename"
                    >
                      重命名
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-auth="'tenant:hyperlink_data:delete'"
                      command="delete"
                      divided
                    >
                      删除数据包
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
      :submitting="importing"
      @submit="submitImport"
    />
    <DataPackagePhoneDrawer
      v-model="phoneDrawerVisible"
      v-model:page="phonePage"
      v-model:page-size="phonePageSize"
      v-model:phone="phoneFilters.phone"
      :data-package="phoneTarget"
      :error-message="phoneErrorMessage"
      :loading="phoneLoading"
      :rows="phoneRows"
      :total="phoneTotal"
      @refresh="refreshPhoneRows"
      @reset="resetPhoneFilters"
      @search="searchPhoneRows"
    />

    <el-dialog
      v-model="visitTrendVisible"
      :title="`访问趋势 · ${visitTarget?.name ?? '-'}`"
      width="760px"
    >
      <div v-if="visitTarget" class="trend-summary">
        <el-statistic
          title="发送成功"
          :value="
            visitTarget.metrics.sentCount + visitTarget.metrics.deliveredCount
          "
        />
        <el-statistic
          title="双钩"
          :value="visitTarget.metrics.deliveredCount"
        />
        <el-statistic
          title="点击 UV"
          :value="visitTarget.metrics.clickUvCount"
        />
      </div>
      <el-empty description="暂无按时间聚合的访问趋势数据" />
      <el-alert
        type="info"
        :closable="false"
        title="超链任务产生点击明细后，这里将显示访问趋势。"
      />
    </el-dialog>

    <ClickAnalysisDrawer
      v-model="clickAnalysisVisible"
      :countries="countries"
    />
  </div>
</template>

<style scoped>
.data-package-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 500px;
  padding: 0;
}

.data-package-page.main-content {
  margin: 16px !important;
}

.table-actions,
.management-title,
.trend-summary {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-actions {
  flex-wrap: wrap;
}

.management-title strong {
  margin-right: 2px;
  font-size: 16px;
}

.management-table :deep(> .flex) {
  flex-wrap: wrap;
  gap: 10px;
  height: auto;
  min-height: 60px;
}

.package-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.data-package-page :deep(.el-table .cell) {
  overflow: visible;
}

.trend-summary {
  justify-content: space-around;
  margin-bottom: 16px;
}
</style>

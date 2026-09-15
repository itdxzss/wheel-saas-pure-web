<script setup lang="ts">
import { onMounted } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import PackageSearchCard from "./components/PackageSearchCard.vue";
import PackageTable from "./components/PackageTable.vue";
import PackageFormDialog from "./components/PackageFormDialog.vue";
import PackageImportDialog from "./components/PackageImportDialog.vue";
import PackageDetailDrawer from "./components/PackageDetailDrawer.vue";
import PackageExportMenu from "./components/PackageExportMenu.vue";
import { packageTableColumns } from "./domain/package-display";
import { useGroupDataPackagePage } from "./composables/useGroupDataPackagePage";

defineOptions({ name: "GroupDataPackage" });
const columns = packageTableColumns.map(column => ({ ...column }));
const {
  rows,
  selected,
  countries,
  searchForm,
  page,
  pageSize,
  total,
  loading,
  countryLoading,
  errorMessage,
  countryError,
  busyId,
  batchExporting,
  formVisible,
  editing,
  saving,
  importVisible,
  importTarget,
  importing,
  importError,
  importResult,
  resultVisible,
  detailVisible,
  detailTarget,
  detailTab,
  selectedMetrics,
  pageMetrics,
  emptyCount,
  initialize,
  refresh,
  refreshCountries,
  search,
  reset,
  create,
  select,
  save,
  submitImport,
  action,
  exportOne,
  exportSelected,
  exportList
} = useGroupDataPackagePage();
onMounted(() => {
  void initialize();
});
</script>

<template>
  <div class="group-package-page">
    <div class="page-heading">
      <strong>拉群数据包</strong>
      <p>
        管理拉群号码，保留原始顺序与管理员标记；可在新建拉群任务时选择使用。
      </p>
    </div>
    <PackageSearchCard
      v-model="searchForm"
      :countries="countries"
      :country-loading="countryLoading"
      :loading="loading"
      @search="search"
      @reset="reset"
    />
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon
      ><el-button link type="primary" @click="refresh"
        >重试</el-button
      ></el-alert
    >
    <el-alert
      v-if="countryError"
      :title="countryError"
      type="warning"
      :closable="false"
      show-icon
      ><el-button link type="primary" @click="refreshCountries"
        >重试国家选项</el-button
      ></el-alert
    >
    <PureTableBar title="数据包管理" :columns="columns" @refresh="refresh">
      <template #title
        ><div class="management-title">
          <strong>数据包管理</strong
          ><el-tag round size="small" type="info"
            >本页 {{ rows.length }} 个</el-tag
          ><el-tag round size="small" type="success"
            >本页号码 {{ pageMetrics.totalCount.toLocaleString() }}</el-tag
          ><el-tag v-if="emptyCount" round size="small" type="warning"
            >空包 {{ emptyCount }}</el-tag
          >
        </div></template
      >
      <template #buttons
        ><div class="table-actions">
          <el-button
            v-auth="'tenant:group_data_package:create'"
            type="primary"
            @click="create"
            >新建数据包</el-button
          >
          <PackageExportMenu
            :metrics="selectedMetrics"
            size="default"
            :label="
              selected.length
                ? `批量导出号码（已选 ${selected.length}）`
                : '批量导出号码'
            "
            :disabled="
              !selected.length ||
              selectedMetrics.totalCount === 0 ||
              busyId !== null
            "
            :loading="batchExporting"
            @export="exportSelected"
          />
          <el-button
            v-auth="'tenant:group_data_package:export'"
            plain
            :disabled="!rows.length"
            @click="exportList"
            >导出列表 CSV</el-button
          >
        </div></template
      >
      <template #default="{ dynamicColumns }">
        <PackageTable
          :rows="rows"
          :countries="countries"
          :loading="loading"
          :columns="dynamicColumns"
          :busy-id="busyId"
          @select="select"
          @action="action"
          @export="exportOne"
        />
        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          @change="refresh"
        />
      </template>
    </PureTableBar>
    <PackageFormDialog
      v-model="formVisible"
      :target="editing"
      :saving="saving"
      @save="save"
    />
    <PackageImportDialog
      v-model="importVisible"
      :target="importTarget"
      :saving="importing"
      :server-error="importError"
      @submit="submitImport"
    />
    <PackageDetailDrawer
      v-model="detailVisible"
      :target="detailTarget"
      :initial-tab="detailTab"
    />
    <el-dialog v-model="resultVisible" title="导入结果" width="580px">
      <template v-if="importResult">
        <el-alert
          :title="`导入已完成，实际新增 ${importResult.acceptedRows.toLocaleString()} 个号码`"
          type="success"
          :closable="false"
          show-icon
        />
        <el-descriptions :column="2" border class="result-metrics">
          <el-descriptions-item label="原始行">{{
            importResult.totalRows.toLocaleString()
          }}</el-descriptions-item>
          <el-descriptions-item label="实际新增">{{
            importResult.acceptedRows.toLocaleString()
          }}</el-descriptions-item>
          <el-descriptions-item label="重复">{{
            importResult.duplicatedRows.toLocaleString()
          }}</el-descriptions-item>
          <el-descriptions-item label="格式错误">{{
            importResult.invalidRows.toLocaleString()
          }}</el-descriptions-item>
          <el-descriptions-item label="隐私过滤">{{
            importResult.privacyFilteredRows.toLocaleString()
          }}</el-descriptions-item>
          <el-descriptions-item label="包内总量">{{
            importResult.phoneCountAfterImport.toLocaleString()
          }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer
        ><el-button type="primary" @click="resultVisible = false"
          >完成</el-button
        ></template
      >
    </el-dialog>
  </div>
</template>

<style scoped>
.group-package-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-heading strong {
  font-size: 20px;
}

.page-heading p {
  margin: 7px 0 0;
  color: var(--el-text-color-secondary);
}

.management-title,
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.result-metrics {
  margin-top: 18px;
}
</style>

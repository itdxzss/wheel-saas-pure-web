<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { IpManageRow } from "@/api/resource-ip-mapping";
import { useResourceIpPage } from "./composables/useResourceIpPage";
import IpCheckResultDialog from "./components/IpCheckResultDialog.vue";
import IpImportDialog from "./components/IpImportDialog.vue";
import IpImportSampleCheckDialog from "./components/IpImportSampleCheckDialog.vue";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Upload from "~icons/ep/upload";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "ResourceIp"
});

const {
  activeCheckRow,
  batchChecking,
  canSubmitImport,
  checkDialogErrorMessage,
  checkDialogLoading,
  checkResults,
  checkingRowIds,
  columns,
  countryOptions,
  countryOptionLabel,
  deleting,
  errorMessage,
  guideCollapsed,
  importCheckErrors,
  importCheckPassed,
  importCheckResult,
  importChecking,
  importErrors,
  importForm,
  importing,
  loading,
  page,
  pageSize,
  proxyTypeOptions,
  rows,
  searchForm,
  selectedRows,
  showCheckResultDialog,
  showImportDialog,
  showImportSampleCheckDialog,
  total,
  uploadFiles,
  checkSelectedIps,
  checkSingleIp,
  deleteSelectedIps,
  onSelectionChange,
  openImportDialog,
  refreshIpList,
  rerunActiveCheck,
  rerunImportSampleCheck,
  resetSearchForm,
  autoSampleCheckImport,
  sampleCheckImport,
  searchIpList,
  submitImport
} = useResourceIpPage();

function checkTableRow(row: unknown): void {
  // 传整行给 composable,弹框才能在接口返回前立即展示代理地址、来源和协议。
  void checkSingleIp(row as IpManageRow);
}
</script>

<template>
  <div class="ip-manage-page">
    <el-card class="ip-guide-card ip-manage-section" shadow="never">
      <div class="ip-guide-head">
        <div>
          <div class="ip-guide-title">温馨提示：</div>
          <div v-show="!guideCollapsed" class="ip-guide-sub">
            TXT
            导入需先手选国家并完成抽样检测；检测结果只判断代理可用性，不会覆盖已选择的国家。
          </div>
        </div>
        <el-button
          link
          type="primary"
          @click="guideCollapsed = !guideCollapsed"
        >
          {{ guideCollapsed ? "展开" : "收起" }}
        </el-button>
      </div>

      <div v-show="!guideCollapsed" class="ip-guide-body">
        <div class="ip-provider-grid">
          <div class="ip-provider-card ipidea-card">
            <div class="ip-provider-brand">
              <span class="ip-provider-logo">I</span>
              <span>ipidea</span>
            </div>
            <div class="ip-provider-desc">
              <span>提示：</span><strong>官网需在国内网络环境下访问。</strong>
            </div>
            <div class="ip-provider-line">
              <span>官网：</span><strong>https://grassdata.net</strong>
            </div>
          </div>

          <div class="ip-provider-card">
            <div class="ip-provider-brand">
              <span class="ip-provider-logo">T</span>
              <span>Thordata</span>
            </div>
            <div class="ip-provider-line">
              <span>官网：</span><strong>www.thordata.com</strong>
            </div>
          </div>
        </div>

        <el-alert
          class="ip-recommend-alert"
          type="success"
          :closable="false"
          show-icon
        >
          <template #title>
            <span class="ip-recommend-product">WhatsApp</span>
            <el-tag class="ml-2" size="small" type="success">推荐</el-tag>
            <span class="ml-2">
              优先推荐您使用目标国家的 HTTP 住宅动态 IP，粘性 10 分钟或 15
              分钟均可。
            </span>
          </template>
        </el-alert>
      </div>
    </el-card>

    <div class="ip-manage-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="国家">
          <el-select
            v-model="searchForm.country"
            clearable
            filterable
            placeholder="请选择国家"
            class="ip-filter-control"
          >
            <el-option
              v-for="country in countryOptions"
              :key="country.value"
              :label="countryOptionLabel(country)"
              :value="country.value"
            >
              <span class="ip-country-option">
                <span>{{ country.flag }}</span>
                <span>{{ country.nameZh }}</span>
                <span v-if="country.phonePrefix" class="ip-country-prefix">
                  {{ country.phonePrefix }}
                </span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.proxyType"
            clearable
            placeholder="全部类型"
            class="ip-filter-control ip-filter-control--sm"
          >
            <el-option
              v-for="type in proxyTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="IP来源（二期）">
          <el-input
            v-model="searchForm.source"
            clearable
            placeholder="请输入来源"
            class="ip-filter-control"
            @keyup.enter="searchIpList"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchIpList"
          >
            搜索
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-alert
      v-if="errorMessage"
      class="ip-manage-error"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    />

    <PureTableBar title="IP 管理" :columns="columns" @refresh="refreshIpList">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportDialog"
        >
          TXT 批量导入
        </el-button>
        <el-button
          type="danger"
          plain
          :loading="deleting"
          :disabled="selectedRows.length === 0"
          :icon="useRenderIcon(Delete)"
          @click="deleteSelectedIps"
        >
          批量删除
        </el-button>
        <el-button
          plain
          :loading="batchChecking"
          :disabled="selectedRows.length === 0 || checkingRowIds.size > 0"
          :icon="useRenderIcon(Search)"
          @click="checkSelectedIps"
        >
          批量检测
        </el-button>
      </template>

      <template #default="{ dynamicColumns }">
        <el-table
          v-loading="loading"
          :data="rows"
          row-key="id"
          border
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="country"
            label="国家"
            width="130"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            prop="proxyType"
            label="类型"
            width="110"
          >
            <template #default="{ row }">
              <el-tag size="small" type="info">
                {{ row.proxyType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="proxyAddress"
            label="代理地址"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="username"
            label="用户名"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            prop="password"
            label="密码"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="source"
            label="IP来源（二期）"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="validAccountCount"
            label="有效账号"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="createdAt"
            label="创建时间"
            width="180"
          />
          <el-table-column label="操作" fixed="right" width="100">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                :loading="checkingRowIds.has(row.id)"
                :disabled="
                  batchChecking ||
                  (checkingRowIds.size > 0 && !checkingRowIds.has(row.id))
                "
                @click="checkTableRow(row)"
              >
                检测
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无 IP 数据" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          @change="refreshIpList"
        />
      </template>
    </PureTableBar>

    <IpImportDialog
      v-model="showImportDialog"
      v-model:form="importForm"
      v-model:upload-files="uploadFiles"
      :can-submit-import="canSubmitImport"
      :country-option-label="countryOptionLabel"
      :country-options="countryOptions"
      :import-check-errors="importCheckErrors"
      :import-check-passed="importCheckPassed"
      :import-checking="importChecking"
      :import-errors="importErrors"
      :importing="importing"
      :proxy-type-options="proxyTypeOptions"
      @file-selected="autoSampleCheckImport"
      @sample-check="sampleCheckImport"
      @submit="submitImport"
    />

    <IpCheckResultDialog
      v-model="showCheckResultDialog"
      :active-row="activeCheckRow"
      :error-message="checkDialogErrorMessage"
      :loading="checkDialogLoading"
      :results="checkResults"
      @rerun="rerunActiveCheck"
    />

    <IpImportSampleCheckDialog
      v-model="showImportSampleCheckDialog"
      :loading="importChecking"
      :result="importCheckResult"
      @rerun="rerunImportSampleCheck"
    />
  </div>
</template>

<style scoped>
.ip-manage-page {
  padding: 16px;
}

.ip-manage-section {
  margin-bottom: 8px;
}

.ip-guide-card {
  background: #f5fbff;
  border-color: #d8ecff;
}

.ip-guide-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.ip-guide-title {
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ip-guide-sub {
  margin-top: 6px;
  color: var(--el-text-color-regular);
}

.ip-guide-body {
  margin-top: 10px;
}

.ip-provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}

.ip-provider-card {
  min-height: 84px;
  padding: 12px;
  background: #fff;
  border: 1px solid #dceaf6;
  border-radius: 8px;
}

.ipidea-card {
  background: #f4f7fb;
}

.ip-provider-brand {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 700;
}

.ip-provider-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.ip-provider-desc,
.ip-provider-line {
  color: var(--el-text-color-regular);
}

.ip-recommend-alert {
  margin-top: 12px;
}

.ip-recommend-product {
  font-weight: 700;
}

.ip-manage-error {
  margin-bottom: 12px;
}

.ip-manage-search {
  padding: 16px 16px 0;
  margin-bottom: 8px;
  border-radius: 4px;
}

.ip-manage-search :deep(.el-form-item) {
  margin-right: 16px;
  margin-bottom: 16px;
}

.ip-filter-control {
  width: 180px;
}

.ip-country-option {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.ip-country-prefix {
  color: var(--el-text-color-secondary);
}

.ip-filter-control--sm {
  width: 140px;
}
</style>

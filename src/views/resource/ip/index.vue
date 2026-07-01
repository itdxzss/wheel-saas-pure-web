<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useResourceIpPage } from "./composables/useResourceIpPage";
import IpCheckResultDialog from "./components/IpCheckResultDialog.vue";
import IpImportDialog from "./components/IpImportDialog.vue";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import Upload from "~icons/ep/upload";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "ResourceIp"
});

const {
  allocationModeOptions,
  batchChecking,
  checkResults,
  checkingRowIds,
  columns,
  countryOptions,
  countryOptionLabel,
  deleting,
  errorMessage,
  guideCollapsed,
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
  total,
  uploadFiles,
  checkSelectedIps,
  checkSingleIp,
  deleteSelectedIps,
  onSelectionChange,
  openImportDialog,
  refreshIpList,
  resetSearchForm,
  searchIpList,
  submitImport
} = useResourceIpPage();

/** 后端状态码:1=空闲,2=使用中,3=不可用。颜色只做扫描辅助,不改变业务状态。 */
function statusTagType(status: number | null): "success" | "warning" | "danger" | "info" {
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status === 3) return "danger";
  return "info";
}

/** 分配方式是导入策略:smart 会按检测国家落池,mixed 直接进入混合分组。 */
function allocationTagType(mode: string): "primary" | "warning" | "info" {
  if (mode === "smart") return "primary";
  if (mode === "mixed") return "warning";
  return "info";
}
</script>

<template>
  <div class="ip-manage-page">
    <el-card class="ip-guide-card ip-manage-section" shadow="never">
      <div class="ip-guide-head">
        <div>
          <div class="ip-guide-title">温馨提示：</div>
          <div v-show="!guideCollapsed" class="ip-guide-sub">
            TXT 导入不再手选国家：智能分配会检测出口国家并落对应国家，混合分组会直接进入混合分组；建议保留混合分组兜底，避免账号缺少可用
            IP。
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
        <el-form-item label="来源">
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
          :disabled="selectedRows.length === 0"
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
            prop="statusLabel"
            label="状态"
            width="110"
          >
            <template #default="{ row }">
              <el-tag size="small" :type="statusTagType(row.status)">
                {{ row.statusLabel || row.status || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            prop="allocationModeLabel"
            label="分配方式"
            width="130"
          >
            <template #default="{ row }">
              <el-tag size="small" :type="allocationTagType(row.allocationMode)">
                {{ row.allocationModeLabel || row.allocationMode || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
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
            v-if="!dynamicColumns[4].hide"
            prop="proxyAddress"
            label="代理地址"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            prop="username"
            label="用户名"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            prop="password"
            label="密码"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[7].hide"
            prop="validAccountCount"
            label="有效账号"
            width="110"
          />
          <el-table-column
            v-if="!dynamicColumns[8].hide"
            prop="source"
            label="来源"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column
            v-if="!dynamicColumns[9].hide"
            prop="lastSampleCheckAt"
            label="最近检测"
            width="180"
          />
          <el-table-column
            v-if="!dynamicColumns[10].hide"
            prop="checkFailCount"
            label="失败次数"
            width="100"
          />
          <el-table-column
            v-if="!dynamicColumns[11].hide"
            prop="lastCheckError"
            label="错误原因"
            min-width="180"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ row.lastCheckError || "-" }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[12].hide"
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
                @click="checkSingleIp(row.id)"
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
      :allocation-mode-options="allocationModeOptions"
      :import-errors="importErrors"
      :importing="importing"
      :proxy-type-options="proxyTypeOptions"
      @submit="submitImport"
    />

    <IpCheckResultDialog
      v-model="showCheckResultDialog"
      :results="checkResults"
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

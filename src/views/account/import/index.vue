<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AccountImportDetailDrawer from "./components/AccountImportDetailDrawer.vue";
import AccountImportDrawer from "./components/AccountImportDrawer.vue";
import AccountImportTable from "./components/AccountImportTable.vue";
import {
  accountImportColumns,
  accountTypeOptions,
  deviceOptions,
  importTypeOptions,
  loginOptions,
  statusOptions
} from "./constants";
import { useAccountImportPage } from "./composables/useAccountImportPage";
import type { AccountImportSubmitPayload } from "./types";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "AccountImport"
});

const {
  accountGroups,
  changeDetailStatus,
  createImportAccountGroup,
  detailFailReasons,
  detailFilter,
  detailLoading,
  detailPage,
  detailPageSize,
  detailRows,
  detailTask,
  detailTotal,
  exportTask,
  exportingTaskId,
  groupLoading,
  ipRegionOptions,
  loadDetail,
  loading,
  openDetailDrawer,
  page,
  pageSize,
  refreshAccountImportList,
  resetSearchForm,
  rows,
  searchAccountImports,
  searchForm,
  showAdvancedSearch,
  showDetailDrawer,
  showImportDrawer,
  submitImport,
  submittingImport,
  total
} = useAccountImportPage();

async function handleSubmitImport(
  payload: AccountImportSubmitPayload
): Promise<void> {
  const ok = await submitImport(payload);
  if (ok) showImportDrawer.value = false;
}
</script>

<template>
  <div class="account-import-page">
    <div class="account-import-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="ID / 来源文件">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="account-import-keyword"
            placeholder="请输入 ID / 来源文件"
            @keyup.enter="searchAccountImports"
          />
        </el-form-item>
        <el-form-item label="导入类型">
          <el-select
            v-model="searchForm.importType"
            clearable
            placeholder="全部类型"
            class="account-import-control"
          >
            <el-option
              v-for="item in importTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分组">
          <el-select
            v-model="searchForm.group"
            clearable
            filterable
            :loading="groupLoading"
            placeholder="全部分组"
            class="account-import-control"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchAccountImports"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
          <el-button @click="showAdvancedSearch = !showAdvancedSearch">
            {{ showAdvancedSearch ? "收起搜索条件" : "展示全部搜索条件" }}
          </el-button>
        </el-form-item>
      </el-form>

      <el-form
        v-show="showAdvancedSearch"
        class="account-import-advanced"
        :model="searchForm"
        inline
      >
        <el-form-item label="机型">
          <el-select
            v-model="searchForm.device"
            clearable
            placeholder="全部机型"
            class="account-import-control"
          >
            <el-option
              v-for="item in deviceOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号类型">
          <el-select
            v-model="searchForm.accountType"
            clearable
            placeholder="全部账号类型"
            class="account-import-control"
          >
            <el-option
              v-for="item in accountTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="登录结果">
          <el-select
            v-model="searchForm.login"
            clearable
            placeholder="全部登录结果"
            class="account-import-control"
          >
            <el-option
              v-for="item in loginOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            clearable
            placeholder="全部状态"
            class="account-import-control"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <AccountImportTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="accountImportColumns"
      :exporting-task-id="exportingTaskId"
      :loading="loading"
      :rows="rows"
      :total="total"
      @create="showImportDrawer = true"
      @detail="openDetailDrawer"
      @export="exportTask"
      @refresh="refreshAccountImportList"
    />

    <AccountImportDrawer
      v-model="showImportDrawer"
      :groups="accountGroups"
      :group-loading="groupLoading"
      :ip-regions="ipRegionOptions"
      :submitting="submittingImport"
      :create-group="createImportAccountGroup"
      @submit="handleSubmitImport"
    />

    <AccountImportDetailDrawer
      v-model="showDetailDrawer"
      v-model:page="detailPage"
      v-model:page-size="detailPageSize"
      :detail-rows="detailRows"
      :fail-reasons="detailFailReasons"
      :loading="detailLoading"
      :status-filter="detailFilter"
      :task="detailTask"
      :total="detailTotal"
      @export="exportTask"
      @filter-change="changeDetailStatus"
      @refresh="loadDetail"
    />
  </div>
</template>

<style scoped>
.account-import-page {
  padding: 16px;
}

.account-import-search {
  padding: 16px 16px 8px;
  margin-bottom: 8px;
}

.account-import-keyword {
  width: 220px;
}

.account-import-control {
  width: 180px;
}

.account-import-advanced {
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>

<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AccountListTable from "./components/AccountListTable.vue";
import { accountListColumns } from "./constants";
import { useAccountListPage } from "./composables/useAccountListPage";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "AccountIndex"
});

const {
  accountGroups,
  accountStatusOptions,
  batchMoveForm,
  groupLoading,
  handleBatchAction,
  handleRowAction,
  isOnlineActionDisabled,
  loading,
  onlineActionLabel,
  onSelectionChange,
  page,
  pageSize,
  refreshAccountList,
  resetSearchForm,
  riskStatusOptions,
  rows,
  searchAccounts,
  searchForm,
  selectedCount,
  showAdvancedSearch,
  showBatchMoveDrawer,
  statCards,
  submitBatchMove,
  total
} = useAccountListPage();
</script>

<template>
  <div class="account-list-page">
    <div class="account-list-stats">
      <el-card
        v-for="card in statCards"
        :key="card.key"
        class="account-stat-card"
        shadow="never"
      >
        <el-statistic :value="card.value">
          <template #title>
            <span>{{ card.label }}</span>
          </template>
        </el-statistic>
      </el-card>
    </div>

    <div class="account-list-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="account-search-main"
            placeholder="账号 / 国家 / 协议 / 备注 / 分组 / 状态搜索"
            @keyup.enter="searchAccounts"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchAccounts"
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
            {{ showAdvancedSearch ? "收起高级搜索" : "展开高级搜索" }}
          </el-button>
        </el-form-item>
      </el-form>

      <el-form
        v-show="showAdvancedSearch"
        class="account-advanced-search"
        :model="searchForm"
        inline
      >
        <el-form-item label="账号">
          <el-input
            v-model="searchForm.phone"
            clearable
            placeholder="请输入账号"
          />
        </el-form-item>
        <el-form-item label="风控状态">
          <el-select
            v-model="searchForm.riskStatus"
            clearable
            placeholder="请选择风控状态"
          >
            <el-option
              v-for="item in riskStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select
            v-model="searchForm.accountStatus"
            clearable
            placeholder="请选择账号状态"
          >
            <el-option
              v-for="item in accountStatusOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="IP分组">
          <el-input
            v-model="searchForm.ipGroupName"
            clearable
            placeholder="请输入IP分组"
          />
        </el-form-item>
        <el-form-item label="绑定分组">
          <el-select
            v-model="searchForm.groupId"
            clearable
            filterable
            :loading="groupLoading"
            placeholder="选择绑定分组"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-input
            v-model="searchForm.country"
            clearable
            placeholder="请输入国家"
          />
        </el-form-item>
        <el-form-item label="绑定客服">
          <el-input
            v-model="searchForm.assignedService"
            clearable
            placeholder="请输入绑定客服"
          />
        </el-form-item>
      </el-form>
    </div>

    <AccountListTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="accountListColumns"
      :loading="loading"
      :online-action-disabled="isOnlineActionDisabled"
      :online-action-label="onlineActionLabel"
      :rows="rows"
      :selected-count="selectedCount"
      :total="total"
      @batch-command="handleBatchAction"
      @refresh="refreshAccountList"
      @row-action="handleRowAction"
      @selection-change="onSelectionChange"
    />

    <el-drawer
      v-model="showBatchMoveDrawer"
      title="迁移到分组"
      size="520px"
      destroy-on-close
    >
      <el-alert
        class="account-batch-alert"
        type="info"
        show-icon
        :closable="false"
        :title="`已选择 ${selectedCount} 个账号。任务中的账号后端会跳过。`"
      />
      <el-form :model="batchMoveForm" label-position="top">
        <el-form-item label="目标分组" required>
          <el-select
            v-model="batchMoveForm.groupId"
            filterable
            clearable
            placeholder="请选择目标分组"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="batchMoveForm.remark"
            type="textarea"
            :rows="4"
            placeholder="可记录本次迁移原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchMoveDrawer = false">取消</el-button>
        <el-button type="primary" @click="submitBatchMove">确认迁移</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.account-list-page {
  padding: 16px;
}

.account-list-stats {
  display: grid;
  grid-template-columns: repeat(7, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.account-stat-card {
  border-radius: 6px;
}

.account-list-search {
  padding: 16px 16px 0;
  margin-bottom: 8px;
}

.account-list-search :deep(.el-form-item) {
  margin-bottom: 16px;
}

.account-search-main {
  width: 420px;
}

.account-advanced-search {
  padding-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.account-advanced-search :deep(.el-input),
.account-advanced-search :deep(.el-select) {
  width: 190px;
}

.account-batch-alert {
  margin-bottom: 16px;
}

@media (max-width: 1280px) {
  .account-list-stats {
    grid-template-columns: repeat(4, minmax(120px, 1fr));
  }
}
</style>

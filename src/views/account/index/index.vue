<script setup lang="ts">
import { useRouter } from "vue-router";
import type { AccountGroupMarketingOccupancy } from "@/api/account-group";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AccountListTable from "./components/AccountListTable.vue";
import MarketingOccupancyDialog from "./components/MarketingOccupancyDialog.vue";
import { accountListColumns } from "./constants";
import { useAccountListPage } from "./composables/useAccountListPage";
import {
  marketingOccupancyOptions,
  occupiedBusinessTypeOptions
} from "./marketing-occupancy";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "AccountIndex"
});

const router = useRouter();

const {
  accountGroups,
  accountStatusOptions,
  accountTypeOptions,
  batchOnlineCooldownRemaining,
  batchSubmitting,
  batchMoveForm,
  batchMoveModeOptions,
  groupLoading,
  handleBatchAction,
  handleRowAction,
  isOnlineActionDisabled,
  loginStateOptions,
  loading,
  marketingOccupancyDetail,
  marketingOccupancyDialogOpen,
  marketingOccupancyLoading,
  numberSourceOptions,
  onlineActionLabel,
  openMarketingOccupancy,
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
  takeoverBatchDisabled,
  takeoverBatchTip,
  total,
  wsExporting
} = useAccountListPage();

/** 仅已接入详情页的任务类型支持从占用弹窗跳转。 */
function openOccupancyTask(detail: AccountGroupMarketingOccupancy): void {
  if (!detail.taskId) return;
  if (detail.taskBusinessType === 1) {
    marketingOccupancyDialogOpen.value = false;
    void router.push({
      path: "/task/group-marketing",
      query: { taskId: String(detail.taskId) }
    });
    return;
  }
  if (detail.taskBusinessType === 2) {
    marketingOccupancyDialogOpen.value = false;
    void router.push(`/task/group-pull-marketing/${detail.taskId}`);
  }
}
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
        <div v-if="card.subItems?.length" class="account-stat-breakdown">
          <span v-for="item in card.subItems" :key="item.label">
            {{ item.label }} {{ item.value }}
          </span>
        </div>
      </el-card>
    </div>

    <div class="account-list-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="account-search-main"
            placeholder="账号前缀 / 备注搜索"
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
            placeholder="请输入账号前缀"
          />
        </el-form-item>
        <el-form-item label="账号类型">
          <el-select
            v-model="searchForm.accountType"
            clearable
            placeholder="请选择账号类型"
          >
            <el-option
              v-for="item in accountTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="协议">
          <el-input
            v-model="searchForm.protocolId"
            clearable
            placeholder="请输入协议标识"
          />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input
            v-model="searchForm.truthIp"
            clearable
            placeholder="请输入IP地址"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-input
            v-model="searchForm.channelName"
            clearable
            placeholder="请输入渠道"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select
            v-model="searchForm.numberSource"
            clearable
            placeholder="请选择来源"
          >
            <el-option
              v-for="item in numberSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="登录状态">
          <el-select
            v-model="searchForm.loginState"
            clearable
            placeholder="请选择登录状态"
          >
            <el-option
              v-for="item in loginStateOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
        <el-form-item label="营销占用类型">
          <el-select
            v-model="searchForm.marketingOccupancyType"
            clearable
            placeholder="请选择占用类型"
          >
            <el-option
              v-for="item in marketingOccupancyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <span
                class="occupancy-option-dot"
                :style="{ backgroundColor: item.color }"
              />
              {{ item.label }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="占用任务">
          <el-input
            v-model="searchForm.occupiedTaskKeyword"
            clearable
            placeholder="任务ID / 任务名称"
          />
        </el-form-item>
        <el-form-item label="占用任务类型">
          <el-select
            v-model="searchForm.occupiedBusinessType"
            clearable
            placeholder="请选择任务类型"
          >
            <el-option
              v-for="item in occupiedBusinessTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="可调用状态">
          <el-select
            v-model="searchForm.callable"
            clearable
            placeholder="请选择可调用状态"
          >
            <el-option label="可调用" :value="true" />
            <el-option label="不可调用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP分组">
          <el-input
            v-model="searchForm.ipGroupName"
            clearable
            disabled
            placeholder="暂未接入"
          />
        </el-form-item>
        <el-form-item label="绑定客服">
          <el-input
            v-model="searchForm.assignedService"
            clearable
            disabled
            placeholder="暂未接入"
          />
        </el-form-item>
      </el-form>
    </div>

    <AccountListTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="accountListColumns"
      :batch-online-cooldown-remaining="batchOnlineCooldownRemaining"
      :batch-submitting="batchSubmitting"
      :loading="loading"
      :online-action-disabled="isOnlineActionDisabled"
      :online-action-label="onlineActionLabel"
      :rows="rows"
      :selected-count="selectedCount"
      :takeover-batch-disabled="takeoverBatchDisabled"
      :takeover-batch-tip="takeoverBatchTip"
      :total="total"
      :ws-exporting="wsExporting"
      @batch-command="handleBatchAction"
      @group-click="openMarketingOccupancy"
      @refresh="refreshAccountList"
      @row-action="handleRowAction"
      @selection-change="onSelectionChange"
    />

    <MarketingOccupancyDialog
      v-model="marketingOccupancyDialogOpen"
      :detail="marketingOccupancyDetail"
      :loading="marketingOccupancyLoading"
      @task-click="openOccupancyTask"
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
        :title="`已选择 ${selectedCount} 个账号。确认后将批量迁移到目标分组。`"
      />
      <el-form :model="batchMoveForm" label-position="top">
        <el-form-item label="迁移方式">
          <el-segmented
            v-model="batchMoveForm.mode"
            :options="batchMoveModeOptions"
          />
        </el-form-item>
        <el-form-item
          v-if="batchMoveForm.mode === 'existing'"
          label="目标分组"
          required
        >
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
        <el-form-item v-else label="新分组名称" required>
          <el-input
            v-model="batchMoveForm.newGroupName"
            clearable
            maxlength="64"
            show-word-limit
            placeholder="请输入新分组名称"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="batchMoveForm.remark"
            type="textarea"
            :rows="4"
            :placeholder="
              batchMoveForm.mode === 'new'
                ? '可填写新分组备注'
                : '已有分组迁移不记录备注'
            "
            :disabled="batchMoveForm.mode === 'existing'"
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
  grid-template-columns: repeat(8, minmax(112px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.account-stat-card {
  border-radius: 6px;
}

.account-stat-breakdown {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 8px;
  margin-top: 6px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
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

.occupancy-option-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 8px;
  border-radius: 50%;
}

@media (width <= 1280px) {
  .account-list-stats {
    grid-template-columns: repeat(4, minmax(120px, 1fr));
  }
}

@media (width <= 640px) {
  .account-list-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

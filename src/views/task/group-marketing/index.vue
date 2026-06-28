<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import GroupMarketingCreateDrawer from "./components/GroupMarketingCreateDrawer.vue";
import GroupMarketingDetailDrawer from "./components/GroupMarketingDetailDrawer.vue";
import GroupMarketingMaterialDrawer from "./components/GroupMarketingMaterialDrawer.vue";
import GroupMarketingTaskTable from "./components/GroupMarketingTaskTable.vue";
import { taskColumns, taskStatusOptions } from "./constants";
import { useGroupMarketingTaskPage } from "./composables/useGroupMarketingTaskPage";
import type { MarketingTaskRow } from "@/api/marketing-task";

defineOptions({
  name: "TaskGroupMarketing"
});

const {
  accountGroups,
  activeTask,
  advancedOpen,
  createDrawerOpen,
  createForm,
  createTask,
  deleteSelected,
  detailDrawerOpen,
  detailLoading,
  detailTask,
  loadAccountTree,
  loading,
  materialDrawerOpen,
  materialForm,
  materialSubmitting,
  marketingTemplates,
  onSelectionChange,
  openCreateDrawer,
  openDetailDrawer,
  openMaterialDrawer,
  page,
  pageSize,
  refreshTasks,
  resetSearchForm,
  rows,
  searchForm,
  searchTasks,
  selectedCount,
  startTask,
  stopTask,
  submitMaterialUpdate,
  toggleAdvanced,
  total,
  treeAccounts,
  treeLoading
} = useGroupMarketingTaskPage();

function onTaskAction(row: MarketingTaskRow, action: string): void {
  if (action === "detail") {
    void openDetailDrawer(row);
    return;
  }
  if (action === "stop") {
    void stopTask(row);
    return;
  }
  if (action === "start") {
    void startTask(row);
    return;
  }
  if (action === "material") {
    void openMaterialDrawer(row);
  }
}
</script>

<template>
  <div
    class="group-marketing-page"
    aria-label="群组营销任务"
    data-primary-action="新增群组营销任务"
    data-batch-action="批量删除"
  >
    <div class="group-marketing-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="ID">
          <el-input
            v-model="searchForm.id"
            clearable
            class="search-id"
            placeholder="精准 ID"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="search-keyword"
            placeholder="输入任务名称关键词"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="发送状态">
          <el-select
            v-model="searchForm.status"
            clearable
            class="search-select"
            placeholder="全部状态"
          >
            <el-option
              v-for="option in taskStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="最后发送时间">
          <div class="time-range">
            <el-date-picker
              v-model="searchForm.startTime"
              type="datetime"
              value-format="x"
              placeholder="开始时间"
            />
            <span>至</span>
            <el-date-picker
              v-model="searchForm.endTime"
              type="datetime"
              value-format="x"
              placeholder="结束时间"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchTasks"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
          <el-button text type="primary" @click="toggleAdvanced">
            {{ advancedOpen ? "收起搜索条件" : "展开搜索条件" }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <GroupMarketingTaskTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="taskColumns"
      :loading="loading"
      :rows="rows"
      :selected-count="selectedCount"
      :total="total"
      @create="openCreateDrawer"
      @delete-selected="deleteSelected"
      @refresh="refreshTasks"
      @row-action="onTaskAction"
      @selection-change="onSelectionChange"
    />

    <GroupMarketingCreateDrawer
      v-model="createDrawerOpen"
      v-model:form="createForm"
      :account-groups="accountGroups"
      :marketing-templates="marketingTemplates"
      :tree-accounts="treeAccounts"
      :tree-loading="treeLoading"
      @account-group-change="loadAccountTree"
      @submit="createTask"
    />

    <GroupMarketingDetailDrawer
      v-model="detailDrawerOpen"
      :detail="detailTask"
      :loading="detailLoading"
    />

    <GroupMarketingMaterialDrawer
      v-model="materialDrawerOpen"
      v-model:form="materialForm"
      :task="activeTask"
      :submitting="materialSubmitting"
      @submit="submitMaterialUpdate"
    />
  </div>
</template>

<style scoped>
.group-marketing-page {
  min-height: 100%;
}

.group-marketing-search {
  padding: 16px 16px 0;
  margin-bottom: 16px;
}

.group-marketing-search :deep(.el-form-item) {
  margin-bottom: 16px;
}

.search-id {
  width: 130px;
}

.search-keyword {
  width: 220px;
}

.search-select {
  width: 150px;
}

.time-range {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>

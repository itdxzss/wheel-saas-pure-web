<script setup lang="ts">
import { onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import GroupCreationMarketingCreateDrawer from "./components/GroupCreationMarketingCreateDrawer.vue";
import GroupCreationMarketingDetailDrawer from "./components/GroupCreationMarketingDetailDrawer.vue";
import GroupCreationMarketingTaskTable from "./components/GroupCreationMarketingTaskTable.vue";
import { taskColumns, taskStatusOptions } from "./constants";
import { useGroupCreationMarketingPage } from "./composables/useGroupCreationMarketingPage";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

defineOptions({
  name: "TaskGroupCreationMarketing"
});

const {
  accountGroups,
  accountGroupUsableCounts,
  accounts,
  addMaterialFiles,
  createDrawerOpen,
  createBlockReason,
  createForm,
  detailDrawerOpen,
  detailLoading,
  detailTask,
  exporting,
  exportSelectedTasks,
  loadAccounts,
  loading,
  marketingTemplates,
  matchRows,
  materialFiles,
  openCreateDrawer,
  openDetailDrawer,
  onSelectionChange,
  page,
  pageSize,
  removeMaterialFile,
  resetSearchForm,
  rows,
  searchForm,
  searchTasks,
  selectedCount,
  stopTask,
  submitCreate,
  total,
  unmatchedFiles,
  loadTasks
} = useGroupCreationMarketingPage();

onMounted(() => {
  void loadTasks();
});
</script>

<template>
  <div
    class="group-creation-marketing-page"
    aria-label="建群营销"
    data-primary-action="新增建群营销"
  >
    <div class="page-search bg-bg_color">
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
        <el-form-item label="任务状态">
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
        </el-form-item>
      </el-form>
    </div>

    <GroupCreationMarketingTaskTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="taskColumns"
      :exporting="exporting"
      :loading="loading"
      :rows="rows"
      :selected-count="selectedCount"
      :total="total"
      @create="openCreateDrawer"
      @detail="openDetailDrawer"
      @export-selected="exportSelectedTasks"
      @refresh="loadTasks"
      @selection-change="onSelectionChange"
      @stop="stopTask"
    />

    <GroupCreationMarketingCreateDrawer
      v-model="createDrawerOpen"
      v-model:form="createForm"
      :account-groups="accountGroups"
      :account-group-usable-counts="accountGroupUsableCounts"
      :accounts="accounts"
      :marketing-templates="marketingTemplates"
      :material-files="materialFiles"
      :match-rows="matchRows"
      :unmatched-files="unmatchedFiles"
      :create-block-reason="createBlockReason"
      @account-group-change="loadAccounts"
      @files-add="addMaterialFiles"
      @remove-file="removeMaterialFile"
      @submit="submitCreate"
    />

    <GroupCreationMarketingDetailDrawer
      v-model="detailDrawerOpen"
      :detail="detailTask"
      :loading="detailLoading"
    />
  </div>
</template>

<style scoped>
.group-creation-marketing-page {
  min-height: 100%;
}

.page-search {
  padding: 16px 16px 0;
  margin-bottom: 16px;
}

.page-search :deep(.el-form-item) {
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
</style>

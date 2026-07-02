<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import JoinTaskDetailDrawer from "./components/JoinTaskDetailDrawer.vue";
import JoinTaskEditorDrawer from "./components/JoinTaskEditorDrawer.vue";
import JoinTaskTable from "./components/JoinTaskTable.vue";
import {
  joinTaskColumns,
  joinTaskDistributionOptions,
  joinTaskStatusOptions
} from "./constants";
import { useJoinTaskPage } from "./composables/useJoinTaskPage";
import type { JoinTaskRow } from "@/api/join-task";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

defineOptions({
  name: "TaskJoin"
});

const {
  accountGroups,
  accountKeyword,
  accountOptions,
  accountsLoading,
  advancedOpen,
  deleteSelected,
  detailDrawerOpen,
  detailLoading,
  detailResults,
  detailTask,
  editorDrawerOpen,
  editorForm,
  editorLoading,
  editorMode,
  intervalOptions,
  loading,
  onSelectionChange,
  onlyAvailable,
  onlyOnline,
  openCopyDrawer,
  openCreateDrawer,
  openDetailDrawer,
  openEditDrawer,
  page,
  pageSize,
  refreshTasks,
  resetSearchForm,
  rows,
  searchForm,
  searchTasks,
  selectedCount,
  startTask,
  submitEditor,
  total,
  toggleAdvanced
} = useJoinTaskPage();

function runRowAction(
  row: JoinTaskRow,
  action: "detail" | "edit" | "copy" | "start"
): void {
  if (action === "detail") void openDetailDrawer(row);
  if (action === "edit") void openEditDrawer(row);
  if (action === "copy") void openCopyDrawer(row);
  if (action === "start") void startTask(row);
}
</script>

<template>
  <div class="join-task-page" aria-label="进群任务">
    <div class="join-task-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.keyword"
            clearable
            class="search-keyword"
            placeholder="任务名称 / 进群链接"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="账号分组">
          <el-select
            v-model="searchForm.groupId"
            clearable
            filterable
            class="search-select"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="分配方式">
          <el-select
            v-model="searchForm.distributionMode"
            clearable
            class="search-select-wide"
          >
            <el-option
              v-for="item in joinTaskDistributionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="任务状态">
          <el-select
            v-model="searchForm.status"
            clearable
            class="search-select"
          >
            <el-option
              v-for="item in joinTaskStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="进群间隔">
          <el-select
            v-model="searchForm.interval"
            clearable
            filterable
            class="search-select"
          >
            <el-option
              v-for="item in intervalOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="advancedOpen" label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            value-format="x"
            unlink-panels
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="search-date"
          />
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
            {{ advancedOpen ? "收起搜索条件" : "展示全部搜索条件" }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <JoinTaskTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :columns="joinTaskColumns"
      :loading="loading"
      :rows="rows"
      :selected-count="selectedCount"
      :total="total"
      @create="openCreateDrawer"
      @delete-selected="deleteSelected"
      @refresh="refreshTasks"
      @row-action="runRowAction"
      @selection-change="onSelectionChange"
    />

    <JoinTaskEditorDrawer
      v-model="editorDrawerOpen"
      v-model:form="editorForm"
      v-model:account-keyword="accountKeyword"
      v-model:only-available="onlyAvailable"
      v-model:only-online="onlyOnline"
      :account-groups="accountGroups"
      :account-options="accountOptions"
      :accounts-loading="accountsLoading"
      :loading="editorLoading"
      :mode="editorMode"
      @submit="submitEditor"
    />

    <JoinTaskDetailDrawer
      v-model="detailDrawerOpen"
      :detail="detailTask"
      :loading="detailLoading"
      :results="detailResults"
    />
  </div>
</template>

<style scoped>
.join-task-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
}

.join-task-page > * {
  min-width: 0;
}

.join-task-search {
  padding: 12px 12px 0;
  border-radius: 6px;
}

.search-keyword {
  width: 220px;
}

.search-select {
  width: 160px;
}

.search-select-wide {
  width: 210px;
}

.search-date {
  width: 260px;
}
</style>

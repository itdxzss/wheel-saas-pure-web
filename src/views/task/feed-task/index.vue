<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import type { UploadRawFile } from "element-plus";
import type { FeedTaskAccountFilter, FeedTaskAction, FeedTaskRow } from "@/api/feed-task";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import FeedTaskTable from "./components/FeedTaskTable.vue";
import FeedTaskFilterDrawer from "./components/FeedTaskFilterDrawer.vue";
import FeedTaskEditorDrawer from "./components/FeedTaskEditorDrawer.vue";
import FeedTaskDataDrawer from "./components/FeedTaskDataDrawer.vue";
import { useFeedTaskPage } from "./composables/useFeedTaskPage";
import { feedTaskStatusOptions } from "./constants";

defineOptions({ name: "TaskFeed" });

const pageState = useFeedTaskPage();
let imageObjectUrl: string | null = null;

function applyAccountFilter(filter: FeedTaskAccountFilter): void {
  pageState.editorForm.accountFilter = { ...filter };
  void pageState.refreshAccountCount(pageState.editorForm.accountFilter);
}

function onImageChange(file: UploadRawFile): void {
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = URL.createObjectURL(file);
  pageState.imageFile.value = file;
  pageState.imagePreview.value = imageObjectUrl;
}

function clearImage(): void {
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  imageObjectUrl = null;
  pageState.imageFile.value = null;
  pageState.imagePreview.value = null;
}

function handlePageChange(value: number): void {
  pageState.page.value = value;
  void pageState.loadTasks();
}

function handlePageSizeChange(value: number): void {
  pageState.pageSize.value = value;
  pageState.page.value = 1;
  void pageState.loadTasks();
}

function handleAccountPageChange(value: number): void {
  pageState.accountDataPage.value = value;
  void pageState.loadAccountData();
}

function handleAccountPageSizeChange(value: number): void {
  pageState.accountDataPageSize.value = value;
  pageState.accountDataPage.value = 1;
  void pageState.loadAccountData();
}

async function handleTaskAction(row: FeedTaskRow, action: FeedTaskAction): Promise<void> {
  await pageState.runAction(row, action);
}

onMounted(() => {
  void pageState.loadTasks();
});

onUnmounted(() => {
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
});
</script>

<template>
  <div class="feed-task-page">
    <div class="page-search bg-bg_color">
      <el-form :model="pageState.searchForm" inline>
        <el-form-item label="任务名">
          <el-input v-model="pageState.searchForm.name" clearable class="search-name" placeholder="任务名称模糊搜索" @keyup.enter="pageState.searchTasks" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="pageState.searchForm.taskStatus" clearable class="search-status" placeholder="全部">
            <el-option v-for="option in feedTaskStatusOptions" :key="option.value" v-bind="option" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="pageState.searchForm.createdAtStart" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="开始时间" class="search-date" />
          <span class="date-separator">至</span>
          <el-date-picker v-model="pageState.searchForm.createdAtEnd" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="结束时间" class="search-date" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="useRenderIcon(Search)" @click="pageState.searchTasks">搜索</el-button>
          <el-button :icon="useRenderIcon(RefreshRight)" @click="pageState.resetSearchForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <FeedTaskTable
      v-model:page="pageState.page.value"
      v-model:page-size="pageState.pageSize.value"
      :rows="pageState.rows.value"
      :loading="pageState.loading.value"
      :total="pageState.total.value"
      :running-count="pageState.runningCount.value"
      :done-count="pageState.doneCount.value"
      @create="pageState.openCreateEditor"
      @refresh="pageState.loadTasks"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @edit="row => pageState.openEditEditor(row)"
      @view="row => pageState.openEditEditor(row, true)"
      @data="pageState.openAccountData"
      @action="handleTaskAction"
    />

    <FeedTaskEditorDrawer
      v-model="pageState.editorVisible.value"
      v-model:form="pageState.editorForm"
      :edit-id="pageState.editorId.value"
      :readonly="pageState.editorReadonly.value"
      :loading="pageState.editorLoading.value"
      :available-account-count="pageState.availableAccountCount.value"
      :account-count-loading="pageState.accountCountLoading.value"
      :image-preview="pageState.imagePreview.value"
      @open-filter="pageState.filterVisible.value = true"
      @image-change="onImageChange"
      @image-clear="clearImage"
      @request-close="pageState.closeEditor"
      @submit="pageState.submitEditor"
    />

    <FeedTaskFilterDrawer
      v-model="pageState.filterVisible.value"
      :filter="pageState.editorForm.accountFilter"
      :account-groups="pageState.accountGroups.value"
      @apply="applyAccountFilter"
    />

    <FeedTaskDataDrawer
      v-model="pageState.dataVisible.value"
      :task-name="pageState.dataTaskName.value"
      :rows="pageState.accountRows.value"
      :loading="pageState.accountDataLoading.value"
      :total="pageState.accountDataTotal.value"
      :page="pageState.accountDataPage.value"
      :page-size="pageState.accountDataPageSize.value"
      :account-phone="pageState.accountPhone.value"
      @update:page="handleAccountPageChange"
      @update:page-size="handleAccountPageSizeChange"
      @update:account-phone="pageState.accountPhone.value = $event"
      @search="pageState.loadAccountData"
    />
  </div>
</template>

<style scoped>
.feed-task-page { min-height: 100%; }
.page-search { padding: 16px 16px 0; margin-bottom: 16px; }
.page-search :deep(.el-form-item) { margin-bottom: 16px; }
.search-name { width: 240px; }.search-status { width: 150px; }.search-date { width: 190px; }
.date-separator { margin: 0 8px; color: var(--el-text-color-secondary); }
</style>

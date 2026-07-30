<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { GroupPullMarketingTaskRow } from "@/api/group-pull-marketing";
import GroupPullMarketingCreateDrawer from "./components/GroupPullMarketingCreateDrawer.vue";
import GroupPullMarketingTaskTable from "./components/GroupPullMarketingTaskTable.vue";
import {
  blockReasonOptions,
  resourceStatusOptions,
  taskColumns,
  taskStatusOptions,
  type GroupPullTaskAction
} from "./constants";
import { useGroupPullMarketingPage } from "./composables/useGroupPullMarketingPage";
import RefreshRight from "~icons/ep/refresh-right";
import Search from "~icons/ri/search-line";

defineOptions({
  name: "TaskGroupPullMarketing"
});

const router = useRouter();
const pageState = useGroupPullMarketingPage();

async function handleTaskAction(
  action: GroupPullTaskAction,
  row: GroupPullMarketingTaskRow
): Promise<void> {
  if (action === "detail") {
    await router.push(`/task/group-pull-marketing/${row.id}`);
    return;
  }
  if (action === "start") return pageState.startTask(row);
  if (action === "pause") return pageState.pauseTask(row);
  if (action === "resume") return pageState.resumeTask(row);
  if (action === "release") return pageState.releaseTask(row);
  await pageState.deleteTask(row);
}

onMounted(() => {
  void pageState.loadTasks();
});
</script>

<template>
  <div class="group-pull-marketing-page" aria-label="拉群营销">
    <div class="page-search bg-bg_color">
      <el-form :model="pageState.searchForm" inline>
        <el-form-item label="任务ID">
          <el-input
            v-model="pageState.searchForm.id"
            clearable
            class="search-id"
            placeholder="精准ID"
            @keyup.enter="pageState.searchTasks"
          />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input
            v-model="pageState.searchForm.keyword"
            clearable
            class="search-keyword"
            placeholder="输入任务名称关键词"
            @keyup.enter="pageState.searchTasks"
          />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="pageState.searchForm.status"
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
        <el-form-item label="阻塞原因">
          <el-select
            v-model="pageState.searchForm.blockReason"
            clearable
            class="search-select"
            placeholder="全部原因"
          >
            <el-option
              v-for="option in blockReasonOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="资源状态">
          <el-select
            v-model="pageState.searchForm.resourceStatus"
            clearable
            class="search-select"
            placeholder="全部状态"
          >
            <el-option
              v-for="option in resourceStatusOptions"
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
            @click="pageState.searchTasks"
          >
            查询
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="pageState.resetSearchForm"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <GroupPullMarketingTaskTable
      v-model:page="pageState.page.value"
      v-model:page-size="pageState.pageSize.value"
      :columns="taskColumns"
      :loading="pageState.loading.value"
      :rows="pageState.rows.value"
      :total="pageState.total.value"
      @action="handleTaskAction"
      @create="pageState.openCreateDrawer"
      @refresh="pageState.loadTasks"
    />

    <GroupPullMarketingCreateDrawer
      v-model="pageState.createDrawerOpen.value"
      v-model:form="pageState.createForm"
      :account-groups="pageState.accountGroups.value"
      :create-block-reason="pageState.createBlockReason.value"
      :marketing-templates="pageState.marketingTemplates.value"
      :material-file="pageState.materialFile.value"
      :submitting="pageState.submitting.value"
      @clear-file="pageState.clearMaterialFile"
      @file-select="pageState.selectMaterialFile"
      @submit="pageState.submitCreate"
    />
  </div>
</template>

<style scoped>
.group-pull-marketing-page {
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

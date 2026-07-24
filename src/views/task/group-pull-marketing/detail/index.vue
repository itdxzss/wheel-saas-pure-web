<script setup lang="ts">
import { watch } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import GroupPullMarketingGroupTable from "../components/GroupPullMarketingGroupTable.vue";
import GroupPullMarketingSummary from "../components/GroupPullMarketingSummary.vue";
import {
  parseGroupPullTaskId,
  useGroupPullMarketingDetail
} from "../composables/useGroupPullMarketingDetail";
import ArrowLeft from "~icons/ep/arrow-left";
import RefreshRight from "~icons/ep/refresh-right";

defineOptions({
  name: "TaskGroupPullMarketingDetail"
});

const route = useRoute();
const router = useRouter();
const pageState = useGroupPullMarketingDetail(0);

async function backToList(): Promise<void> {
  await router.push("/task/group-pull-marketing");
}

// Vue Router 会复用同一个动态路由组件，监听 ID 才能避免展示上一个任务的数据。
watch(
  () => route.params.id,
  rawTaskId => {
    const taskId = parseGroupPullTaskId(rawTaskId);
    if (taskId == null) {
      ElMessage.error("拉群营销任务ID无效");
      void router.replace("/task/group-pull-marketing");
      return;
    }
    void pageState.changeTaskId(taskId);
  },
  { immediate: true }
);
</script>

<template>
  <div class="group-pull-detail-page">
    <div class="detail-toolbar bg-bg_color">
      <el-button :icon="useRenderIcon(ArrowLeft)" @click="backToList">
        返回任务列表
      </el-button>
      <el-button
        :icon="useRenderIcon(RefreshRight)"
        :loading="pageState.initialLoading.value"
        @click="pageState.loadInitial"
      >
        刷新
      </el-button>
    </div>

    <GroupPullMarketingSummary
      v-if="pageState.detail.value"
      v-loading="pageState.initialLoading.value"
      :account-groups="pageState.accountGroups.value"
      :detail="pageState.detail.value"
      :marketing-templates="pageState.marketingTemplates.value"
    />

    <GroupPullMarketingGroupTable
      v-model:page="pageState.page.value"
      v-model:page-size="pageState.pageSize.value"
      :loading="pageState.groupsLoading.value"
      :rows="pageState.groups.value"
      :total="pageState.total.value"
      @refresh="pageState.loadGroups"
    />
  </div>
</template>

<style scoped>
.group-pull-detail-page {
  min-height: 100%;
}

.detail-toolbar {
  display: flex;
  gap: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
</style>

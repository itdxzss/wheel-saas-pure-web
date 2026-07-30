<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import CreateBaseInfoSection from "./components/CreateBaseInfoSection.vue";
import CreateLaunchSection from "./components/CreateLaunchSection.vue";
import CreateMarketingSection from "./components/CreateMarketingSection.vue";
import CreateRoleConfigSection from "./components/CreateRoleConfigSection.vue";
import CreateTargetGroupSection from "./components/CreateTargetGroupSection.vue";
import {
  createEmptyGroupPullDraft,
  emptyTargetDataMetrics,
  type GroupPullMarketingCreateDraft
} from "./create-draft";

defineOptions({
  name: "TaskGroupPullMarketingCreate"
});

const router = useRouter();
const draft = ref<GroupPullMarketingCreateDraft>(createEmptyGroupPullDraft());
const targetDataMetrics = emptyTargetDataMetrics();

async function backToList(): Promise<void> {
  await router.push("/task/group-pull-marketing");
}

function unavailableAction(action: string): void {
  ElMessage.info(`${action}接口契约待确认，当前仅完成前端配置`);
}
</script>

<template>
  <div class="group-pull-create-page" aria-label="新建拉群营销任务">
    <el-card shadow="never" class="page-header-card">
      <el-page-header title="返回拉群任务" @back="backToList">
        <template #content>
          <strong>新建拉群营销任务</strong>
        </template>
      </el-page-header>
      <el-alert
        title="流程：选择目标数据包 → 配置目标群组与角色账号 → 设置拉手、水军和营销参数 → 校验资源 → 启动任务"
        type="info"
        :closable="false"
        class="flow-alert"
      />
    </el-card>

    <el-form :model="draft" label-position="top">
      <CreateBaseInfoSection v-model="draft" :metrics="targetDataMetrics" />
      <CreateTargetGroupSection v-model="draft" />
      <CreateRoleConfigSection v-model="draft" />
      <CreateMarketingSection v-model="draft" />
      <CreateLaunchSection v-model="draft" />
    </el-form>

    <div class="action-bar bg-bg_color">
      <span class="action-hint"
        >当前页面只保存本地交互状态，不会提交旧接口</span
      >
      <div class="action-buttons">
        <el-button @click="unavailableAction('保存草稿')">保存草稿</el-button>
        <el-button @click="unavailableAction('校验配置')">校验配置</el-button>
        <el-button @click="unavailableAction('预览任务')">预览任务</el-button>
        <el-button @click="backToList">取消</el-button>
        <el-button type="primary" @click="unavailableAction('创建并启动')">
          创建并启动
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-pull-create-page {
  min-height: 100%;
  padding-bottom: 76px;
}

.page-header-card {
  margin-bottom: 16px;
}

.flow-alert {
  margin-top: 16px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
}

.action-hint {
  color: var(--el-text-color-secondary);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.action-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (width <= 900px) {
  .action-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    justify-content: flex-start;
  }
}
</style>

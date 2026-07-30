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
  createEmptyPullTaskMarketingDraft,
  emptyTargetDataMetrics,
  type PullTaskMarketingCreateDraft
} from "./create-draft";
import {
  PULL_TASK_LIST_ROUTE_NAME,
  notifyUnconfirmedCreateAction,
  validateCreateDraft
} from "./create-interactions";

defineOptions({
  name: "TaskPullCreate"
});

const router = useRouter();
const draft = ref<PullTaskMarketingCreateDraft>(
  createEmptyPullTaskMarketingDraft()
);
const targetDataMetrics = emptyTargetDataMetrics();
const previewVisible = ref(false);

async function backToList(): Promise<void> {
  await router.push({ name: PULL_TASK_LIST_ROUTE_NAME });
}

function unavailableAction(action: string): void {
  notifyUnconfirmedCreateAction(action, message => ElMessage.info(message));
}

function checkConfiguration(): void {
  const errors = validateCreateDraft(draft.value);
  if (errors.length > 0) {
    ElMessage.warning(errors[0]);
    return;
  }
  ElMessage.success("配置校验通过");
}

function previewTask(): void {
  const errors = validateCreateDraft(draft.value);
  if (errors.length > 0) {
    ElMessage.warning(errors[0]);
    return;
  }
  previewVisible.value = true;
}
</script>

<template>
  <div class="pull-task-create-page" aria-label="新建拉群营销任务">
    <el-card shadow="never" class="page-header-card">
      <el-page-header title="返回拉群任务" @back="backToList">
        <template #content>
          <div class="page-title">
            <strong>新建拉群营销任务</strong>
            <el-tag size="small" effect="plain" type="success">
              GROUP_MARKETING
            </el-tag>
          </div>
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
        <el-button @click="checkConfiguration">校验配置</el-button>
        <el-button @click="previewTask">预览任务</el-button>
        <el-button @click="backToList">取消</el-button>
        <el-button type="primary" @click="unavailableAction('创建并启动')">
          创建并启动
        </el-button>
      </div>
    </div>

    <el-dialog v-model="previewVisible" title="任务配置预览" width="680px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务类型">
          GROUP_MARKETING
        </el-descriptions-item>
        <el-descriptions-item label="任务名称">
          {{ draft.taskName }}
        </el-descriptions-item>
        <el-descriptions-item label="群组来源">
          {{ draft.groupSource }}
        </el-descriptions-item>
        <el-descriptions-item label="目标数据">
          {{
            draft.targetPackageId
              ? `数据包 #${draft.targetPackageId}`
              : draft.targetFile?.name
          }}
        </el-descriptions-item>
        <el-descriptions-item label="目标群组">
          已选择 {{ draft.selectedGroupIds.length }} 个
        </el-descriptions-item>
        <el-descriptions-item label="营销模板">
          模板 #{{ draft.marketingTemplateId }}
        </el-descriptions-item>
        <el-descriptions-item label="启动方式">
          {{ draft.startMode === "IMMEDIATE" ? "立即启动" : "定时启动" }}
        </el-descriptions-item>
        <el-descriptions-item
          v-if="draft.startMode === 'SCHEDULED'"
          label="启动时间"
        >
          {{ draft.scheduledAt }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="previewVisible = false">
          知道了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.pull-task-create-page {
  min-height: 100%;
  padding-bottom: 60px;
  font-size: 13px;
  --el-font-size-base: 13px;
  --el-font-size-small: 12px;
  --el-component-size: 30px;
  --el-component-size-small: 26px;
}

.page-header-card {
  margin-bottom: 10px;
}

.page-header-card :deep(.el-card__body) {
  padding: 12px 14px;
}

.page-header-card :deep(.el-page-header__title) {
  font-size: 13px;
}

.page-header-card :deep(.el-page-header__content),
.page-title {
  font-size: 14px;
}

.flow-alert {
  margin-top: 10px;
}

.page-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pull-task-create-page :deep(.el-alert) {
  padding: 8px 12px;
}

.pull-task-create-page :deep(.el-alert__title) {
  font-size: 12px;
  line-height: 18px;
}

.pull-task-create-page :deep(.create-section) {
  margin-bottom: 10px;
}

.pull-task-create-page :deep(.create-section > .el-card__header) {
  padding: 9px 14px;
}

.pull-task-create-page :deep(.create-section > .el-card__body) {
  padding: 12px 14px;
}

.pull-task-create-page :deep(.section-header) {
  gap: 8px;
}

.pull-task-create-page :deep(.section-header strong),
.pull-task-create-page :deep(.resource-card strong) {
  font-size: 14px;
  line-height: 20px;
}

.pull-task-create-page :deep(.section-header p) {
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
}

.pull-task-create-page :deep(.el-form-item) {
  margin-bottom: 12px;
}

.pull-task-create-page :deep(.el-form-item__label) {
  height: auto;
  padding: 0;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 18px;
}

.pull-task-create-page :deep(.field-hint),
.pull-task-create-page :deep(.field-unit),
.pull-task-create-page :deep(.action-hint) {
  font-size: 12px;
  line-height: 18px;
}

.pull-task-create-page :deep(.field-hint) {
  margin-top: 3px;
}

.pull-task-create-page :deep(.metric-grid) {
  gap: 8px;
}

.pull-task-create-page :deep(.metric-card) {
  gap: 2px;
  padding: 9px 10px;
}

.pull-task-create-page :deep(.metric-card strong) {
  font-size: 15px;
}

.pull-task-create-page :deep(.resource-grid) {
  gap: 10px;
  margin-bottom: 12px;
}

.pull-task-create-page :deep(.resource-card) {
  padding: 10px 12px;
}

.pull-task-create-page :deep(.resource-counts) {
  margin-top: 8px;
}

.pull-task-create-page :deep(.resource-card .el-empty) {
  padding: 8px 0 0;
}

.pull-task-create-page :deep(.resource-card .el-empty__description) {
  margin-top: 4px;
}

.pull-task-create-page :deep(.section-alert) {
  margin: 4px 0 10px;
}

.pull-task-create-page :deep(.candidate-summary) {
  margin: 6px 0 10px;
}

.pull-task-create-page :deep(.target-tabs) {
  padding-top: 0;
}

.pull-task-create-page :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.pull-task-create-page :deep(.preview-empty) {
  min-height: 48px;
  padding: 8px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
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

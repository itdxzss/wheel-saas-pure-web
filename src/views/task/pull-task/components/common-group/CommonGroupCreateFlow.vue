<script setup lang="ts">
import { computed } from "vue";
import CommonGroupAccountMemberSections from "./CommonGroupAccountMemberSections.vue";
import CommonGroupConfigurationSections from "./CommonGroupConfigurationSections.vue";
import CommonGroupPermissionSection from "./CommonGroupPermissionSection.vue";
import CommonGroupTaskDrawer from "./CommonGroupTaskDrawer.vue";
import { useCommonGroupCreate } from "../../composables/useCommonGroupCreate";

defineOptions({ name: "CommonGroupCreateFlow" });

const {
  accountGroups,
  cancel,
  confirmCreate,
  confirmVisible,
  creating,
  errors,
  form,
  groupFolders,
  loading,
  open,
  pollingError,
  requestClose,
  refreshCurrentTask,
  reset,
  resultVisible,
  returnToForm,
  retryItem,
  submit,
  task,
  taskProgress,
  visible
} = useCommonGroupCreate();

const selectedManagerGroup = computed(() =>
  accountGroups.value.find(group => group.id === form.managerGroupId)
);
const selectedSecondaryManagerGroup = computed(() =>
  accountGroups.value.find(group => group.id === form.secondaryManagerGroupId)
);
const selectedMemberGroup = computed(() =>
  accountGroups.value.find(group => group.id === form.memberGroupId)
);
const selectedFolder = computed(() =>
  groupFolders.value.find(folder => folder.id === form.groupFolderId)
);

defineExpose({ open });
</script>

<template>
  <el-drawer
    v-model="visible"
    size="min(1120px, calc(100% - 32px))"
    :before-close="requestClose"
    :with-header="false"
    class="common-group-create-drawer"
  >
    <div class="create-surface">
      <header class="create-header">
        <div>
          <strong>新建普群</strong>
          <span>提交后生成后台任务，任务将在后台依次执行。</span>
        </div>
        <el-button text class="close-button" aria-label="关闭" @click="cancel">
          ×
        </el-button>
      </header>

      <main v-loading="loading" class="create-scroll">
        <el-form :model="form" label-position="top" status-icon>
          <CommonGroupAccountMemberSections
            v-model:form="form"
            :account-groups="accountGroups"
            :errors="errors"
          />
          <CommonGroupConfigurationSections
            v-model:form="form"
            :account-groups="accountGroups"
            :errors="errors"
            :group-folders="groupFolders"
          />
          <CommonGroupPermissionSection v-model:form="form" />
        </el-form>
      </main>

      <footer class="create-footer">
        <el-button :disabled="creating" @click="reset">重置</el-button>
        <el-button :disabled="creating" @click="cancel">取消</el-button>
        <el-button
          type="primary"
          :loading="creating"
          :disabled="loading"
          @click="submit"
        >
          创建任务
        </el-button>
      </footer>
    </div>
  </el-drawer>

  <el-dialog
    v-model="confirmVisible"
    title="确认创建普群任务"
    width="560px"
    :close-on-click-modal="!creating"
    :close-on-press-escape="!creating"
  >
    <el-alert
      title="确认后将创建后台任务并按配置依次执行。"
      type="info"
      show-icon
      :closable="false"
      class="confirm-alert"
    />
    <el-descriptions :column="1" border>
      <el-descriptions-item label="管理员分组">
        {{ selectedManagerGroup?.name || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="次管理员配置">
        <template v-if="selectedSecondaryManagerGroup">
          {{ selectedSecondaryManagerGroup.name }}，每群
          {{ form.secondaryManagerCount }} 人
        </template>
        <template v-else>未配置</template>
      </el-descriptions-item>
      <el-descriptions-item label="成员配置">
        <template v-if="form.memberType === 'CONTROLLED'">
          {{ selectedMemberGroup?.name || "-" }}，每群 {{ form.memberCount }} 人
        </template>
        <template v-else>
          空群（{{ selectedMemberGroup?.name || "-" }}，固定 1 人）
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="群组分组">
        {{ selectedFolder?.name || "未分组" }}
      </el-descriptions-item>
      <el-descriptions-item label="建群数量">
        {{ form.groupCount }} 个（编号从 {{ form.startIndex }} 开始）
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button :disabled="creating" @click="confirmVisible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="creating" @click="confirmCreate">
        确认创建
      </el-button>
    </template>
  </el-dialog>

  <CommonGroupTaskDrawer
    v-model="resultVisible"
    :polling-error="pollingError"
    :progress="taskProgress"
    :task="task"
    @refresh="refreshCurrentTask"
    @return-to-form="returnToForm"
    @retry="retryItem"
  />
</template>

<style scoped>
.create-surface {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.create-header,
.create-footer {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.create-header strong {
  display: block;
  font-size: 18px;
}

.create-header span {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.close-button {
  min-width: 28px;
  padding: 0;
  font-size: 26px;
  color: var(--el-text-color-secondary);
}

.create-scroll {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 18px;
  overflow: auto;
  background: var(--el-fill-color-lighter);
}

.create-scroll :deep(.el-form) {
  display: grid;
  gap: 16px;
}

.create-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: 0;
}

.confirm-alert {
  margin-bottom: 16px;
}

:global(.common-group-create-drawer .el-drawer__body) {
  padding: 0;
}
</style>

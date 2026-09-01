<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { GroupFolderRow } from "@/api/group-folder";
import type { PullTaskStandardDraft } from "@/api/pull-task";
import type { StandardPullTaskCreateForm } from "../composables/useStandardPullTaskCreate";
import PullTaskStandardSettings from "./PullTaskStandardSettings.vue";
import PullTaskStandardResources from "./PullTaskStandardResources.vue";
import PullTaskStandardPlanTable from "./PullTaskStandardPlanTable.vue";

defineOptions({
  name: "PullTaskCreateDrawer"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
  clearing: boolean;
  creating: boolean;
  draft: PullTaskStandardDraft;
  groupAvatarFile: File | null;
  groupFolders: GroupFolderRow[];
  loading: boolean;
  pendingFiles: File[];
  planning: boolean;
  resourceError: string;
}>();

const emit = defineEmits<{
  (event: "add-files", files: File[]): void;
  (event: "avatar-change", file: File): void;
  (event: "avatar-clear"): void;
  (event: "clear"): void;
  (event: "create"): void;
  (event: "move-pending-file", fileName: string, offset: -1 | 1): void;
  (event: "plan"): void;
  (event: "remove-pending-file", fileName: string): void;
  (event: "remove-row", rowId: number): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<StandardPullTaskCreateForm>("form", {
  required: true
});
const linksText = defineModel<string>("linksText", { required: true });

function forwardPendingFileMove(fileName: string, offset: -1 | 1): void {
  emit("move-pending-file", fileName, offset);
}

function changeCreationMode(mode: string): void {
  if (mode !== "PASTED_LINK" && mode !== "NEW_GROUP") {
    return;
  }
  if (mode === "NEW_GROUP" && form.value.creationMode !== "NEW_GROUP") {
    form.value.groupSettingEnabled = true;
  }
  form.value.creationMode = mode;
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="calc(100% - 210px)"
    destroy-on-close
    :with-header="false"
    class="pull-task-create-drawer"
  >
    <div class="create-surface">
      <header class="create-header">
        <div class="create-title">
          <el-button text class="close-button" @click="visible = false">
            ×
          </el-button>
          <strong>新建拉群任务</strong>
        </div>
        <el-button
          type="primary"
          :loading="creating"
          :disabled="loading || planning"
          @click="emit('create')"
        >
          创建任务
        </el-button>
      </header>

      <el-tabs
        :model-value="form.creationMode"
        class="create-mode-tabs"
        @update:model-value="changeCreationMode"
      >
        <el-tab-pane
          name="NEW_GROUP"
          label="新群模式"
          data-testid="pull-task-new-group-mode-tab"
        />
        <el-tab-pane name="PASTED_LINK" label="群链接模式" />
        <el-tab-pane name="fast" label="速拉模式（后期）" disabled />
      </el-tabs>

      <main v-loading="loading" class="create-scroll">
        <PullTaskStandardSettings
          v-model:form="form"
          :account-groups="accountGroups"
          :group-avatar-file="groupAvatarFile"
          :group-folders="groupFolders"
          @avatar-change="emit('avatar-change', $event)"
          @avatar-clear="emit('avatar-clear')"
        />

        <div class="resource-layout">
          <PullTaskStandardResources
            v-model:links-text="linksText"
            :clearing="clearing"
            :creation-mode="form.creationMode"
            :draft="draft"
            :pending-files="pendingFiles"
            :planning="planning"
            :resource-error="resourceError"
            @add-files="emit('add-files', $event)"
            @clear="emit('clear')"
            @move-pending-file="forwardPendingFileMove"
            @plan="emit('plan')"
            @remove-pending-file="emit('remove-pending-file', $event)"
          />
          <PullTaskStandardPlanTable
            :creation-mode="form.creationMode"
            :draft="draft"
            @remove-row="emit('remove-row', $event)"
          />
        </div>
      </main>

      <footer class="create-footer">
        <el-button :disabled="creating" @click="visible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="creating"
          :disabled="loading || planning"
          @click="emit('create')"
        >
          创建任务
        </el-button>
      </footer>
    </div>
  </el-drawer>
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
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.create-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 16px;
}

.close-button {
  min-width: 28px;
  padding: 0;
  font-size: 24px;
  color: var(--el-text-color-secondary);
}

.create-mode-tabs {
  flex: 0 0 auto;
  padding: 0 16px;
}

.create-mode-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.create-mode-tabs :deep(.el-tabs__content) {
  display: none;
}

.create-scroll {
  display: grid;
  flex: 1 1 auto;
  gap: 16px;
  min-height: 0;
  padding: 16px;
  overflow: auto;
}

.resource-layout {
  display: grid;
  grid-template-columns: minmax(520px, 0.95fr) minmax(620px, 1.05fr);
  gap: 16px;
  align-items: start;
}

.create-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: 0;
}

@media (width <= 1280px) {
  .resource-layout {
    grid-template-columns: 1fr;
  }
}

:global(.pull-task-create-drawer .el-drawer__body) {
  padding: 0;
}
</style>

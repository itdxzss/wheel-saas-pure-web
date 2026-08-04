<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { PullTaskStandardDraft } from "@/api/pull-task";
import type { StandardPullTaskCreateForm } from "../composables/useStandardPullTaskCreate";
import PullTaskStandardPlanTable from "./PullTaskStandardPlanTable.vue";
import PullTaskStandardResources from "./PullTaskStandardResources.vue";
import PullTaskStandardSettings from "./PullTaskStandardSettings.vue";

defineOptions({
  name: "PullTaskCreateDrawer"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
  clearing: boolean;
  creating: boolean;
  draft: PullTaskStandardDraft;
  loading: boolean;
  pendingFiles: File[];
  planning: boolean;
}>();

const emit = defineEmits<{
  (event: "add-files", files: File[]): void;
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
</script>

<template>
  <el-drawer
    v-model="visible"
    size="94%"
    destroy-on-close
    title="群链接 · 普通群链接版"
  >
    <div v-loading="loading" class="create-layout">
      <div class="create-left">
        <PullTaskStandardResources
          v-model:links-text="linksText"
          :clearing="clearing"
          :draft="draft"
          :pending-files="pendingFiles"
          :planning="planning"
          @add-files="emit('add-files', $event)"
          @clear="emit('clear')"
          @move-pending-file="forwardPendingFileMove"
          @plan="emit('plan')"
          @remove-pending-file="emit('remove-pending-file', $event)"
        />
        <PullTaskStandardSettings
          v-model:form="form"
          :account-groups="accountGroups"
        />
      </div>
      <PullTaskStandardPlanTable
        :draft="draft"
        @remove-row="emit('remove-row', $event)"
      />
    </div>

    <template #footer>
      <el-button :disabled="creating" @click="visible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="creating"
        :disabled="loading || planning"
        @click="emit('create')"
      >
        冻结并创建任务
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.create-layout {
  display: grid;
  grid-template-columns: minmax(560px, 0.9fr) minmax(620px, 1.1fr);
  gap: 16px;
  align-items: start;
}

.create-left {
  display: grid;
  gap: 16px;
}

@media (width <= 1280px) {
  .create-layout {
    grid-template-columns: 1fr;
  }
}
</style>

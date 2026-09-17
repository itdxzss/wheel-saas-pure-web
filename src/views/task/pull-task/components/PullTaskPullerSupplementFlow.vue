<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";
import type { PullTaskGroupRow } from "@/api/pull-task";
import PullTaskPullerSupplementDrawer from "./PullTaskPullerSupplementDrawer.vue";
import { usePullTaskPullerSupplement } from "../composables/usePullTaskPullerSupplement";

defineOptions({ name: "PullTaskPullerSupplementFlow" });

const props = defineProps<{
  taskId?: number;
}>();

const emit = defineEmits<{
  (event: "submitted"): void;
}>();

const accountGroups = ref<AccountGroupApiRow[]>([]);
const groupsLoading = ref(false);

async function refreshAccountGroups(): Promise<void> {
  accountGroups.value = [];
  groupsLoading.value = true;
  try {
    const result = await listAccountGroups({ page: 1, pageSize: 500 });
    accountGroups.value = result.list ?? [];
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "账号分组加载失败"));
  } finally {
    groupsLoading.value = false;
  }
}

const {
  changeAccountGroup,
  changeSelectionMode,
  form,
  loading,
  open: openSelection,
  options,
  saving,
  submit,
  visible
} = usePullTaskPullerSupplement({
  onSubmitted: async () => emit("submitted")
});

async function open(row: PullTaskGroupRow): Promise<void> {
  if (!props.taskId) return;
  await Promise.all([
    openSelection(props.taskId, row.id),
    refreshAccountGroups()
  ]);
}

defineExpose({ open });
</script>

<template>
  <PullTaskPullerSupplementDrawer
    v-model="visible"
    v-model:form="form"
    :account-groups="accountGroups"
    :loading="loading || groupsLoading"
    :options="options"
    :saving="saving"
    @account-group-change="changeAccountGroup"
    @selection-mode-change="changeSelectionMode"
    @submit="submit"
  />
</template>

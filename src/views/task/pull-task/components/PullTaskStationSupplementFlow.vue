<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { PullTaskGroupRow } from "@/api/pull-task";
import PullTaskStationSupplementDrawer from "./PullTaskStationSupplementDrawer.vue";
import { usePullTaskStationSupplement } from "../composables/usePullTaskStationSupplement";

defineOptions({ name: "PullTaskStationSupplementFlow" });

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  taskId?: number;
}>();

const emit = defineEmits<{
  (event: "submitted"): void;
}>();

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
} = usePullTaskStationSupplement({
  onSubmitted: async () => emit("submitted")
});

async function open(row: PullTaskGroupRow): Promise<void> {
  if (!props.taskId) return;
  await openSelection(props.taskId, row.id);
}

defineExpose({ open });
</script>

<template>
  <PullTaskStationSupplementDrawer
    v-model="visible"
    v-model:form="form"
    :account-groups="accountGroups"
    :loading="loading"
    :options="options"
    :saving="saving"
    @account-group-change="changeAccountGroup"
    @selection-mode-change="changeSelectionMode"
    @submit="submit"
  />
</template>

<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { PullTaskGroupRow } from "@/api/pull-task";
import PullTaskManagerSupplementDrawer from "./PullTaskManagerSupplementDrawer.vue";
import { usePullTaskManagerSupplement } from "../composables/usePullTaskManagerSupplement";

defineOptions({
  name: "PullTaskManagerSupplementFlow"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  taskId?: number;
}>();

const emit = defineEmits<{
  (event: "submitted"): void;
}>();

const {
  changeAccountGroup,
  form,
  loading,
  open: openSelection,
  options,
  saving,
  submit,
  visible
} = usePullTaskManagerSupplement({
  onSubmitted: async () => emit("submitted")
});

async function open(row: PullTaskGroupRow): Promise<void> {
  if (!props.taskId) return;
  await openSelection(props.taskId, row.id);
}

defineExpose({ open });
</script>

<template>
  <PullTaskManagerSupplementDrawer
    v-model="visible"
    v-model:form="form"
    :account-groups="accountGroups"
    :loading="loading"
    :options="options"
    :saving="saving"
    @account-group-change="changeAccountGroup"
    @submit="submit"
  />
</template>

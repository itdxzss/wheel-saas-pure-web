<script setup lang="ts">
import { ref } from "vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { PullTaskGroupRow } from "@/api/pull-task";
import PullTaskManagerSupplementFlow from "./PullTaskManagerSupplementFlow.vue";
import PullTaskPullerSupplementFlow from "./PullTaskPullerSupplementFlow.vue";
import PullTaskStationSupplementFlow from "./PullTaskStationSupplementFlow.vue";

defineOptions({ name: "PullTaskResourceSupplementFlows" });

defineProps<{
  accountGroups: AccountGroupApiRow[];
  taskId?: number;
}>();

const emit = defineEmits<{
  (event: "submitted"): void;
}>();

type ManagerFlow = InstanceType<typeof PullTaskManagerSupplementFlow>;
type PullerFlow = InstanceType<typeof PullTaskPullerSupplementFlow>;
type StationFlow = InstanceType<typeof PullTaskStationSupplementFlow>;
const managerFlow = ref<ManagerFlow | null>(null);
const pullerFlow = ref<PullerFlow | null>(null);
const stationFlow = ref<StationFlow | null>(null);

async function openManager(row: PullTaskGroupRow): Promise<void> {
  await managerFlow.value?.open(row);
}

async function openPuller(row: PullTaskGroupRow): Promise<void> {
  await pullerFlow.value?.open(row);
}

async function openStation(row: PullTaskGroupRow): Promise<void> {
  await stationFlow.value?.open(row);
}

defineExpose({ openManager, openPuller, openStation });
</script>

<template>
  <PullTaskManagerSupplementFlow
    ref="managerFlow"
    :account-groups="accountGroups"
    :task-id="taskId"
    @submitted="emit('submitted')"
  />
  <PullTaskPullerSupplementFlow
    ref="pullerFlow"
    :account-groups="accountGroups"
    :task-id="taskId"
    @submitted="emit('submitted')"
  />
  <PullTaskStationSupplementFlow
    ref="stationFlow"
    :account-groups="accountGroups"
    :task-id="taskId"
    @submitted="emit('submitted')"
  />
</template>

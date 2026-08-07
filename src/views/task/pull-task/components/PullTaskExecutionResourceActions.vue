<script setup lang="ts">
import { computed } from "vue";
import type { PullTaskGroupRow, PullTaskRow } from "@/api/pull-task";

defineOptions({ name: "PullTaskExecutionResourceActions" });

const props = defineProps<{
  activeTask: PullTaskRow | null;
  row: PullTaskGroupRow;
}>();

const emit = defineEmits<{
  (event: "detail"): void;
  (event: "lifecycle", action: "pause" | "resume" | "end"): void;
  (event: "manager"): void;
  (event: "puller"): void;
  (event: "station"): void;
}>();

const activeExecution = computed(
  () =>
    props.activeTask?.taskType === "STANDARD" &&
    props.activeTask.mode === "NORMAL_LINK" &&
    ["EXECUTING", "PAUSED"].includes(props.activeTask.status) &&
    [1, 2, 3].includes(props.row.executionStatus ?? 0)
);
const normalLinkWait = computed(
  () => activeExecution.value && props.row.executionStatus === 3
);
const pauseVisible = computed(
  () => activeExecution.value && !props.row.manualPaused
);
const resumeVisible = computed(
  () => activeExecution.value && props.row.manualPaused === true
);
const managerVisible = computed(
  () =>
    normalLinkWait.value &&
    props.row.waitResourceType === 1 &&
    props.row.stage !== 3
);
const pullerVisible = computed(
  () => normalLinkWait.value && props.row.waitResourceType === 2
);
const stationVisible = computed(
  () => normalLinkWait.value && props.row.waitResourceType === 3
);
</script>

<template>
  <el-button link type="primary" @click="emit('detail')">查看明细</el-button>
  <el-button
    v-if="pauseVisible"
    v-auth="'tenant:pull_task:operate'"
    link
    type="primary"
    @click="emit('lifecycle', 'pause')"
  >
    暂停
  </el-button>
  <el-button
    v-if="resumeVisible"
    v-auth="'tenant:pull_task:operate'"
    link
    type="primary"
    @click="emit('lifecycle', 'resume')"
  >
    恢复
  </el-button>
  <el-button
    v-if="activeExecution"
    v-auth="'tenant:pull_task:operate'"
    link
    type="danger"
    @click="emit('lifecycle', 'end')"
  >
    结束
  </el-button>
  <el-button
    v-if="managerVisible"
    v-auth="'tenant:pull_task:operate'"
    link
    type="primary"
    @click="emit('manager')"
  >
    补充管理员
  </el-button>
  <el-button
    v-if="pullerVisible"
    v-auth="'tenant:pull_task:operate'"
    link
    type="primary"
    @click="emit('puller')"
  >
    补充拉手
  </el-button>
  <el-button
    v-if="stationVisible"
    v-auth="'tenant:pull_task:operate'"
    link
    type="primary"
    @click="emit('station')"
  >
    补充站台
  </el-button>
</template>

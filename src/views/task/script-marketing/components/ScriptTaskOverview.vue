<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import type { ScriptDetail } from "@/api/script-marketing";
import { taskLabels } from "../form";

const props = defineProps<{ detail: ScriptDetail; loading: boolean }>();
const emit = defineEmits<{ refresh: [] }>();
const statusType = computed(() => {
  switch (props.detail.task.status) {
    case 1:
      return "primary";
    case 2:
      return "warning";
    case 3:
      return "success";
    default:
      return "info";
  }
});
const planned = computed(
  () => props.detail.groups.length * props.detail.steps.length
);
const processed = computed(() =>
  props.detail.groups.reduce(
    (sum, group) =>
      sum + Math.min(Math.max(group.nextStep, 0), props.detail.steps.length),
    0
  )
);
const percentage = computed(() =>
  planned.value ? Math.floor((processed.value / planned.value) * 100) : 0
);
function time(value: number | null) {
  return value ? dayjs(value).format("YYYY/MM/DD HH:mm:ss") : "—";
}
</script>

<template>
  <section class="task-overview" aria-label="任务概览">
    <div class="task-heading">
      <div class="task-identity">
        <div class="task-eyebrow">
          <span>任务 #{{ detail.task.id }}</span>
          <el-tag :type="statusType" effect="light" round>{{
            taskLabels[detail.task.status]
          }}</el-tag>
        </div>
        <h2>{{ detail.task.taskName }}</h2>
      </div>
      <el-button :loading="loading" @click="emit('refresh')">刷新</el-button>
    </div>
    <div class="task-times">
      <span
        >开始时间 <strong>{{ time(detail.task.startAt) }}</strong></span
      >
      <span
        >截止时间
        <strong>{{
          detail.task.endAt ? time(detail.task.endAt) : "未设置"
        }}</strong></span
      >
    </div>
    <div class="execution-summary">
      <div class="overall-progress">
        <div class="progress-heading">
          <span>整体处理进度</span>
          <strong>{{ percentage }}<small>%</small></strong>
        </div>
        <el-progress
          :percentage="percentage"
          :stroke-width="7"
          :show-text="false"
        />
        <p>
          已处理 {{ processed }} / {{ planned }} 项 ·
          {{ detail.groups.length }} 个群
        </p>
      </div>
      <div class="result-statistics">
        <el-statistic
          title="成功"
          :value="detail.task.successCount"
          class="result-success"
        />
        <el-statistic
          title="失败"
          :value="detail.task.failedCount"
          class="result-failed"
        />
        <el-statistic
          title="未知"
          :value="detail.task.unknownCount"
          class="result-unknown"
        />
      </div>
    </div>
    <div class="execution-notes">
      <span>处理进度包含失败与未知结果，不代表全部发送成功。</span>
      <span v-if="detail.task.inFlightCount"
        >{{ detail.task.inFlightCount }} 项等待原结果</span
      >
    </div>
  </section>
</template>

<style scoped>
.task-overview {
  padding: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.task-heading,
.task-eyebrow,
.task-times,
.progress-heading,
.execution-notes {
  display: flex;
  gap: 16px;
  align-items: center;
}

.task-heading {
  align-items: flex-start;
  justify-content: space-between;
}

.task-identity {
  min-width: 0;
}

.task-eyebrow {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

h2 {
  margin: 12px 0 0;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.task-times {
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-top: 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.task-times strong {
  margin-left: 8px;
  font-weight: 400;
  color: var(--el-text-color-regular);
}

.execution-summary {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 28px;
  margin-top: 24px;
}

.overall-progress {
  padding-right: 28px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.progress-heading {
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
}

.progress-heading strong {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-heading small {
  margin-left: 3px;
  font-size: 14px;
  font-weight: 400;
}

.overall-progress p {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.result-statistics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: center;
}

.result-statistics :deep(.el-statistic) {
  --el-statistic-content-font-size: 28px;
}

.result-statistics :deep(.el-statistic__head) {
  margin-bottom: 10px;
  font-size: 13px;
}

.result-success {
  --el-statistic-content-color: var(--el-color-success);
}

.result-failed {
  --el-statistic-content-color: var(--el-color-danger);
}

.result-unknown {
  --el-statistic-content-color: var(--el-color-warning);
}

.execution-notes {
  flex-wrap: wrap;
  gap: 6px;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 600px) {
  .task-overview {
    padding: 16px;
  }

  h2 {
    font-size: 18px;
  }

  .execution-summary {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .overall-progress {
    padding-right: 0;
    border-right: 0;
  }
}
</style>

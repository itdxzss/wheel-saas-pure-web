<script setup lang="ts">
import { computed } from "vue";
import type { ContactTaskMetrics, ContactTaskStats } from "@/api/contact-task";
import { processedPercent } from "../domain/receipt-metrics";
const props = defineProps<{
  metrics?: ContactTaskMetrics;
  accounts?: ContactTaskStats["accounts"];
  preparing?: boolean;
}>();
const percent = computed(() => processedPercent(props.metrics));
const preparing = computed(
  () => props.preparing || (props.accounts?.preparingAccountNum ?? 0) > 0
);
</script>

<template>
  <div v-if="!metrics" class="progress-note">统计暂不可用</div>
  <div v-else-if="metrics.inconsistentNum > 0" class="progress-error">
    统计数据待核对
  </div>
  <div v-else-if="preparing" class="progress-note">
    <div v-if="accounts">
      名单准备
      {{ accounts.selectedAccountNum - accounts.preparingAccountNum }} /
      {{ accounts.selectedAccountNum }} 个账号
    </div>
    <div v-else>名单准备中</div>
    <div>
      已确认计划 {{ metrics.plannedNum }} 条 · 已处理
      {{ metrics.processedNum }} 条
    </div>
  </div>
  <div v-else-if="metrics.plannedNum === 0" class="progress-note">
    无可发送联系人
  </div>
  <div v-else>
    <div class="progress-note">
      已处理 {{ metrics.processedNum }} / 计划 {{ metrics.plannedNum }} 条
    </div>
    <el-progress
      v-if="percent !== null"
      :percentage="percent"
      :stroke-width="8"
    />
    <div class="progress-note">
      待处理 {{ metrics.pendingNum }} · 处理中 {{ metrics.sendingNum }}
    </div>
  </div>
</template>

<style scoped>
.progress-note {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.progress-error {
  color: var(--el-color-danger);
}
</style>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import {
  getContactTaskStats,
  type ContactTaskAccountItem,
  type ContactTaskStats
} from "@/api/contact-task";
import {
  needsReceiptRefresh,
  type ReceiptFilter
} from "../domain/receipt-metrics";
import { statusLabel } from "../domain/task-status";
import { useContactRefresh } from "../composables/useContactRefresh";
import ContactTaskOverview from "./ContactTaskOverview.vue";
import ContactTaskAccountTable from "./ContactTaskAccountTable.vue";
import ContactTaskRecipientTable from "./ContactTaskRecipientTable.vue";
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    taskId: number | null;
    taskName: string;
    initialFilter?: ReceiptFilter;
  }>(),
  { initialFilter: "ALL" }
);
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "stats", stats: ContactTaskStats): void;
}>();
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const stats = ref<ContactTaskStats>();
const tab = ref("overview");
const selectedFilter = ref<ReceiptFilter>("ALL");
const selectedAccount = ref<number>();
const selectedErrorCode = ref<string>();
const selectionVersion = ref(0);
const refreshKey = ref(0);
const autoRefresh = ref(true);
const loading = ref(false);
const errorMessage = ref("");
const refreshedAt = ref<string>();
let version = 0;
async function load() {
  if (!props.modelValue || props.taskId == null || loading.value) return;
  const request = ++version;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await getContactTaskStats(props.taskId);
    if (request !== version) return;
    stats.value = result;
    refreshKey.value++;
    refreshedAt.value = new Date().toLocaleTimeString();
    emit("stats", result);
  } catch (error) {
    if (request === version)
      errorMessage.value = (error as Error).message || "任务统计加载失败";
  } finally {
    if (request === version) loading.value = false;
  }
}
function showRecipients(filter: ReceiptFilter, errorCode?: string) {
  selectedAccount.value = undefined;
  selectedFilter.value = filter;
  selectedErrorCode.value = errorCode;
  selectionVersion.value++;
  tab.value = "recipients";
}
function showAccountRecipients(account: ContactTaskAccountItem) {
  showRecipients("ALL");
  selectedAccount.value = account.taskAccountId;
}
watch(
  () => [props.modelValue, props.taskId, props.initialFilter],
  () => {
    version++;
    stats.value = undefined;
    refreshedAt.value = undefined;
    loading.value = false;
    errorMessage.value = "";
    autoRefresh.value = true;
    tab.value = "overview";
    selectedAccount.value = undefined;
    selectedErrorCode.value = undefined;
    selectedFilter.value = props.initialFilter;
    selectionVersion.value++;
    if (props.initialFilter !== "ALL") tab.value = "recipients";
    if (props.modelValue) load();
  },
  { immediate: true }
);
useContactRefresh(
  computed(
    () =>
      props.modelValue && autoRefresh.value && needsReceiptRefresh(stats.value)
  ),
  load
);
onUnmounted(() => {
  version++;
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`任务结果 · ${taskName}`"
    size="90%"
    destroy-on-close
  >
    <div class="result-toolbar">
      <el-tag v-if="stats" effect="plain">{{
        statusLabel(1, stats.runStatus)
      }}</el-tag>
      <el-tag v-if="stats?.metrics.unknownNum" type="warning" effect="plain"
        >有结果待确认</el-tag
      >
      <el-button :loading="loading" @click="load">刷新</el-button>
      <el-switch
        v-model="autoRefresh"
        active-text="自动刷新"
        aria-label="自动刷新"
      />
      <span v-if="refreshedAt" class="result-note"
        >最近刷新 {{ refreshedAt }}</span
      >
    </div>
    <el-alert
      type="info"
      :closable="false"
      title="单勾表示服务器确认；送达、已读以回执为准。任务结束后仍可更新回执，结果未知不会自动重发。"
    />
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon
    />
    <el-tabs v-model="tab">
      <el-tab-pane label="概览" name="overview"
        ><ContactTaskOverview
          v-if="stats && tab === 'overview'"
          :stats="stats"
          @filter="showRecipients" /><el-empty
          v-else-if="!loading && !stats"
          description="统计暂不可用，请刷新重试"
      /></el-tab-pane>
      <el-tab-pane label="账号数据" name="accounts"
        ><ContactTaskAccountTable
          v-if="visible && taskId != null && tab === 'accounts'"
          :task-id="taskId"
          :refresh-key="refreshKey"
          @recipients="showAccountRecipients"
      /></el-tab-pane>
      <el-tab-pane label="联系人明细" name="recipients"
        ><ContactTaskRecipientTable
          v-if="visible && taskId != null && tab === 'recipients'"
          :key="selectionVersion"
          :task-id="taskId"
          :refresh-key="refreshKey"
          :initial-filter="selectedFilter"
          :initial-account-id="selectedAccount"
          :initial-error-code="selectedErrorCode"
      /></el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<style scoped>
.result-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.result-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

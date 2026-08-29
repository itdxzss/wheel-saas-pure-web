<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  getHyperlinkTaskSummary,
  type HyperlinkTaskDetailTab,
  type HyperlinkTaskSummary
} from "@/api/hyperlink-task-detail";
import { apiErrorMessage } from "@/utils/api-error";
import { isPermissionDenied } from "../domain/recipient-stats";
import HyperlinkRecipientStatsTab from "./HyperlinkRecipientStatsTab.vue";
import HyperlinkTaskSummaryCards from "./HyperlinkTaskSummaryCards.vue";

defineOptions({ name: "HyperlinkTaskDetailDrawer" });

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    taskId: number | null;
    taskName: string;
    initialTab?: HyperlinkTaskDetailTab;
  }>(),
  { initialTab: "recipients" }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "tab-change", value: HyperlinkTaskDetailTab): void;
}>();

const validTabs: HyperlinkTaskDetailTab[] = [
  "recipients",
  "accounts",
  "clicks",
  "visit-trend",
  "ban-stats"
];
const activeTab = ref<HyperlinkTaskDetailTab>(props.initialTab);
const summary = ref<HyperlinkTaskSummary | null>(null);
const summaryLoading = ref(false);
const summaryError = ref("");
const summaryPermissionDenied = ref(false);
const recipientTabRef = ref<InstanceType<typeof HyperlinkRecipientStatsTab>>();
let summaryVersion = 0;

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const drawerTitle = computed(() =>
  props.taskName?.trim()
    ? `任务收信人 · ${props.taskName.trim()}`
    : "任务收信人"
);

function normalizeTab(tab?: string): HyperlinkTaskDetailTab {
  return validTabs.includes(tab as HyperlinkTaskDetailTab)
    ? (tab as HyperlinkTaskDetailTab)
    : "recipients";
}

async function loadSummary(): Promise<void> {
  const taskId = props.taskId;
  if (!taskId || taskId <= 0) {
    summary.value = null;
    return;
  }
  const version = ++summaryVersion;
  summaryLoading.value = true;
  summaryError.value = "";
  summaryPermissionDenied.value = false;
  try {
    const result = await getHyperlinkTaskSummary(taskId);
    if (version !== summaryVersion) return;
    summary.value = result;
  } catch (error) {
    if (version !== summaryVersion) return;
    summary.value = null;
    summaryPermissionDenied.value = isPermissionDenied(error);
    summaryError.value = summaryPermissionDenied.value
      ? "权限不足，无法查看任务统计。"
      : apiErrorMessage(error, "任务统计加载失败，请稍后重试。");
  } finally {
    if (version === summaryVersion) summaryLoading.value = false;
  }
}

function switchTab(tab: HyperlinkTaskDetailTab): void {
  const normalized = normalizeTab(tab);
  activeTab.value = normalized;
  emit("tab-change", normalized);
}

function onTabChange(value: string | number): void {
  switchTab(String(value) as HyperlinkTaskDetailTab);
}

async function refresh(): Promise<void> {
  await loadSummary();
  if (activeTab.value === "recipients") {
    await nextTick();
    await recipientTabRef.value?.refresh();
  }
}

function onClosed(): void {
  summaryVersion += 1;
  recipientTabRef.value?.stopExportPolling();
}

watch(
  () => [props.modelValue, props.taskId] as const,
  ([open], previous) => {
    const taskChanged = previous?.[1] !== props.taskId;
    if (!open) return;
    if (taskChanged || !previous?.[0]) {
      activeTab.value = normalizeTab(props.initialTab);
      summary.value = null;
      summaryError.value = "";
      void loadSummary();
    }
  },
  { immediate: true }
);

defineExpose({ switchTab, refresh });
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    size="min(100vw, 1300px)"
    direction="rtl"
    modal
    show-close
    destroy-on-close
    @closed="onClosed"
  >
    <div v-if="taskId" class="hyperlink-task-detail">
      <HyperlinkTaskSummaryCards
        :summary="summary"
        :loading="summaryLoading"
        :error-message="summaryError"
        :permission-denied="summaryPermissionDenied"
        @retry="loadSummary"
      />

      <el-tabs
        v-model="activeTab"
        class="detail-tabs"
        @tab-change="onTabChange"
      >
        <el-tab-pane label="收信人流水统计" name="recipients" lazy>
          <HyperlinkRecipientStatsTab ref="recipientTabRef" :task-id="taskId" />
        </el-tab-pane>
        <el-tab-pane label="发信账号维度统计" name="accounts" lazy>
          <slot name="accounts" :task-id="taskId" :task-name="taskName" />
        </el-tab-pane>
        <el-tab-pane label="深度归因" name="clicks" lazy>
          <slot
            name="clicks"
            :task-id="taskId"
            :task-name="taskName"
            :success-num="summary?.successNum ?? 0"
          />
        </el-tab-pane>
        <el-tab-pane label="访问趋势" name="visit-trend" lazy>
          <slot name="visit-trend" :task-id="taskId" :task-name="taskName" />
        </el-tab-pane>
        <el-tab-pane label="封号原因分布" name="ban-stats" lazy>
          <slot name="ban-stats" :task-id="taskId" :task-name="taskName" />
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-empty v-else description="未选择超链任务" />
  </el-drawer>
</template>

<style scoped>
.hyperlink-task-detail {
  min-width: 0;
}

.detail-tabs {
  margin-top: 16px;
}

:deep(.el-drawer__body) {
  padding-top: 8px;
}
</style>

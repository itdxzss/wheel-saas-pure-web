<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import type { HyperlinkTaskDetailTab } from "@/api/hyperlink-task-detail";
import AccountStatsTab from "./components/AccountStatsTab.vue";
import AttributionTab from "./components/AttributionTab.vue";
import BanReasonStatsTab from "./components/BanReasonStatsTab.vue";
import HyperlinkTaskIntro from "./components/HyperlinkTaskIntro.vue";
import HyperlinkTaskMetrics from "./components/HyperlinkTaskMetrics.vue";
import HyperlinkTaskSearchCard from "./components/HyperlinkTaskSearchCard.vue";
import HyperlinkTaskDetailDrawer from "./components/HyperlinkTaskDetailDrawer.vue";
import HyperlinkTaskEditorDrawer from "./components/HyperlinkTaskEditorDrawer.vue";
import HyperlinkTaskStartReviewDialog from "./components/HyperlinkTaskStartReviewDialog.vue";
import HyperlinkTaskTable from "./components/HyperlinkTaskTable.vue";
import VisitTrendTab from "./components/VisitTrendTab.vue";
import { useHyperlinkTaskPage } from "./composables/useHyperlinkTaskPage";
import type { HyperlinkTaskRowAction } from "./domain/list-display";

defineOptions({ name: "HyperlinkTaskList" });

const emit = defineEmits<{
  (
    event: "open-editor",
    payload: {
      mode: "create" | "edit" | "view" | "copy";
      taskId: number | null;
    }
  ): void;
  (
    event: "open-detail",
    payload: {
      taskId: number;
      initialTab: "recipients" | "visit-trend";
      rangeHours?: 24;
    }
  ): void;
  (event: "request-start", row: HyperlinkTaskListItem): void;
}>();

const {
  busyActions,
  channels,
  columnKey,
  columns,
  context,
  contextErrorMessage,
  contextLoading,
  countries,
  errorMessage,
  exporting,
  filtersActive,
  groups,
  loading,
  page,
  pageSize,
  protocols,
  rows,
  searchForm,
  total,
  exportTasks,
  initialize,
  persistColumns,
  refreshContext,
  refreshTasks,
  resetSearch,
  runLifecycleAction,
  searchTasks
} = useHyperlinkTaskPage();

const editorRef = ref<InstanceType<typeof HyperlinkTaskEditorDrawer>>();
const detailRef = ref<InstanceType<typeof HyperlinkTaskDetailDrawer>>();
const detailVisible = ref(false);
const detailTaskId = ref<number | null>(null);
const detailTaskName = ref("");
const detailInitialTab = ref<HyperlinkTaskDetailTab>("recipients");
const detailActiveTab = ref<HyperlinkTaskDetailTab>("recipients");
const startReviewVisible = ref(false);
const startTask = ref<HyperlinkTaskListItem | null>(null);

function openEditor(
  mode: "create" | "edit" | "view" | "copy",
  row?: HyperlinkTaskListItem
): void {
  emit("open-editor", { mode, taskId: row?.id ?? null });
  if (mode === "create") editorRef.value?.openCreate();
  else if (mode === "edit" && row) editorRef.value?.openEdit(row.id);
  else if (mode === "view" && row) editorRef.value?.openView(row.id);
  else if (mode === "copy" && row) editorRef.value?.openCopy(row.id);
}

async function openDetail(
  row: HyperlinkTaskListItem,
  initialTab: "recipients" | "visit-trend"
): Promise<void> {
  emit("open-detail", {
    taskId: row.id,
    initialTab,
    ...(initialTab === "visit-trend" ? { rangeHours: 24 as const } : {})
  });
  detailTaskId.value = row.id;
  detailTaskName.value = row.taskName;
  detailInitialTab.value = initialTab;
  detailActiveTab.value = initialTab;
  detailVisible.value = true;
  await nextTick();
  detailRef.value?.switchTab(initialTab);
}

function openStartReview(row: HyperlinkTaskListItem): void {
  emit("request-start", row);
  startTask.value = row;
  startReviewVisible.value = true;
}

function refreshAfterMutation(): void {
  void refreshTasks();
}

function handleRowAction(
  action: HyperlinkTaskRowAction,
  row: HyperlinkTaskListItem
): void {
  if (action === "START") {
    openStartReview(row);
    return;
  }
  if (action === "PAUSE" || action === "RESUME" || action === "STOP") {
    void runLifecycleAction(row, action);
    return;
  }
  if (action === "DETAIL") {
    void openDetail(row, "recipients");
    return;
  }
  if (action === "EDIT") return openEditor("edit", row);
  if (action === "VIEW") return openEditor("view", row);
  if (action === "COPY") openEditor("copy", row);
}

onMounted(() => {
  void initialize();
});
</script>

<template>
  <div class="hyperlink-task-page">
    <HyperlinkTaskIntro
      :context="context"
      :loading="contextLoading"
      :error-message="contextErrorMessage"
      @retry="refreshContext"
    />
    <HyperlinkTaskSearchCard
      v-model:search-form="searchForm"
      :countries="countries"
      @search="searchTasks"
      @reset="resetSearch"
    />
    <HyperlinkTaskMetrics :rows="rows" />
    <HyperlinkTaskTable
      v-model:page="page"
      v-model:page-size="pageSize"
      :rows="rows"
      :columns="columns"
      :column-key="columnKey"
      :countries="countries"
      :groups="groups"
      :channels="channels"
      :protocols="protocols"
      :loading="loading"
      :exporting="exporting"
      :error-message="errorMessage"
      :filters-active="filtersActive"
      :total="total"
      :busy-actions="busyActions"
      @refresh="refreshTasks"
      @export="exportTasks"
      @create="openEditor('create')"
      @page-change="refreshTasks"
      @row-action="handleRowAction"
      @visit-trend="openDetail($event, 'visit-trend')"
      @columns-change="persistColumns"
    />

    <HyperlinkTaskEditorDrawer
      ref="editorRef"
      @submitted="refreshAfterMutation"
    />

    <HyperlinkTaskStartReviewDialog
      v-model="startReviewVisible"
      :task="startTask"
      @submitted="refreshAfterMutation"
    />

    <HyperlinkTaskDetailDrawer
      ref="detailRef"
      v-model="detailVisible"
      :task-id="detailTaskId"
      :task-name="detailTaskName"
      :initial-tab="detailInitialTab"
      @tab-change="detailActiveTab = $event"
    >
      <template #accounts="{ taskId }">
        <AccountStatsTab
          :task-id="taskId"
          :active="detailActiveTab === 'accounts'"
          @refresh-summary="detailRef?.refresh()"
        />
      </template>
      <template #clicks="{ taskId, successNum }">
        <AttributionTab :task-id="taskId" :success-num="successNum" />
      </template>
      <template #visit-trend="{ taskId }">
        <VisitTrendTab :task-id="taskId" />
      </template>
      <template #ban-stats="{ taskId }">
        <BanReasonStatsTab :task-id="taskId" />
      </template>
    </HyperlinkTaskDetailDrawer>
  </div>
</template>

<style scoped>
.hyperlink-task-page {
  padding: 14px;
}
</style>

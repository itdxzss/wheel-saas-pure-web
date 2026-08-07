import {
  computed,
  onMounted,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeletePullTasks,
  exportPullTaskGroupLinks,
  exportPullTaskReport,
  exportPullTaskResources,
  endPullTaskStandard,
  endPullTaskStandardExecution,
  getPullTaskDetail,
  getPullTaskStandardDetail,
  listPullTaskStandardExecutions,
  listPullTaskGroups,
  listPullTasks,
  pausePullTask,
  pausePullTaskStandard,
  pausePullTaskStandardExecution,
  runPullTaskGroupOperation,
  runPullTaskRowsOperation,
  resumePullTaskStandard,
  resumePullTaskStandardExecution,
  startPullTask,
  startPullTaskStandard,
  stopPullTask,
  supplementPullTaskRows,
  type PullTaskDetail,
  type PullTaskGroupSource,
  type PullTaskGroupRow,
  type PullTaskGroupStatus,
  type PullTaskRow,
  type PullTaskStatus,
  type PullTaskStandardExecutionSummary,
  type PullTaskStandardExecutionQuery,
  type PullTaskStandardTaskSummary,
  type PullTaskStandardTaskDetail,
  type PullTaskSummary,
  type PullTaskType
} from "@/api/pull-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import { standardExecutionStatus } from "../standard-execution-display";

export interface PullTaskSearchForm {
  id: string;
  keyword: string;
  status: "" | PullTaskStatus;
  taskType: "" | PullTaskType;
  groupSource: "" | PullTaskGroupSource;
  operator: string;
}

export interface PullTaskDetailSearchForm {
  status: "" | PullTaskGroupStatus;
  keyword: string;
  stage: number | "";
  waitResourceType: number | "";
}

export interface PullTaskSupplementForm {
  accountGroupId: number | "";
  countPerGroup: number;
  joinMode: string;
}

export interface PullTaskPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  activeTask: Ref<PullTaskRow | null>;
  advancedOpen: Ref<boolean>;
  deleteSelected: () => Promise<void>;
  deleteTask: (row: PullTaskRow) => Promise<void>;
  detailDrawerOpen: Ref<boolean>;
  detailGroupRows: Ref<PullTaskGroupRow[]>;
  detailLoading: Ref<boolean>;
  detailPage: Ref<number>;
  detailPageSize: Ref<number>;
  detailSearchForm: PullTaskDetailSearchForm;
  detailSelectedCount: ComputedRef<number>;
  detailSummary: ComputedRef<PullTaskSummary>;
  standardTaskSummary: Ref<PullTaskStandardTaskSummary | null>;
  detailTask: Ref<PullTaskDetail | null>;
  detailTotal: Ref<number>;
  exportGroupLinks: () => Promise<void>;
  exportReport: () => Promise<void>;
  exportResources: (kind: string) => Promise<void>;
  loading: Ref<boolean>;
  onDetailSelectionChange: (rows: PullTaskGroupRow[]) => void;
  onSelectionChange: (rows: PullTaskRow[]) => void;
  openDetailDrawer: (row: PullTaskRow) => Promise<void>;
  openSupplementDrawer: () => void;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshDetailGroups: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  resetDetailSearch: () => void;
  resetSearchForm: () => void;
  rows: Ref<PullTaskRow[]>;
  runGroupOperation: (operation: string) => Promise<void>;
  runExecutionAction: (
    row: PullTaskGroupRow,
    action: "pause" | "resume" | "end"
  ) => Promise<void>;
  runRowsOperation: (operation: string) => Promise<void>;
  runTaskAction: (
    row: PullTaskRow,
    action: "start" | "pause" | "resume" | "end"
  ) => Promise<void>;
  searchForm: PullTaskSearchForm;
  searchTasks: () => void;
  selectedCount: ComputedRef<number>;
  supplementDrawerOpen: Ref<boolean>;
  supplementForm: PullTaskSupplementForm;
  supplementPullers: () => Promise<void>;
  toggleAdvanced: () => void;
  total: Ref<number>;
}

function buildSummary(
  task: PullTaskDetail | PullTaskRow | null
): PullTaskSummary {
  return {
    status: task?.status ?? "WAIT_START",
    mode: task?.mode ?? "OLD_LINK",
    groupCount: task?.groupCount ?? 0,
    totalMembers: 0,
    abnormalCount: task?.exceptionStats?.abnormalGroupCount ?? 0,
    joinedCount: task?.pullResult?.joinedSuccessCount ?? 0,
    unusedCount: task?.pullResult?.remainingTargetCount ?? 0,
    expectedPullCount: task?.expectedPullCount ?? 0
  };
}

function downloadTextFile(filename: string, content: string): void {
  downloadBlobFile(
    filename,
    new Blob([content], { type: "text/plain;charset=utf-8" })
  );
}

function normalLink(task: PullTaskRow | null): boolean {
  return task?.taskType === "STANDARD" && task.mode === "NORMAL_LINK";
}

function standardGroupRow(
  execution: PullTaskStandardExecutionSummary
): PullTaskGroupRow {
  return {
    id: execution.executionId,
    seq: execution.seq,
    groupName: execution.groupJid,
    groupLinkUrl: execution.normalizedLink,
    status: standardExecutionStatus(execution),
    memberCount: execution.validMemberCount,
    joinedCount: execution.materialSummary?.successfulCount ?? null,
    failedCount: execution.materialSummary?.failedCount ?? null,
    unusedCount: execution.materialSummary?.remainingCount ?? null,
    expectedPullCount:
      execution.materialSummary?.totalCount ?? execution.validMemberCount,
    blockReason: execution.reasonMessage,
    executionStatus: execution.executionStatus,
    stage: execution.stage,
    manualPaused: execution.manualPaused,
    waitResourceType: execution.waitResourceType,
    reasonCode: execution.reasonCode,
    lastBusinessExecutedAt: execution.lastBusinessExecutedAt,
    materialSummary: execution.materialSummary,
    managers: execution.managers,
    pullers: execution.pullers,
    stations: execution.stations
  };
}

function standardTaskDetail(
  row: PullTaskRow,
  detail: PullTaskStandardTaskDetail
): PullTaskDetail {
  const summary = detail.summary;
  return {
    ...row,
    taskName: detail.taskName,
    status: detail.status,
    groupCount: detail.groupCount,
    expectedPullCount: detail.expectedPullCount,
    remark: detail.remark,
    standardSetting: detail.standardSetting,
    groupSetting: detail.groupSetting,
    summary: summary
      ? {
          status: detail.status,
          mode: row.mode,
          groupCount: summary.totalGroupCount,
          totalMembers: summary.totalMemberCount,
          abnormalCount:
            summary.failedGroupCount +
            summary.abandonedGroupCount +
            summary.waitingResourceGroupCount,
          joinedCount: summary.successfulMemberCount,
          unusedCount: summary.remainingMemberCount,
          expectedPullCount: detail.expectedPullCount
        }
      : null
  };
}

function standardExecutionFilters(
  status: PullTaskGroupStatus | ""
): Partial<PullTaskStandardExecutionQuery> {
  if (status === "PAUSED") return { manualPaused: 1 };
  if (status === "MANAGER_SHORTAGE") {
    return { executionStatus: 3, waitResourceType: 1 };
  }
  if (status === "PULLER_SHORTAGE") {
    return { executionStatus: 3, waitResourceType: 2 };
  }
  if (status === "STATION_SHORTAGE") {
    return { executionStatus: 3, waitResourceType: 3 };
  }
  const statuses: Partial<Record<PullTaskGroupStatus, number>> = {
    WAIT_START: 1,
    RUNNING: 2,
    COMPLETED: 4,
    GROUP_INVALID: 5,
    ENDED: 6
  };
  const executionStatus = status ? statuses[status] : undefined;
  return executionStatus == null ? {} : { executionStatus };
}

export function usePullTaskPage(): PullTaskPageState {
  const searchForm = reactive<PullTaskSearchForm>({
    id: "",
    keyword: "",
    status: "",
    taskType: "",
    groupSource: "",
    operator: ""
  });
  const detailSearchForm = reactive<PullTaskDetailSearchForm>({
    status: "",
    keyword: "",
    stage: "",
    waitResourceType: ""
  });
  const supplementForm = reactive<PullTaskSupplementForm>({
    accountGroupId: "",
    countPerGroup: 1,
    joinMode: "快速踩群链接"
  });

  const rows = ref<PullTaskRow[]>([]);
  const selectedRows = ref<PullTaskRow[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const activeTask = ref<PullTaskRow | null>(null);
  const detailTask = ref<PullTaskDetail | null>(null);
  const standardTaskSummary = ref<PullTaskStandardTaskSummary | null>(null);
  const detailGroupRows = ref<PullTaskGroupRow[]>([]);
  const selectedDetailRows = ref<PullTaskGroupRow[]>([]);
  const loading = ref(false);
  const detailLoading = ref(false);
  const advancedOpen = ref(false);
  const detailDrawerOpen = ref(false);
  const supplementDrawerOpen = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const detailPage = ref(1);
  const detailPageSize = ref(10);
  const detailTotal = ref(0);

  const selectedCount = computed(() => selectedRows.value.length);
  const detailSelectedCount = computed(() => selectedDetailRows.value.length);
  const detailSummary = computed<PullTaskSummary>(
    () =>
      detailTask.value?.summary ??
      buildSummary(detailTask.value ?? activeTask.value)
  );

  function buildQuery() {
    const id = Number(searchForm.id);
    return {
      page: page.value,
      pageSize: pageSize.value,
      id: searchForm.id.trim() && Number.isFinite(id) ? id : undefined,
      keyword: searchForm.keyword.trim() || undefined,
      status: searchForm.status,
      taskType: searchForm.taskType,
      groupSource: searchForm.groupSource,
      operator: searchForm.operator.trim() || undefined
    };
  }

  async function refreshTasks(): Promise<void> {
    selectedRows.value = [];
    loading.value = true;
    try {
      const result = await listPullTasks(buildQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "拉群任务加载失败"));
    } finally {
      loading.value = false;
    }
  }

  async function loadAccountGroupOptions(): Promise<void> {
    try {
      const result = await listAccountGroups({ page: 1, pageSize: 500 });
      accountGroups.value = result.list ?? [];
    } catch (error) {
      accountGroups.value = [];
      ElMessage.error(apiErrorMessage(error, "账号分组加载失败"));
    }
  }

  function searchTasks(): void {
    page.value = 1;
    void refreshTasks();
  }

  function resetSearchForm(): void {
    searchForm.id = "";
    searchForm.keyword = "";
    searchForm.status = "";
    searchForm.taskType = "";
    searchForm.groupSource = "";
    searchForm.operator = "";
    searchTasks();
  }

  function toggleAdvanced(): void {
    advancedOpen.value = !advancedOpen.value;
  }

  async function refreshDetailGroups(): Promise<void> {
    if (!activeTask.value) return;
    detailLoading.value = true;
    selectedDetailRows.value = [];
    try {
      if (normalLink(activeTask.value)) {
        const taskId = activeTask.value.id;
        const statusFilters = standardExecutionFilters(detailSearchForm.status);
        const [detail, executionPage] = await Promise.all([
          getPullTaskStandardDetail(taskId),
          listPullTaskStandardExecutions(taskId, {
            page: detailPage.value,
            pageSize: detailPageSize.value,
            keyword: detailSearchForm.keyword.trim() || undefined,
            ...statusFilters,
            stage: detailSearchForm.stage || undefined,
            waitResourceType:
              detailSearchForm.waitResourceType ||
              statusFilters.waitResourceType
          })
        ]);
        detailTask.value = standardTaskDetail(activeTask.value, detail);
        standardTaskSummary.value = detail.summary;
        detailGroupRows.value = (executionPage.list ?? []).map(
          standardGroupRow
        );
        detailTotal.value = executionPage.total ?? 0;
        return;
      }
      const result = await listPullTaskGroups(activeTask.value.id, {
        page: detailPage.value,
        pageSize: detailPageSize.value,
        status: detailSearchForm.status,
        keyword: detailSearchForm.keyword.trim()
      });
      detailGroupRows.value = result.list ?? [];
      detailTotal.value = result.total ?? 0;
    } catch (error) {
      detailGroupRows.value = [];
      detailTotal.value = 0;
      ElMessage.error(apiErrorMessage(error, "拉群任务明细加载失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  async function openDetailDrawer(row: PullTaskRow): Promise<void> {
    activeTask.value = row;
    detailTask.value = null;
    standardTaskSummary.value = null;
    detailGroupRows.value = [];
    detailSearchForm.status = "";
    detailSearchForm.keyword = "";
    detailSearchForm.stage = "";
    detailSearchForm.waitResourceType = "";
    detailPage.value = 1;
    detailDrawerOpen.value = true;
    if (!normalLink(row)) {
      detailLoading.value = true;
      try {
        detailTask.value = await getPullTaskDetail(row.id);
      } catch (error) {
        ElMessage.error(apiErrorMessage(error, "拉群任务详情加载失败"));
      } finally {
        detailLoading.value = false;
      }
    }
    await refreshDetailGroups();
  }

  function resetDetailSearch(): void {
    detailSearchForm.status = "";
    detailSearchForm.keyword = "";
    detailSearchForm.stage = "";
    detailSearchForm.waitResourceType = "";
    detailPage.value = 1;
    void refreshDetailGroups();
  }

  function onSelectionChange(selection: PullTaskRow[]): void {
    selectedRows.value = selection;
  }

  function onDetailSelectionChange(selection: PullTaskGroupRow[]): void {
    selectedDetailRows.value = selection;
  }

  async function runTaskAction(
    row: PullTaskRow,
    action: "start" | "pause" | "resume" | "end"
  ): Promise<void> {
    if (action === "end") {
      try {
        await ElMessageBox.confirm(
          "结束后任务不可恢复，未提交的动作将被取消，确认结束任务？",
          "结束任务",
          {
            type: "warning",
            confirmButtonText: "结束",
            cancelButtonText: "取消"
          }
        );
      } catch {
        return;
      }
    }
    try {
      if (normalLink(row)) {
        if (action === "start") await startPullTaskStandard(row.id);
        if (action === "pause") await pausePullTaskStandard(row.id);
        if (action === "resume") await resumePullTaskStandard(row.id);
        if (action === "end") await endPullTaskStandard(row.id);
        await refreshTasks();
        const refreshed = rows.value.find(item => item.id === row.id);
        if (activeTask.value?.id === row.id && refreshed) {
          activeTask.value = refreshed;
          if (detailDrawerOpen.value) await refreshDetailGroups();
        }
        ElMessage.success("任务操作已提交");
        return;
      }
      const updated =
        action === "start"
          ? await startPullTask(row.id)
          : action === "pause"
            ? await pausePullTask(row.id)
            : await stopPullTask(row.id);
      rows.value = rows.value.map(item =>
        item.id === row.id ? updated : item
      );
      if (activeTask.value?.id === row.id) activeTask.value = updated;
      ElMessage.success("任务操作已提交");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "任务操作失败"));
    }
  }

  async function runExecutionAction(
    row: PullTaskGroupRow,
    action: "pause" | "resume" | "end"
  ): Promise<void> {
    const task = activeTask.value;
    if (!task || !normalLink(task)) return;
    if (action === "end") {
      try {
        await ElMessageBox.confirm(
          "结束后该群不可恢复，确认结束这条群执行？",
          "结束群执行",
          {
            type: "warning",
            confirmButtonText: "结束",
            cancelButtonText: "取消"
          }
        );
      } catch {
        return;
      }
    }
    try {
      if (action === "pause") {
        await pausePullTaskStandardExecution(task.id, row.id);
      }
      if (action === "resume") {
        await resumePullTaskStandardExecution(task.id, row.id);
      }
      if (action === "end") {
        await endPullTaskStandardExecution(task.id, row.id);
      }
      await Promise.all([refreshDetailGroups(), refreshTasks()]);
      ElMessage.success("群执行操作已提交");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "群执行操作失败"));
    }
  }

  async function deleteSelected(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    if (
      selectedRows.value.some(row => !row.allowedActions.includes("DELETE"))
    ) {
      ElMessage.warning("所选任务中包含当前不可删除的状态");
      return;
    }
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedRows.value.length} 条拉群任务？`,
        "删除拉群任务",
        {
          type: "warning",
          confirmButtonText: "删除",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }
    try {
      await batchDeletePullTasks(selectedRows.value.map(row => row.id));
      ElMessage.success("拉群任务已删除");
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量删除拉群任务失败"));
    }
  }

  async function deleteTask(row: PullTaskRow): Promise<void> {
    selectedRows.value = [row];
    await deleteSelected();
  }

  function selectedDetailIds(): number[] {
    return selectedDetailRows.value.map(row => row.id);
  }

  function openSupplementDrawer(): void {
    if (selectedDetailRows.value.length === 0) {
      ElMessage.warning("请先选择需要补充拉手的群组");
      return;
    }
    supplementForm.accountGroupId = "";
    supplementForm.countPerGroup = 1;
    supplementForm.joinMode = "快速踩群链接";
    supplementDrawerOpen.value = true;
  }

  async function supplementPullers(): Promise<void> {
    if (!activeTask.value) return;
    if (!supplementForm.accountGroupId) {
      ElMessage.warning("请选择拉手分组");
      return;
    }
    try {
      await supplementPullTaskRows(activeTask.value.id, {
        groupRowIds: selectedDetailIds(),
        accountGroupId: supplementForm.accountGroupId,
        countPerGroup: supplementForm.countPerGroup,
        joinMode: supplementForm.joinMode
      });
      ElMessage.success("补充拉手已提交");
      supplementDrawerOpen.value = false;
      await refreshDetailGroups();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "补充拉手失败"));
    }
  }

  async function runGroupOperation(operation: string): Promise<void> {
    if (!activeTask.value) return;
    if (selectedDetailRows.value.length === 0) {
      ElMessage.warning("请先选择群组");
      return;
    }
    try {
      await runPullTaskGroupOperation(activeTask.value.id, {
        groupRowIds: selectedDetailIds(),
        operation
      });
      ElMessage.success("群组操作已提交");
      await refreshDetailGroups();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量群组操作失败"));
    }
  }

  async function runRowsOperation(operation: string): Promise<void> {
    if (!activeTask.value) return;
    if (selectedDetailRows.value.length === 0) {
      ElMessage.warning("请先选择群组任务");
      return;
    }
    try {
      await runPullTaskRowsOperation(activeTask.value.id, {
        groupRowIds: selectedDetailIds(),
        operation
      });
      ElMessage.success("批量任务操作已提交");
      await refreshDetailGroups();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量任务操作失败"));
    }
  }

  async function exportReport(): Promise<void> {
    if (!activeTask.value) return;
    try {
      const result = await exportPullTaskReport(
        activeTask.value.id,
        selectedDetailIds()
      );
      downloadTextFile(result.filename, result.content);
      ElMessage.success("导出报表已生成");
      await refreshDetailGroups();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "导出报表失败"));
    }
  }

  async function exportGroupLinks(): Promise<void> {
    if (!activeTask.value) return;
    try {
      const result = await exportPullTaskGroupLinks(
        activeTask.value.id,
        selectedDetailIds()
      );
      downloadTextFile(result.filename, result.content);
      ElMessage.success("群链接已导出");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "导出群链接失败"));
    }
  }

  async function exportResources(kind: string): Promise<void> {
    if (!activeTask.value) return;
    try {
      const result = await exportPullTaskResources(
        activeTask.value.id,
        kind,
        selectedDetailIds()
      );
      downloadTextFile(result.filename, result.content);
      ElMessage.success("任务资源已导出");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "导出任务资源失败"));
    }
  }

  onMounted(() => {
    void refreshTasks();
    void loadAccountGroupOptions();
  });

  return {
    accountGroups,
    activeTask,
    advancedOpen,
    deleteSelected,
    deleteTask,
    detailDrawerOpen,
    detailGroupRows,
    detailLoading,
    detailPage,
    detailPageSize,
    detailSearchForm,
    detailSelectedCount,
    detailSummary,
    standardTaskSummary,
    detailTask,
    detailTotal,
    exportGroupLinks,
    exportReport,
    exportResources,
    loading,
    onDetailSelectionChange,
    onSelectionChange,
    openDetailDrawer,
    openSupplementDrawer,
    page,
    pageSize,
    refreshDetailGroups,
    refreshTasks,
    resetDetailSearch,
    resetSearchForm,
    rows,
    runExecutionAction,
    runGroupOperation,
    runRowsOperation,
    runTaskAction,
    searchForm,
    searchTasks,
    selectedCount,
    supplementDrawerOpen,
    supplementForm,
    supplementPullers,
    toggleAdvanced,
    total
  };
}

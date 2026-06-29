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
  createPullTask,
  exportPullTaskGroupLinks,
  exportPullTaskReport,
  exportPullTaskResources,
  getPullTaskDetail,
  listPullTaskGroupLinks,
  listPullTaskGroups,
  listPullTaskLinkGroups,
  listPullTasks,
  pausePullTask,
  runPullTaskGroupOperation,
  runPullTaskRowsOperation,
  startPullTask,
  stopPullTask,
  supplementPullTaskRows,
  type CreatePullTaskRequest,
  type PullTaskDetail,
  type PullTaskGroupRow,
  type PullTaskGroupStatus,
  type PullTaskLinkGroup,
  type PullTaskLinkOption,
  type PullTaskMode,
  type PullTaskRow,
  type PullTaskStatus,
  type PullTaskSummary
} from "@/api/pull-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";

export interface PullTaskSearchForm {
  id: string;
  keyword: string;
  status: "" | PullTaskStatus;
  mode: "" | PullTaskMode;
  orderState: "" | "SUBMITTED" | "UNSUBMITTED";
  banState: "" | "NORMAL" | "BANNED";
  operator: string;
}

export interface PullTaskCreateForm {
  taskName: string;
  subMode: "OLD_LINK" | "CREATE_NEW";
  useAdmin: boolean;
  wsLinkGroupId: number | "";
  groupLinkIds: number[];
  pastedLinks: string;
  templateId: number;
  adminGroupId: number | "";
  pullerGroupId: number | "";
  stationOneGroupId: number | "";
  stationTwoGroupId: number | "";
  stationThreeGroupId: number | "";
  adminPerGroup: number;
  pullerPerGroup: number;
  stationOnePerGroup: number;
  stationTwoPerGroup: number;
  stationThreePerGroup: number;
  autoSupplementAdminCount: number;
  autoSupplementAdminTimes: number;
  autoSupplementPullerCount: number;
  autoSupplementPullerTimes: number;
  pullerFinishGroupId: number | "";
  adminFinishGroupId: number | "";
  autoStart: boolean;
  pullerEnterFirst: boolean;
  auditMode: string;
  noReleaseAfterPull: boolean;
  pullerSyncMode: string;
  waitBeforePullSeconds: number;
  concurrentTaskCount: number;
  firstPullCount: number;
  pullCountMin: number;
  pullCountMax: number;
  pullIntervalSeconds: number;
  pullerMaxTotal: number;
  pullerThreadCount: number;
  stationJoinMode: string;
  pullerJoinMode: string;
  pullerQuitMode: string;
  adminQuitMode: string;
  stationQuitAfterDone: boolean;
  groupName: string;
  mute: boolean;
  linkPermission: string;
  editPermission: string;
  autoCloseInvite: boolean;
  materialText: string;
  waterText: string;
  waterMode: string;
  remark: string;
}

export interface PullTaskDetailSearchForm {
  status: "" | PullTaskGroupStatus;
  keyword: string;
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
  createDrawerOpen: Ref<boolean>;
  createForm: PullTaskCreateForm;
  createTask: () => Promise<void>;
  deleteSelected: () => Promise<void>;
  detailDrawerOpen: Ref<boolean>;
  detailGroupRows: Ref<PullTaskGroupRow[]>;
  detailLoading: Ref<boolean>;
  detailPage: Ref<number>;
  detailPageSize: Ref<number>;
  detailSearchForm: PullTaskDetailSearchForm;
  detailSelectedCount: ComputedRef<number>;
  detailSummary: ComputedRef<PullTaskSummary>;
  detailTask: Ref<PullTaskDetail | null>;
  detailTotal: Ref<number>;
  exportGroupLinks: () => Promise<void>;
  exportReport: () => Promise<void>;
  exportResources: (kind: string) => Promise<void>;
  groupLinkOptions: Ref<PullTaskLinkOption[]>;
  groupLinksLoading: Ref<boolean>;
  linkGroups: Ref<PullTaskLinkGroup[]>;
  loadGroupLinks: () => Promise<void>;
  loading: Ref<boolean>;
  onDetailSelectionChange: (rows: PullTaskGroupRow[]) => void;
  onSelectionChange: (rows: PullTaskRow[]) => void;
  openCreateDrawer: () => Promise<void>;
  openDetailDrawer: (row: PullTaskRow) => Promise<void>;
  openSupplementDrawer: () => void;
  page: Ref<number>;
  pageSize: Ref<number>;
  readMaterialFile: (file?: File) => Promise<void>;
  readWaterFile: (file?: File) => Promise<void>;
  refreshDetailGroups: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  resetDetailSearch: () => void;
  resetSearchForm: () => void;
  rows: Ref<PullTaskRow[]>;
  runGroupOperation: (operation: string) => Promise<void>;
  runRowsOperation: (operation: string) => Promise<void>;
  runTaskAction: (
    row: PullTaskRow,
    action: "start" | "pause" | "stop"
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

function emptyCreateForm(): PullTaskCreateForm {
  return {
    taskName: "",
    subMode: "OLD_LINK",
    useAdmin: true,
    wsLinkGroupId: "",
    groupLinkIds: [],
    pastedLinks: "",
    templateId: 0,
    adminGroupId: "",
    pullerGroupId: "",
    stationOneGroupId: "",
    stationTwoGroupId: "",
    stationThreeGroupId: "",
    adminPerGroup: 1,
    pullerPerGroup: 1,
    stationOnePerGroup: 0,
    stationTwoPerGroup: 0,
    stationThreePerGroup: 0,
    autoSupplementAdminCount: 0,
    autoSupplementAdminTimes: 0,
    autoSupplementPullerCount: 0,
    autoSupplementPullerTimes: 0,
    pullerFinishGroupId: "",
    adminFinishGroupId: "",
    autoStart: false,
    pullerEnterFirst: true,
    auditMode: "关闭审核模式进群",
    noReleaseAfterPull: false,
    pullerSyncMode: "单个同步",
    waitBeforePullSeconds: 3,
    concurrentTaskCount: 1,
    firstPullCount: 1,
    pullCountMin: 3,
    pullCountMax: 5,
    pullIntervalSeconds: 6,
    pullerMaxTotal: 50,
    pullerThreadCount: 1,
    stationJoinMode: "快速踩群链接",
    pullerJoinMode: "快速踩群链接",
    pullerQuitMode: "不退拉手",
    adminQuitMode: "不退管理员",
    stationQuitAfterDone: false,
    groupName: "",
    mute: false,
    linkPermission: "所有成员可邀请",
    editPermission: "仅管理员可编辑",
    autoCloseInvite: false,
    materialText: "",
    waterText: "",
    waterMode: "一号多群",
    remark: ""
  };
}

function idOrNull(value: number | ""): number | null {
  return typeof value === "number" && value > 0 ? value : null;
}

function linesOf(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function buildSummary(
  task: PullTaskDetail | PullTaskRow | null
): PullTaskSummary {
  return {
    status: task?.status ?? "WAIT_START",
    mode: task?.mode ?? "OLD_LINK",
    groupCount: task?.groupCount ?? 0,
    totalMembers: task?.totalMembers ?? 0,
    abnormalCount: task?.failedCount ?? 0,
    joinedCount: task?.joinedCount ?? 0,
    unusedCount: task?.unusedCount ?? 0,
    expectedPullCount: task?.expectedPullCount ?? 0
  };
}

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function usePullTaskPage(): PullTaskPageState {
  const searchForm = reactive<PullTaskSearchForm>({
    id: "",
    keyword: "",
    status: "",
    mode: "",
    orderState: "",
    banState: "",
    operator: ""
  });
  const createForm = reactive<PullTaskCreateForm>(emptyCreateForm());
  const detailSearchForm = reactive<PullTaskDetailSearchForm>({
    status: "",
    keyword: ""
  });
  const supplementForm = reactive<PullTaskSupplementForm>({
    accountGroupId: "",
    countPerGroup: 1,
    joinMode: "快速踩群链接"
  });

  const rows = ref<PullTaskRow[]>([]);
  const selectedRows = ref<PullTaskRow[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const linkGroups = ref<PullTaskLinkGroup[]>([]);
  const groupLinkOptions = ref<PullTaskLinkOption[]>([]);
  const activeTask = ref<PullTaskRow | null>(null);
  const detailTask = ref<PullTaskDetail | null>(null);
  const detailGroupRows = ref<PullTaskGroupRow[]>([]);
  const selectedDetailRows = ref<PullTaskGroupRow[]>([]);
  const loading = ref(false);
  const detailLoading = ref(false);
  const groupLinksLoading = ref(false);
  const advancedOpen = ref(false);
  const createDrawerOpen = ref(false);
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
      mode: searchForm.mode,
      orderState: searchForm.orderState,
      banState: searchForm.banState,
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

  async function loadOptions(): Promise<void> {
    const [groupResult, linkGroupResult] = await Promise.allSettled([
      listAccountGroups({ page: 1, pageSize: 500 }),
      listPullTaskLinkGroups()
    ]);
    if (groupResult.status === "fulfilled") {
      accountGroups.value = groupResult.value.list ?? [];
    } else {
      ElMessage.error(apiErrorMessage(groupResult.reason, "账号分组加载失败"));
    }
    if (linkGroupResult.status === "fulfilled") {
      linkGroups.value = linkGroupResult.value ?? [];
    } else {
      linkGroups.value = [];
      ElMessage.error(
        apiErrorMessage(linkGroupResult.reason, "WS链接分组加载失败")
      );
    }
  }

  async function loadGroupLinks(): Promise<void> {
    createForm.groupLinkIds = [];
    groupLinkOptions.value = [];
    if (!createForm.wsLinkGroupId) return;
    groupLinksLoading.value = true;
    try {
      const result = await listPullTaskGroupLinks({
        page: 1,
        pageSize: 500,
        labelId: createForm.wsLinkGroupId
      });
      groupLinkOptions.value = result.list ?? [];
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "群链接加载失败"));
    } finally {
      groupLinksLoading.value = false;
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
    searchForm.mode = "";
    searchForm.orderState = "";
    searchForm.banState = "";
    searchForm.operator = "";
    searchTasks();
  }

  function toggleAdvanced(): void {
    advancedOpen.value = !advancedOpen.value;
  }

  async function openCreateDrawer(): Promise<void> {
    Object.assign(createForm, emptyCreateForm());
    groupLinkOptions.value = [];
    await loadOptions();
    createDrawerOpen.value = true;
  }

  function toCreatePayload(): CreatePullTaskRequest {
    return {
      taskName: createForm.taskName.trim(),
      subMode: createForm.subMode,
      useAdmin: createForm.useAdmin,
      wsLinkGroupId: idOrNull(createForm.wsLinkGroupId),
      groupLinkIds: createForm.groupLinkIds,
      pastedLinks: linesOf(createForm.pastedLinks),
      templateId: idOrNull(createForm.templateId),
      adminGroupId: idOrNull(createForm.adminGroupId),
      pullerGroupId: idOrNull(createForm.pullerGroupId),
      stationOneGroupId: idOrNull(createForm.stationOneGroupId),
      stationTwoGroupId: idOrNull(createForm.stationTwoGroupId),
      stationThreeGroupId: idOrNull(createForm.stationThreeGroupId),
      adminPerGroup: createForm.adminPerGroup,
      pullerPerGroup: createForm.pullerPerGroup,
      stationOnePerGroup: createForm.stationOnePerGroup,
      stationTwoPerGroup: createForm.stationTwoPerGroup,
      stationThreePerGroup: createForm.stationThreePerGroup,
      autoSupplementAdminCount: createForm.autoSupplementAdminCount,
      autoSupplementAdminTimes: createForm.autoSupplementAdminTimes,
      autoSupplementPullerCount: createForm.autoSupplementPullerCount,
      autoSupplementPullerTimes: createForm.autoSupplementPullerTimes,
      pullerFinishGroupId: idOrNull(createForm.pullerFinishGroupId),
      adminFinishGroupId: idOrNull(createForm.adminFinishGroupId),
      autoStart: createForm.autoStart,
      pullerEnterFirst: createForm.pullerEnterFirst,
      auditMode: createForm.auditMode,
      noReleaseAfterPull: createForm.noReleaseAfterPull,
      pullerSyncMode: createForm.pullerSyncMode,
      waitBeforePullSeconds: createForm.waitBeforePullSeconds,
      concurrentTaskCount: createForm.concurrentTaskCount,
      firstPullCount: createForm.firstPullCount,
      pullCountMin: createForm.pullCountMin,
      pullCountMax: createForm.pullCountMax,
      pullIntervalSeconds: createForm.pullIntervalSeconds,
      pullerMaxTotal: createForm.pullerMaxTotal,
      pullerThreadCount: createForm.pullerThreadCount,
      stationJoinMode: createForm.stationJoinMode,
      pullerJoinMode: createForm.pullerJoinMode,
      pullerQuitMode: createForm.pullerQuitMode,
      adminQuitMode: createForm.adminQuitMode,
      stationQuitAfterDone: createForm.stationQuitAfterDone,
      materialText: createForm.materialText.trim(),
      waterText: createForm.waterText.trim() || null,
      waterMode: createForm.waterMode,
      groupProfile: {
        groupName: createForm.groupName.trim() || null,
        mute: createForm.mute,
        linkPermission: createForm.linkPermission,
        editPermission: createForm.editPermission,
        autoCloseInvite: createForm.autoCloseInvite
      },
      remark: createForm.remark.trim() || null
    };
  }

  async function createTask(): Promise<void> {
    if (!createForm.taskName.trim()) {
      ElMessage.warning("请填写任务名称");
      return;
    }
    if (
      createForm.subMode === "OLD_LINK" &&
      createForm.groupLinkIds.length === 0 &&
      linesOf(createForm.pastedLinks).length === 0
    ) {
      ElMessage.warning("老群链接任务请选择或粘贴群链接");
      return;
    }
    if (!createForm.pullerGroupId) {
      ElMessage.warning("请选择拉手分组");
      return;
    }
    if (!createForm.materialText.trim()) {
      ElMessage.warning("请粘贴或上传料子数据");
      return;
    }
    try {
      await createPullTask(toCreatePayload());
      ElMessage.success("拉群任务已创建");
      createDrawerOpen.value = false;
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "拉群任务创建失败"));
    }
  }

  async function readFileText(file?: File): Promise<string> {
    if (!file) return "";
    return file.text();
  }

  async function readMaterialFile(file?: File): Promise<void> {
    const text = await readFileText(file);
    if (!text) return;
    createForm.materialText = text;
    ElMessage.success("料子文件已读取");
  }

  async function readWaterFile(file?: File): Promise<void> {
    const text = await readFileText(file);
    if (!text) return;
    createForm.waterText = text;
    ElMessage.success("水军文件已读取");
  }

  async function refreshDetailGroups(): Promise<void> {
    if (!activeTask.value) return;
    detailLoading.value = true;
    selectedDetailRows.value = [];
    try {
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
    detailGroupRows.value = [];
    detailSearchForm.status = "";
    detailSearchForm.keyword = "";
    detailPage.value = 1;
    detailDrawerOpen.value = true;
    detailLoading.value = true;
    try {
      detailTask.value = await getPullTaskDetail(row.id);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "拉群任务详情加载失败"));
    } finally {
      detailLoading.value = false;
    }
    await refreshDetailGroups();
  }

  function resetDetailSearch(): void {
    detailSearchForm.status = "";
    detailSearchForm.keyword = "";
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
    action: "start" | "pause" | "stop"
  ): Promise<void> {
    try {
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

  async function deleteSelected(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    if (selectedRows.value.some(row => row.status !== "COMPLETED")) {
      ElMessage.warning("请手动结束任务后再删除，仅已完成任务可删");
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
  });

  return {
    accountGroups,
    activeTask,
    advancedOpen,
    createDrawerOpen,
    createForm,
    createTask,
    deleteSelected,
    detailDrawerOpen,
    detailGroupRows,
    detailLoading,
    detailPage,
    detailPageSize,
    detailSearchForm,
    detailSelectedCount,
    detailSummary,
    detailTask,
    detailTotal,
    exportGroupLinks,
    exportReport,
    exportResources,
    groupLinkOptions,
    groupLinksLoading,
    linkGroups,
    loadGroupLinks,
    loading,
    onDetailSelectionChange,
    onSelectionChange,
    openCreateDrawer,
    openDetailDrawer,
    openSupplementDrawer,
    page,
    pageSize,
    readMaterialFile,
    readWaterFile,
    refreshDetailGroups,
    refreshTasks,
    resetDetailSearch,
    resetSearchForm,
    rows,
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

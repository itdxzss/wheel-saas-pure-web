import {
  computed,
  onMounted,
  onScopeDispose,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type Ref
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteMarketingTasks,
  closeMarketingTask,
  createMarketingTask,
  fetchMarketingAccountGroups,
  fetchMarketingAccountTree,
  getMarketingTaskDetail,
  listMarketingTasks,
  pauseMarketingTask,
  resumeMarketingTask,
  startMarketingTask,
  updateTaskMarketingTemplate,
  type MarketingAccountTree,
  type MarketingNewGroupDelayUnit,
  type MarketingSelection,
  type MarketingTaskDetail,
  type MarketingTaskRow,
  type MarketingTaskStartMode,
  type MarketingTaskStatus,
  type MarketingTreeAccount
} from "@/api/marketing-task";
import {
  listMarketingTemplates,
  type MarketingTemplateButton,
  type MarketingTemplateLinkMode,
  type MarketingTemplateRow,
  type MarketingTemplateWrite
} from "@/api/marketing-template";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";
import { canModifyTaskMaterial } from "../constants";

export interface GroupMarketingSearchForm {
  id: string;
  keyword: string;
  status: "" | MarketingTaskStatus;
  startTime: string;
  endTime: string;
}

export interface GroupMarketingCreateForm {
  taskName: string;
  accountGroupId: number | "";
  marketingTemplateId: number | "";
  startMode: MarketingTaskStartMode;
  accountGroupSendAt: string | number;
  taskStartAt: string | number;
  taskEndAt: string | number;
  sendPerRound: number;
  accountGroupSendIntervalSeconds: number;
  sendIntervalSeconds: number;
  onlineCheckEnabled: boolean;
  abnormalGroupSkipped: boolean;
  autoRetryEnabled: boolean;
  newGroupDelayEnabled: boolean;
  newGroupDelayValue: number;
  newGroupDelayUnit: MarketingNewGroupDelayUnit;
  remark: string;
}

export interface GroupMarketingCreatePayload {
  form: GroupMarketingCreateForm;
  selections: MarketingSelection[];
}

export interface GroupMarketingTaskPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  activeTask: Ref<MarketingTaskRow | null>;
  advancedOpen: Ref<boolean>;
  closeCreateDrawer: () => void;
  closeTask: (row: MarketingTaskRow) => Promise<void>;
  closeDetailDrawer: () => void;
  closeMaterialDrawer: () => void;
  createDrawerOpen: Ref<boolean>;
  createForm: GroupMarketingCreateForm;
  createTask: (payload: GroupMarketingCreatePayload) => Promise<void>;
  deleteSelected: () => Promise<void>;
  detailDrawerOpen: Ref<boolean>;
  detailLoading: Ref<boolean>;
  detailTask: Ref<MarketingTaskDetail | null>;
  loadTasks: () => Promise<void>;
  loadAccountTree: (groupId: number | "") => Promise<void>;
  loadAccountGroups: (
    accountId: number
  ) => Promise<MarketingTreeAccount | null>;
  loading: Ref<boolean>;
  materialDrawerOpen: Ref<boolean>;
  materialForm: Ref<MarketingTemplateWrite>;
  materialSubmitting: Ref<boolean>;
  marketingTemplates: Ref<MarketingTemplateRow[]>;
  onSelectionChange: (rows: MarketingTaskRow[]) => void;
  openCreateDrawer: () => Promise<void>;
  openDetailById: (taskId: number) => Promise<void>;
  openDetailDrawer: (row: MarketingTaskRow) => Promise<void>;
  openMaterialDrawer: (row: MarketingTaskRow) => Promise<void>;
  page: Ref<number>;
  pageSize: Ref<number>;
  pauseTask: (row: MarketingTaskRow) => Promise<void>;
  refreshTasks: () => Promise<void>;
  resetSearchForm: () => void;
  resumeTask: (row: MarketingTaskRow) => Promise<void>;
  rows: Ref<MarketingTaskRow[]>;
  searchForm: GroupMarketingSearchForm;
  searchTasks: () => void;
  selectedCount: ComputedRef<number>;
  startTask: (row: MarketingTaskRow) => Promise<void>;
  submitMaterialUpdate: () => Promise<void>;
  toggleAdvanced: () => void;
  total: Ref<number>;
  treeAccounts: Ref<MarketingTreeAccount[]>;
  treeLoading: Ref<boolean>;
}

const ACCOUNT_GROUP_SEND_LOOKBACK_MS = 72 * 60 * 60 * 1000;
const DETAIL_POLL_INTERVAL_MS = 5000;

export function endOfDayTimestamp(date = new Date()): number {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 0);
  return endOfDay.getTime();
}

function emptyCreateForm(): GroupMarketingCreateForm {
  return {
    taskName: "",
    accountGroupId: "",
    marketingTemplateId: "",
    startMode: "PENDING",
    accountGroupSendAt: "",
    taskStartAt: "",
    taskEndAt: endOfDayTimestamp(),
    sendPerRound: 1,
    accountGroupSendIntervalSeconds: 0.5,
    sendIntervalSeconds: 30,
    onlineCheckEnabled: true,
    abnormalGroupSkipped: true,
    autoRetryEnabled: false,
    newGroupDelayEnabled: false,
    newGroupDelayValue: 30,
    newGroupDelayUnit: "MINUTE",
    remark: ""
  };
}

function emptyMaterialForm(): MarketingTemplateWrite {
  return {
    templateName: "",
    linkMode: 1,
    textType: "",
    imageFileId: null,
    content: "",
    bodyText: "",
    mentionAll: false,
    buttons: [],
    promotionLink: "",
    remark: ""
  };
}

function copyMaterialForm(
  template: MarketingTemplateRow
): MarketingTemplateWrite {
  return {
    templateName: template.templateName,
    linkMode: template.linkMode,
    textType: template.textType ?? "",
    imageFileId: template.imageFileId ?? null,
    content: template.content,
    bodyText: template.bodyText,
    mentionAll: template.mentionAll,
    buttons: template.buttons.map((button: MarketingTemplateButton) => ({
      ...button
    })),
    promotionLink: template.promotionLink ?? "",
    remark: template.remark ?? ""
  };
}

function validateMaterialForm(form: MarketingTemplateWrite): string {
  if (!form.templateName.trim()) return "模板名称不能为空";
  if (!form.content.trim()) return "内容不能为空";
  if (form.linkMode === 2 && form.buttons.length === 0) {
    return "按钮超链消息类型至少配置 1 个按钮";
  }
  const invalidButton = form.buttons.find(
    button =>
      !button.label.trim() || (button.type !== "quick" && !button.value.trim())
  );
  return invalidButton ? "按钮文字和参数不能为空" : "";
}

function timestamp(value: string | number): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function disableAccountGroupSendDate(date: Date): boolean {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() < Date.now() - ACCOUNT_GROUP_SEND_LOOKBACK_MS;
}

function createStartMode(taskStartAt: number): MarketingTaskStartMode {
  return taskStartAt > Date.now() ? "PENDING" : "IMMEDIATE";
}

function isValidAccountGroupSendIntervalSeconds(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0.5 &&
    value <= 3 &&
    Number.isInteger(value * 10)
  );
}

function isValidNewGroupDelay(form: GroupMarketingCreateForm): boolean {
  if (!form.newGroupDelayEnabled) return true;
  const max = form.newGroupDelayUnit === "MINUTE" ? 60 : 24;
  return (
    Number.isInteger(form.newGroupDelayValue) &&
    form.newGroupDelayValue >= 1 &&
    form.newGroupDelayValue <= max
  );
}

function validateLifecycleTimes(form: GroupMarketingCreateForm): {
  accountGroupSendAt?: number;
  taskStartAt: number;
  taskEndAt: number;
} | null {
  const accountGroupSendAt = timestamp(form.accountGroupSendAt);
  const taskStartAt = timestamp(form.taskStartAt);
  const taskEndAt = timestamp(form.taskEndAt);
  if (!taskStartAt) {
    ElMessage.warning("请选择任务开始时间");
    return null;
  }
  if (!taskEndAt) {
    ElMessage.warning("请选择任务结束时间");
    return null;
  }
  if (taskEndAt <= Date.now()) {
    ElMessage.warning("任务结束时间必须晚于当前时间");
    return null;
  }
  if (taskEndAt <= taskStartAt) {
    ElMessage.warning("任务结束时间必须晚于任务开始时间");
    return null;
  }
  if (
    accountGroupSendAt != null &&
    accountGroupSendAt < Date.now() - ACCOUNT_GROUP_SEND_LOOKBACK_MS
  ) {
    ElMessage.warning("账号群组发送时间最多支持追溯72小时");
    return null;
  }
  return { accountGroupSendAt, taskStartAt, taskEndAt };
}

function buildButtonsForMode(
  linkMode: MarketingTemplateLinkMode,
  buttons: MarketingTemplateButton[]
): MarketingTemplateButton[] {
  if (linkMode === 2) {
    return buttons.length
      ? buttons
      : [{ type: "link", label: "查看详情", value: "" }];
  }
  return [];
}

export function useGroupMarketingTaskPage(): GroupMarketingTaskPageState {
  const searchForm = reactive<GroupMarketingSearchForm>({
    id: "",
    keyword: "",
    status: "",
    startTime: "",
    endTime: ""
  });
  const createForm = reactive<GroupMarketingCreateForm>(emptyCreateForm());
  const rows = ref<MarketingTaskRow[]>([]);
  const selectedRows = ref<MarketingTaskRow[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const marketingTemplates = ref<MarketingTemplateRow[]>([]);
  const treeAccounts = ref<MarketingTreeAccount[]>([]);
  const loadedGroupAccounts = ref<Map<number, MarketingTreeAccount>>(new Map());
  const detailTask = ref<MarketingTaskDetail | null>(null);
  const activeTask = ref<MarketingTaskRow | null>(null);
  const materialForm = ref<MarketingTemplateWrite>(emptyMaterialForm());
  const loading = ref(false);
  const treeLoading = ref(false);
  const detailLoading = ref(false);
  const materialSubmitting = ref(false);
  const advancedOpen = ref(false);
  const createDrawerOpen = ref(false);
  const detailDrawerOpen = ref(false);
  const materialDrawerOpen = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const selectedCount = computed(() => selectedRows.value.length);
  let detailPollTimer: ReturnType<typeof setInterval> | null = null;
  let detailPollInFlight = false;
  let detailRequestVersion = 0;
  let detailTaskId: number | null = null;
  let detailRefreshFailureNotified = false;

  function buildQuery() {
    const id = Number(searchForm.id);
    return {
      page: page.value,
      pageSize: pageSize.value,
      id: searchForm.id.trim() && Number.isFinite(id) ? id : undefined,
      keyword: searchForm.keyword.trim() || undefined,
      status: searchForm.status || undefined,
      startTime: timestamp(searchForm.startTime),
      endTime: timestamp(searchForm.endTime)
    };
  }

  async function refreshTasks(): Promise<void> {
    selectedRows.value = [];
    loading.value = true;
    try {
      const result = await listMarketingTasks(buildQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "营销任务加载失败"));
    } finally {
      loading.value = false;
    }
  }

  const loadTasks = refreshTasks;

  async function loadOptions(): Promise<void> {
    try {
      const [groupResult, templateResult] = await Promise.all([
        listAccountGroups({ page: 1, pageSize: 500 }),
        listMarketingTemplates({ page: 1, pageSize: 500 })
      ]);
      accountGroups.value = groupResult.list ?? [];
      marketingTemplates.value = templateResult.list ?? [];
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "营销任务选项加载失败"));
    }
  }

  async function loadAccountTree(groupId: number | ""): Promise<void> {
    treeAccounts.value = [];
    loadedGroupAccounts.value = new Map();
    if (!groupId) return;
    treeLoading.value = true;
    try {
      const result: MarketingAccountTree =
        await fetchMarketingAccountTree(groupId);
      treeAccounts.value = result.accounts ?? [];
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "账号群树加载失败"));
    } finally {
      treeLoading.value = false;
    }
  }

  async function loadAccountGroups(
    accountId: number
  ): Promise<MarketingTreeAccount | null> {
    const current = treeAccounts.value.find(
      account => account.accountId === accountId
    );
    if (!current) return null;
    const cached = loadedGroupAccounts.value.get(accountId);
    if (cached) {
      return cached;
    }
    try {
      const loaded = await fetchMarketingAccountGroups(accountId);
      const nextLoadedGroupAccounts = new Map(loadedGroupAccounts.value);
      nextLoadedGroupAccounts.set(accountId, loaded);
      // 单账号群只能进懒加载缓存,不能写回 treeAccounts。
      // ElTree lazy 模式会监听根 data 变化,写回会重建节点并丢掉正在 resolve 的 children。
      loadedGroupAccounts.value = nextLoadedGroupAccounts;
      return loaded;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "账号群组加载失败"));
      return null;
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
    searchForm.startTime = "";
    searchForm.endTime = "";
    searchTasks();
  }

  function toggleAdvanced(): void {
    advancedOpen.value = !advancedOpen.value;
  }

  function onSelectionChange(selection: MarketingTaskRow[]): void {
    selectedRows.value = selection;
  }

  async function openCreateDrawer(): Promise<void> {
    Object.assign(createForm, emptyCreateForm());
    treeAccounts.value = [];
    await loadOptions();
    if (accountGroups.value[0]?.id) {
      createForm.accountGroupId = accountGroups.value[0].id;
      await loadAccountTree(createForm.accountGroupId);
    }
    createDrawerOpen.value = true;
  }

  function closeCreateDrawer(): void {
    createDrawerOpen.value = false;
    treeAccounts.value = [];
    loadedGroupAccounts.value = new Map();
  }

  async function createTask(
    payload: GroupMarketingCreatePayload
  ): Promise<void> {
    const form = payload.form;
    const group = accountGroups.value.find(
      item => item.id === form.accountGroupId
    );
    const template = marketingTemplates.value.find(
      item => item.id === form.marketingTemplateId
    );
    if (!form.taskName.trim()) {
      ElMessage.warning("请先填写任务名称");
      return;
    }
    if (!group) {
      ElMessage.warning("请选择账号分组");
      return;
    }
    if (!template) {
      ElMessage.warning("请选择营销模板");
      return;
    }
    if (payload.selections.length === 0) {
      ElMessage.warning("请至少选择一个发送账号");
      return;
    }
    if (
      !isValidAccountGroupSendIntervalSeconds(
        form.accountGroupSendIntervalSeconds
      )
    ) {
      ElMessage.warning("单账号下群组发送间隔必须为0.5到3秒，最多一位小数");
      return;
    }
    if (!isValidNewGroupDelay(form)) {
      ElMessage.warning(
        form.newGroupDelayUnit === "MINUTE"
          ? "分钟延迟时长必须为1到60的正整数"
          : "小时延迟时长必须为1到24的正整数"
      );
      return;
    }
    const lifecycleTimes = validateLifecycleTimes(form);
    if (!lifecycleTimes) {
      return;
    }
    try {
      await createMarketingTask({
        taskName: form.taskName.trim(),
        accountGroupId: group.id,
        accountGroupName: group.name,
        marketingTemplateId: template.id,
        marketingTemplateName: template.templateName,
        startMode: createStartMode(lifecycleTimes.taskStartAt),
        accountGroupSendAt: lifecycleTimes.accountGroupSendAt ?? null,
        taskStartAt: lifecycleTimes.taskStartAt,
        taskEndAt: lifecycleTimes.taskEndAt,
        sendPerRound: form.sendPerRound,
        accountGroupSendIntervalSeconds: form.accountGroupSendIntervalSeconds,
        sendIntervalSeconds: form.sendIntervalSeconds,
        onlineCheckEnabled: form.onlineCheckEnabled,
        abnormalGroupSkipped: form.abnormalGroupSkipped,
        autoRetryEnabled: form.autoRetryEnabled,
        newGroupDelayEnabled: form.newGroupDelayEnabled,
        newGroupDelayValue: form.newGroupDelayValue,
        newGroupDelayUnit: form.newGroupDelayUnit,
        remark: form.remark.trim() || null,
        selections: payload.selections
      });
      ElMessage.success("营销任务已创建");
      closeCreateDrawer();
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "营销任务创建失败"));
    }
  }

  function clearDetailPollTimer(): void {
    if (detailPollTimer == null) return;
    clearInterval(detailPollTimer);
    detailPollTimer = null;
  }

  function invalidateDetailRequests(): void {
    detailRequestVersion += 1;
    detailPollInFlight = false;
    detailRefreshFailureNotified = false;
    clearDetailPollTimer();
  }

  function isCurrentDetailRequest(taskId: number, version: number): boolean {
    return (
      detailDrawerOpen.value &&
      detailTaskId === taskId &&
      detailRequestVersion === version
    );
  }

  function ensureDetailPolling(taskId: number): void {
    if (
      detailPollTimer != null ||
      !detailDrawerOpen.value ||
      detailTaskId !== taskId
    ) {
      return;
    }
    detailPollTimer = setInterval(() => {
      void refreshDetailTask(taskId, true);
    }, DETAIL_POLL_INTERVAL_MS);
  }

  async function refreshDetailTask(
    taskId: number,
    background: boolean
  ): Promise<void> {
    if (background && detailPollInFlight) return;
    const version = detailRequestVersion;
    if (background) {
      detailPollInFlight = true;
    } else {
      detailLoading.value = true;
    }
    try {
      const nextDetail = await getMarketingTaskDetail(taskId);
      if (!isCurrentDetailRequest(taskId, version)) return;
      detailTask.value = nextDetail;
      detailRefreshFailureNotified = false;
      if (nextDetail.status === 2) {
        ensureDetailPolling(taskId);
      } else {
        clearDetailPollTimer();
      }
    } catch (error) {
      if (!isCurrentDetailRequest(taskId, version)) return;
      if (background) {
        if (!detailRefreshFailureNotified) {
          ElMessage.error(apiErrorMessage(error, "营销任务明细刷新失败"));
          detailRefreshFailureNotified = true;
        }
      } else {
        detailTask.value = null;
        ElMessage.error(apiErrorMessage(error, "营销任务明细加载失败"));
      }
    } finally {
      if (isCurrentDetailRequest(taskId, version)) {
        if (background) {
          detailPollInFlight = false;
        } else {
          detailLoading.value = false;
        }
      }
    }
  }

  /** 供账号占用详情等入口按任务 ID 复用现有明细抽屉。 */
  async function openDetailById(taskId: number): Promise<void> {
    invalidateDetailRequests();
    detailTaskId = taskId;
    detailTask.value = null;
    detailDrawerOpen.value = true;
    await refreshDetailTask(taskId, false);
  }

  async function openDetailDrawer(row: MarketingTaskRow): Promise<void> {
    await openDetailById(row.id);
  }

  function resetDetailState(): void {
    invalidateDetailRequests();
    detailTaskId = null;
    detailTask.value = null;
    detailLoading.value = false;
  }

  function closeDetailDrawer(): void {
    detailDrawerOpen.value = false;
    resetDetailState();
  }

  async function startTask(row: MarketingTaskRow): Promise<void> {
    try {
      const updated = await startMarketingTask(row.id);
      rows.value = rows.value.map(item =>
        item.id === row.id ? updated : item
      );
      ElMessage.success(
        updated.status === 1
          ? "营销任务已进入等待，将在计划开始时间自动执行"
          : "营销任务已启动"
      );
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "启动营销任务失败"));
    }
  }

  function replaceTaskRow(updated: MarketingTaskRow): void {
    rows.value = rows.value.map(item =>
      item.id === updated.id ? updated : item
    );
  }

  async function pauseTask(row: MarketingTaskRow): Promise<void> {
    try {
      replaceTaskRow(await pauseMarketingTask(row.id));
      ElMessage.success("营销任务已暂停，账号仍保持锁定");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "暂停营销任务失败"));
    }
  }

  async function resumeTask(row: MarketingTaskRow): Promise<void> {
    try {
      replaceTaskRow(await resumeMarketingTask(row.id));
      ElMessage.success("营销任务已继续");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "继续营销任务失败"));
    }
  }

  async function closeTask(row: MarketingTaskRow): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `确认手动关闭任务【${row.taskName ?? row.id}】？关闭后不可再次启动，任务账号将被释放。`,
        "手动关闭营销任务",
        {
          type: "warning",
          confirmButtonText: "确认关闭",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }
    try {
      replaceTaskRow(await closeMarketingTask(row.id));
      ElMessage.success("营销任务已关闭，账号已释放");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "手动关闭营销任务失败"));
    }
  }

  async function deleteSelected(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    if (selectedRows.value.some(row => ![7, 8].includes(row.status))) {
      ElMessage.warning("未结束的任务不可删除，请先手动关闭任务");
      return;
    }
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedRows.value.length} 条营销任务？`,
        "删除营销任务",
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
      await batchDeleteMarketingTasks(selectedRows.value.map(row => row.id));
      ElMessage.success("营销任务已删除");
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量删除营销任务失败"));
    }
  }

  async function openMaterialDrawer(row: MarketingTaskRow): Promise<void> {
    // 列表入口已隐藏终态按钮；这里再次校验，避免其他调用路径绕过 UI 门禁。
    if (!canModifyTaskMaterial(row.status)) {
      ElMessage.warning("已完成或已关闭的任务不可修改营销素材");
      return;
    }
    if (marketingTemplates.value.length === 0) {
      await loadOptions();
    }
    const template = marketingTemplates.value.find(
      item => item.id === row.marketingTemplateId
    );
    if (!template) {
      ElMessage.error("未找到该任务引用的营销模板");
      return;
    }
    activeTask.value = row;
    materialForm.value = copyMaterialForm(template);
    materialForm.value.buttons = buildButtonsForMode(
      materialForm.value.linkMode,
      materialForm.value.buttons
    );
    materialDrawerOpen.value = true;
  }

  function closeMaterialDrawer(): void {
    materialDrawerOpen.value = false;
    activeTask.value = null;
    materialForm.value = emptyMaterialForm();
  }

  async function submitMaterialUpdate(): Promise<void> {
    if (!activeTask.value) return;
    const validation = validateMaterialForm(materialForm.value);
    if (validation) {
      ElMessage.warning(validation);
      return;
    }
    materialSubmitting.value = true;
    try {
      const updated = await updateTaskMarketingTemplate(
        activeTask.value.id,
        materialForm.value
      );
      marketingTemplates.value = marketingTemplates.value.map(item =>
        item.id === updated.id ? updated : item
      );
      ElMessage.success("营销素材已更新");
      closeMaterialDrawer();
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "营销素材更新失败"));
    } finally {
      materialSubmitting.value = false;
    }
  }

  watch(detailDrawerOpen, visible => {
    if (!visible && detailTaskId != null) {
      resetDetailState();
    }
  });

  onScopeDispose(resetDetailState, true);

  onMounted(() => {
    void Promise.all([loadOptions(), refreshTasks()]);
  });

  return {
    accountGroups,
    activeTask,
    advancedOpen,
    closeCreateDrawer,
    closeTask,
    closeDetailDrawer,
    closeMaterialDrawer,
    createDrawerOpen,
    createForm,
    createTask,
    deleteSelected,
    detailDrawerOpen,
    detailLoading,
    detailTask,
    loadTasks,
    loadAccountTree,
    loadAccountGroups,
    loading,
    materialDrawerOpen,
    materialForm,
    materialSubmitting,
    marketingTemplates,
    onSelectionChange,
    openCreateDrawer,
    openDetailById,
    openDetailDrawer,
    openMaterialDrawer,
    page,
    pageSize,
    pauseTask,
    refreshTasks,
    resetSearchForm,
    resumeTask,
    rows,
    searchForm,
    searchTasks,
    selectedCount,
    startTask,
    submitMaterialUpdate,
    toggleAdvanced,
    total,
    treeAccounts,
    treeLoading
  };
}

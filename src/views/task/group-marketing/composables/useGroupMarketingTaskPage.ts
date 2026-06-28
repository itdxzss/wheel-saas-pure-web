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
  batchDeleteMarketingTasks,
  createMarketingTask,
  fetchMarketingAccountTree,
  getMarketingTaskDetail,
  listMarketingTasks,
  startMarketingTask,
  stopMarketingTask,
  updateTaskMarketingTemplate,
  type MarketingAccountTree,
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
  sendPerRound: number;
  sendIntervalSeconds: number;
  onlineCheckEnabled: boolean;
  abnormalGroupSkipped: boolean;
  autoRetryEnabled: boolean;
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
  loading: Ref<boolean>;
  materialDrawerOpen: Ref<boolean>;
  materialForm: Ref<MarketingTemplateWrite>;
  materialSubmitting: Ref<boolean>;
  marketingTemplates: Ref<MarketingTemplateRow[]>;
  onSelectionChange: (rows: MarketingTaskRow[]) => void;
  openCreateDrawer: () => Promise<void>;
  openDetailDrawer: (row: MarketingTaskRow) => Promise<void>;
  openMaterialDrawer: (row: MarketingTaskRow) => Promise<void>;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshTasks: () => Promise<void>;
  resetSearchForm: () => void;
  rows: Ref<MarketingTaskRow[]>;
  searchForm: GroupMarketingSearchForm;
  searchTasks: () => void;
  selectedCount: ComputedRef<number>;
  startTask: (row: MarketingTaskRow) => Promise<void>;
  stopTask: (row: MarketingTaskRow) => Promise<void>;
  submitMaterialUpdate: () => Promise<void>;
  toggleAdvanced: () => void;
  total: Ref<number>;
  treeAccounts: Ref<MarketingTreeAccount[]>;
  treeLoading: Ref<boolean>;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (
    error as { response?: { data?: { message?: unknown; msg?: unknown } } }
  )?.response?.data;
  const message = data?.message ?? data?.msg ?? (error as Error)?.message;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
}

function emptyCreateForm(): GroupMarketingCreateForm {
  return {
    taskName: "",
    accountGroupId: "",
    marketingTemplateId: "",
    startMode: "PENDING",
    sendPerRound: 1,
    sendIntervalSeconds: 30,
    onlineCheckEnabled: true,
    abnormalGroupSkipped: true,
    autoRetryEnabled: false,
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
  if (!form.bodyText.trim()) return "正文不能为空";
  if (form.linkMode === 2 && form.buttons.length === 0) {
    return "按钮超链模式至少配置 1 个按钮";
  }
  const invalidButton = form.buttons.find(
    button =>
      !button.label.trim() || (button.type !== "quick" && !button.value.trim())
  );
  return invalidButton ? "按钮文字和参数不能为空" : "";
}

function timestamp(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
      ElMessage.error(apiErrorMessage(error, "群组营销任务加载失败"));
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
    if (marketingTemplates.value[0]?.id) {
      createForm.marketingTemplateId = marketingTemplates.value[0].id;
    }
    createDrawerOpen.value = true;
  }

  function closeCreateDrawer(): void {
    createDrawerOpen.value = false;
    treeAccounts.value = [];
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
      ElMessage.warning("请至少选择一个账号和群组");
      return;
    }
    try {
      await createMarketingTask({
        taskName: form.taskName.trim(),
        accountGroupId: group.id,
        accountGroupName: group.name,
        marketingTemplateId: template.id,
        marketingTemplateName: template.templateName,
        startMode: form.startMode,
        sendPerRound: form.sendPerRound,
        sendIntervalSeconds: form.sendIntervalSeconds,
        onlineCheckEnabled: form.onlineCheckEnabled,
        abnormalGroupSkipped: form.abnormalGroupSkipped,
        autoRetryEnabled: form.autoRetryEnabled,
        remark: form.remark.trim() || null,
        selections: payload.selections
      });
      ElMessage.success("群组营销任务已创建");
      closeCreateDrawer();
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "群组营销任务创建失败"));
    }
  }

  async function openDetailDrawer(row: MarketingTaskRow): Promise<void> {
    detailDrawerOpen.value = true;
    detailLoading.value = true;
    try {
      detailTask.value = await getMarketingTaskDetail(row.id);
    } catch (error) {
      detailTask.value = null;
      ElMessage.error(apiErrorMessage(error, "群组营销任务明细加载失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  function closeDetailDrawer(): void {
    detailDrawerOpen.value = false;
    detailTask.value = null;
  }

  async function startTask(row: MarketingTaskRow): Promise<void> {
    try {
      const updated = await startMarketingTask(row.id);
      rows.value = rows.value.map(item =>
        item.id === row.id ? updated : item
      );
      ElMessage.success("群组营销任务已启动");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "启动群组营销任务失败"));
    }
  }

  async function stopTask(row: MarketingTaskRow): Promise<void> {
    try {
      const updated = await stopMarketingTask(row.id);
      rows.value = rows.value.map(item =>
        item.id === row.id ? updated : item
      );
      ElMessage.success("群组营销任务已停止");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "停止群组营销任务失败"));
    }
  }

  async function deleteSelected(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    if (selectedRows.value.some(row => row.status === 2)) {
      ElMessage.warning("发送中的任务不可删除，请先停止任务");
      return;
    }
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${selectedRows.value.length} 条群组营销任务？`,
        "删除群组营销任务",
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
      ElMessage.success("群组营销任务已删除");
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量删除群组营销任务失败"));
    }
  }

  async function openMaterialDrawer(row: MarketingTaskRow): Promise<void> {
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
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "营销素材更新失败"));
    } finally {
      materialSubmitting.value = false;
    }
  }

  onMounted(() => {
    void Promise.all([loadOptions(), refreshTasks()]);
  });

  return {
    accountGroups,
    activeTask,
    advancedOpen,
    closeCreateDrawer,
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
    loading,
    materialDrawerOpen,
    materialForm,
    materialSubmitting,
    marketingTemplates,
    onSelectionChange,
    openCreateDrawer,
    openDetailDrawer,
    openMaterialDrawer,
    page,
    pageSize,
    refreshTasks,
    resetSearchForm,
    rows,
    searchForm,
    searchTasks,
    selectedCount,
    startTask,
    stopTask,
    submitMaterialUpdate,
    toggleAdvanced,
    total,
    treeAccounts,
    treeLoading
  };
}

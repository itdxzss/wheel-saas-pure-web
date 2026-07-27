import { computed, reactive, ref, type ComputedRef, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import {
  createGroupPullMarketingTask,
  deleteGroupPullMarketingTask,
  listGroupPullMarketingTasks,
  pauseGroupPullMarketingTask,
  releaseGroupPullMarketingTask,
  resumeGroupPullMarketingTask,
  startGroupPullMarketingTask,
  type CreateGroupPullMarketingConfig,
  type GroupPullBlockReason,
  type GroupPullMarketingTaskRow,
  type GroupPullResourceStatus,
  type GroupPullSpeakPermission,
  type GroupPullTaskStatus
} from "@/api/group-pull-marketing";
import {
  listMarketingTemplates,
  type MarketingTemplateRow
} from "@/api/marketing-template";
import { apiErrorMessage } from "@/utils/api-error";

export interface GroupPullMarketingSearchForm {
  id: string;
  keyword: string;
  status: GroupPullTaskStatus | "";
  blockReason: GroupPullBlockReason | "";
  resourceStatus: GroupPullResourceStatus | "";
}

export interface GroupPullMarketingCreateForm {
  taskName: string;
  builderGroupId: number | "";
  successGroupId: number | "";
  failureGroupId: number | "";
  marketingGroupId: number | "";
  marketingAccountGroupLimit: number;
  marketingTemplateId: number | "";
  sendIntervalSeconds: number;
  groupNamePrefix: string;
  friendRetryLimit: number;
  materialPerGroup: number;
  materialEntryIntervalMinutes: number;
  speakPermission: GroupPullSpeakPermission;
  builderExitEnabled: boolean;
  remark: string;
  taskEndAt: number | string;
}

export interface GroupPullMarketingPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  clearMaterialFile: () => void;
  closeCreateDrawer: () => void;
  createBlockReason: ComputedRef<string>;
  createDrawerOpen: Ref<boolean>;
  createForm: GroupPullMarketingCreateForm;
  deleteTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  loadOptions: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loading: Ref<boolean>;
  marketingTemplates: Ref<MarketingTemplateRow[]>;
  materialFile: Ref<File | null>;
  openCreateDrawer: () => Promise<void>;
  page: Ref<number>;
  pageSize: Ref<number>;
  pauseTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  releaseTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  resetSearchForm: () => void;
  resumeTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  rows: Ref<GroupPullMarketingTaskRow[]>;
  searchForm: GroupPullMarketingSearchForm;
  searchTasks: () => void;
  selectMaterialFile: (file: File) => boolean;
  startTask: (row: GroupPullMarketingTaskRow) => Promise<void>;
  submitCreate: () => Promise<void>;
  submitting: Ref<boolean>;
  total: Ref<number>;
}

/** 生成创建表单默认结束时间，当天 23:59:59。 */
export function endOfTodayTimestamp(date = new Date()): number {
  const end = new Date(date);
  end.setHours(23, 59, 59, 0);
  return end.getTime();
}

function emptyCreateForm(): GroupPullMarketingCreateForm {
  return {
    taskName: "",
    builderGroupId: "",
    successGroupId: "",
    failureGroupId: "",
    marketingGroupId: "",
    marketingAccountGroupLimit: 10,
    marketingTemplateId: "",
    sendIntervalSeconds: 30,
    groupNamePrefix: "",
    friendRetryLimit: 3,
    materialPerGroup: 3,
    materialEntryIntervalMinutes: 5,
    speakPermission: 1,
    builderExitEnabled: true,
    remark: "",
    taskEndAt: endOfTodayTimestamp()
  };
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

/** 拉群营销一级列表、创建表单及生命周期操作的页面状态。 */
export function useGroupPullMarketingPage(): GroupPullMarketingPageState {
  const searchForm = reactive<GroupPullMarketingSearchForm>({
    id: "",
    keyword: "",
    status: "",
    blockReason: "",
    resourceStatus: ""
  });
  const createForm = reactive<GroupPullMarketingCreateForm>(emptyCreateForm());
  const rows = ref<GroupPullMarketingTaskRow[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const marketingTemplates = ref<MarketingTemplateRow[]>([]);
  const materialFile = ref<File | null>(null);
  const loading = ref(false);
  const submitting = ref(false);
  const createDrawerOpen = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  function selectedGroup(id: number | ""): AccountGroupApiRow | undefined {
    return id === ""
      ? undefined
      : accountGroups.value.find(group => group.id === id);
  }

  function resultGroupBlockReason(id: number | ""): string {
    if (id === "") return "";
    if (id === createForm.builderGroupId) return "不能选择当前分组";
    if (selectedGroup(id)?.marketingOccupancyTaskId != null) {
      return "该分组正在任务中使用，不能选择";
    }
    return "";
  }

  const createBlockReason = computed(() => {
    const taskName = createForm.taskName.trim();
    if (!taskName) return "请填写任务名称";
    if (Array.from(taskName).length > 128) return "任务名称不能超过128个字符";
    if (!createForm.builderGroupId) return "请选择建群账号分组";
    if ((selectedGroup(createForm.builderGroupId)?.onlineAccounts ?? 0) < 1) {
      return "建群账号分组没有正常在线账号";
    }
    if (!createForm.marketingGroupId) return "请选择营销分组";
    if (createForm.builderGroupId === createForm.marketingGroupId) {
      return "建群账号分组和营销分组不能相同";
    }
    if ((selectedGroup(createForm.marketingGroupId)?.onlineAccounts ?? 0) < 1) {
      return "营销分组没有正常在线账号";
    }
    const successGroupReason = resultGroupBlockReason(
      createForm.successGroupId
    );
    if (successGroupReason) return successGroupReason;
    const failureGroupReason = resultGroupBlockReason(
      createForm.failureGroupId
    );
    if (failureGroupReason) return failureGroupReason;
    if (!isPositiveInteger(createForm.marketingAccountGroupLimit)) {
      return "单营销账号最大群组数必须是大于等于1的整数";
    }
    if (!createForm.marketingTemplateId) return "请选择营销模板";
    if (!isPositiveInteger(createForm.sendIntervalSeconds)) {
      return "营销轮次间隔必须是大于等于1的整数秒";
    }
    if (Array.from(createForm.groupNamePrefix.trim()).length > 100) {
      return "群名前缀不能超过100个字符";
    }
    if (
      !Number.isInteger(createForm.friendRetryLimit) ||
      createForm.friendRetryLimit < 0 ||
      createForm.friendRetryLimit > 10
    ) {
      return "加好友重试次数必须是0到10的整数";
    }
    if (!isPositiveInteger(createForm.materialPerGroup)) {
      return "单群抽取数量必须是大于等于1的整数";
    }
    if (
      !Number.isInteger(createForm.materialEntryIntervalMinutes) ||
      createForm.materialEntryIntervalMinutes < 1 ||
      createForm.materialEntryIntervalMinutes > 60
    ) {
      return "拉料间隔必须是1到60的整数分钟";
    }
    if (!materialFile.value) return "请选择TXT或CSV料子文件";
    if (createForm.remark.length > 512) return "备注不能超过512个字符";
    const taskEndAt = Number(createForm.taskEndAt);
    if (!Number.isFinite(taskEndAt)) return "请选择结束时间";
    if (taskEndAt <= Date.now()) return "结束时间必须晚于当前时间";
    return "";
  });

  function buildQuery() {
    const parsedId = Number(searchForm.id.trim());
    return {
      page: page.value,
      pageSize: pageSize.value,
      id:
        searchForm.id.trim() && Number.isSafeInteger(parsedId) && parsedId > 0
          ? parsedId
          : undefined,
      keyword: searchForm.keyword,
      status: searchForm.status,
      blockReason: searchForm.blockReason,
      resourceStatus: searchForm.resourceStatus
    };
  }

  async function loadTasks(): Promise<void> {
    loading.value = true;
    try {
      const result = await listGroupPullMarketingTasks(buildQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "拉群营销任务加载失败"));
    } finally {
      loading.value = false;
    }
  }

  async function loadOptions(): Promise<void> {
    try {
      const [groupResult, templateResult] = await Promise.all([
        listAccountGroups({ page: 1, pageSize: 500 }),
        listMarketingTemplates({ page: 1, pageSize: 500 })
      ]);
      accountGroups.value = groupResult.list ?? [];
      marketingTemplates.value = templateResult.list ?? [];
    } catch (error) {
      accountGroups.value = [];
      marketingTemplates.value = [];
      ElMessage.error(apiErrorMessage(error, "拉群营销创建选项加载失败"));
    }
  }

  function resetCreateForm(): void {
    Object.assign(createForm, emptyCreateForm());
    materialFile.value = null;
  }

  async function openCreateDrawer(): Promise<void> {
    resetCreateForm();
    await loadOptions();
    createDrawerOpen.value = true;
  }

  function closeCreateDrawer(): void {
    createDrawerOpen.value = false;
    resetCreateForm();
  }

  function selectMaterialFile(file: File): boolean {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "txt" && extension !== "csv") {
      ElMessage.warning("料子文件仅支持 TXT、CSV 格式");
      return false;
    }
    materialFile.value = file;
    return true;
  }

  function clearMaterialFile(): void {
    materialFile.value = null;
  }

  function toCreateConfig(): CreateGroupPullMarketingConfig {
    return {
      taskName: createForm.taskName.trim(),
      builderGroupId: Number(createForm.builderGroupId),
      successGroupId:
        createForm.successGroupId === ""
          ? null
          : Number(createForm.successGroupId),
      failureGroupId:
        createForm.failureGroupId === ""
          ? null
          : Number(createForm.failureGroupId),
      marketingGroupId: Number(createForm.marketingGroupId),
      marketingAccountGroupLimit: createForm.marketingAccountGroupLimit,
      marketingTemplateId: Number(createForm.marketingTemplateId),
      sendIntervalSeconds: createForm.sendIntervalSeconds,
      groupNamePrefix: createForm.groupNamePrefix.trim() || null,
      friendRetryLimit: createForm.friendRetryLimit,
      materialPerGroup: createForm.materialPerGroup,
      materialEntryIntervalSeconds:
        createForm.materialEntryIntervalMinutes * 60,
      speakPermission: createForm.speakPermission,
      builderExitEnabled: createForm.builderExitEnabled,
      remark: createForm.remark.trim() || null,
      taskEndAt: Number(createForm.taskEndAt)
    };
  }

  async function submitCreate(): Promise<void> {
    if (createBlockReason.value || !materialFile.value) {
      ElMessage.warning(createBlockReason.value || "请选择TXT或CSV料子文件");
      return;
    }
    submitting.value = true;
    try {
      await createGroupPullMarketingTask(toCreateConfig(), materialFile.value);
      ElMessage.success("拉群营销任务已保存，当前为待启动");
      closeCreateDrawer();
      page.value = 1;
      await loadTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "拉群营销任务保存失败"));
    } finally {
      submitting.value = false;
    }
  }

  function searchTasks(): void {
    page.value = 1;
    void loadTasks();
  }

  function resetSearchForm(): void {
    Object.assign(searchForm, {
      id: "",
      keyword: "",
      status: "",
      blockReason: "",
      resourceStatus: ""
    });
    page.value = 1;
    void loadTasks();
  }

  async function runLifecycleAction(
    action: () => Promise<unknown>,
    successMessage: string,
    failureMessage: string
  ): Promise<void> {
    try {
      await action();
      ElMessage.success(successMessage);
      await loadTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, failureMessage));
    }
  }

  async function startTask(row: GroupPullMarketingTaskRow): Promise<void> {
    await runLifecycleAction(
      () => startGroupPullMarketingTask(row.id),
      "拉群营销任务已启动",
      "任务启动失败"
    );
  }

  async function pauseTask(row: GroupPullMarketingTaskRow): Promise<void> {
    await runLifecycleAction(
      () => pauseGroupPullMarketingTask(row.id),
      "任务已暂停，营销分组继续保持锁定",
      "任务暂停失败"
    );
  }

  async function resumeTask(row: GroupPullMarketingTaskRow): Promise<void> {
    await runLifecycleAction(
      () => resumeGroupPullMarketingTask(row.id),
      "拉群营销任务已恢复",
      "任务恢复失败"
    );
  }

  async function releaseTask(row: GroupPullMarketingTaskRow): Promise<void> {
    try {
      await ElMessageBox.confirm(
        "释放账号后，当前任务将停止继续创建群组，并解除建群账号及营销分组占用。是否继续？",
        "释放账号",
        { type: "warning", confirmButtonText: "确认释放" }
      );
    } catch {
      return;
    }
    await runLifecycleAction(
      () => releaseGroupPullMarketingTask(row.id),
      "任务已结束，正在释放账号",
      "账号释放失败"
    );
  }

  async function deleteTask(row: GroupPullMarketingTaskRow): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `确认删除待启动任务“${row.taskName}”吗？`,
        "删除任务",
        { type: "warning" }
      );
    } catch {
      return;
    }
    await runLifecycleAction(
      () => deleteGroupPullMarketingTask(row.id),
      "拉群营销任务已删除",
      "任务删除失败"
    );
  }

  return {
    accountGroups,
    clearMaterialFile,
    closeCreateDrawer,
    createBlockReason,
    createDrawerOpen,
    createForm,
    deleteTask,
    loadOptions,
    loadTasks,
    loading,
    marketingTemplates,
    materialFile,
    openCreateDrawer,
    page,
    pageSize,
    pauseTask,
    releaseTask,
    resetSearchForm,
    resumeTask,
    rows,
    searchForm,
    searchTasks,
    selectMaterialFile,
    startTask,
    submitCreate,
    submitting,
    total
  };
}

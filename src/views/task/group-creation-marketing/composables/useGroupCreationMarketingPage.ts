import { computed, reactive, ref, type ComputedRef, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import {
  createGroupCreationMarketingTask,
  getGroupCreationMarketingTaskDetail,
  listGroupCreationMarketingAccountCandidates,
  listGroupCreationMarketingTasks,
  stopGroupCreationMarketingTask,
  type GroupCreationMarketingAccountCandidateRow,
  type GroupCreationMarketingMaterialPayload,
  type GroupCreationMarketingTaskDetail,
  type GroupCreationMarketingTaskRow,
  type GroupCreationMarketingTaskStatus
} from "@/api/group-creation-marketing";
import {
  listMarketingTemplates,
  type MarketingTemplateRow
} from "@/api/marketing-template";
import { apiErrorMessage } from "@/utils/api-error";

export interface GroupCreationMarketingAccount {
  accountId: number;
  wsPhone: string;
  status?: string;
}

export interface GroupCreationMarketingSearchForm {
  id: string;
  keyword: string;
  status: "" | GroupCreationMarketingTaskStatus;
}

export interface GroupCreationMarketingCreateForm {
  taskName: string;
  accountGroupId: number | "";
  marketingTemplateId: number | "";
  sendIntervalSeconds: number;
  groupNamePrefix: string;
  remark: string;
}

export interface GroupCreationMarketingUploadedMaterial {
  fileName: string;
  content: string;
}

export interface GroupCreationMarketingMatchRow {
  accountId: number;
  accountPhone: string;
  accountStatus?: string;
  fileName: string;
  content: string;
}

export interface GroupCreationMarketingPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  accountGroupUsableCounts: Ref<Record<number, number>>;
  accounts: Ref<GroupCreationMarketingAccount[]>;
  addMaterialFiles: (files: File[]) => Promise<void>;
  closeCreateDrawer: () => void;
  closeDetailDrawer: () => void;
  createDrawerOpen: Ref<boolean>;
  createBlockReason: ComputedRef<string>;
  createForm: GroupCreationMarketingCreateForm;
  detailDrawerOpen: Ref<boolean>;
  detailLoading: Ref<boolean>;
  detailTask: Ref<GroupCreationMarketingTaskDetail | null>;
  loadAccounts: (groupId: number | "") => Promise<void>;
  loadOptions: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loading: Ref<boolean>;
  marketingTemplates: Ref<MarketingTemplateRow[]>;
  matchRows: ComputedRef<GroupCreationMarketingMatchRow[]>;
  materialFiles: Ref<GroupCreationMarketingUploadedMaterial[]>;
  openCreateDrawer: () => Promise<void>;
  openDetailDrawer: (row: GroupCreationMarketingTaskRow) => Promise<void>;
  page: Ref<number>;
  pageSize: Ref<number>;
  removeMaterialFile: (index: number) => void;
  resetSearchForm: () => void;
  rows: Ref<GroupCreationMarketingTaskRow[]>;
  searchForm: GroupCreationMarketingSearchForm;
  searchTasks: () => void;
  stopTask: (row: GroupCreationMarketingTaskRow) => Promise<void>;
  submitCreate: () => Promise<void>;
  total: Ref<number>;
  unmatchedFiles: ComputedRef<GroupCreationMarketingUploadedMaterial[]>;
}

function emptyCreateForm(): GroupCreationMarketingCreateForm {
  return {
    taskName: "",
    accountGroupId: "",
    marketingTemplateId: "",
    sendIntervalSeconds: 30,
    groupNamePrefix: "",
    remark: ""
  };
}

function toAccount(
  row: GroupCreationMarketingAccountCandidateRow
): GroupCreationMarketingAccount {
  return {
    accountId: row.accountId,
    wsPhone: row.accountPhone,
    status: accountStatus(row)
  };
}

function accountStatus(row: GroupCreationMarketingAccountCandidateRow): string {
  if (
    !row.protocolAccountId ||
    row.accountState !== 2 ||
    (row.riskStatus != null && row.riskStatus > 1) ||
    row.muteStatus != null
  ) {
    return "不可用";
  }
  if (row.loginState === 1) return "在线";
  if (row.loginState === 3) return "待上线";
  return "离线";
}

function usableCandidate(
  row: GroupCreationMarketingAccountCandidateRow
): boolean {
  return (
    Boolean(row.protocolAccountId?.trim()) &&
    row.accountState === 2 &&
    row.loginState === 1 &&
    (row.riskStatus == null || row.riskStatus <= 1) &&
    row.muteStatus == null
  );
}

function toUsableAccounts(
  rows: GroupCreationMarketingAccountCandidateRow[] | null | undefined
): GroupCreationMarketingAccount[] {
  return (rows ?? []).filter(usableCandidate).map(toAccount);
}

export function useGroupCreationMarketingPage(): GroupCreationMarketingPageState {
  const searchForm = reactive<GroupCreationMarketingSearchForm>({
    id: "",
    keyword: "",
    status: ""
  });
  const createForm =
    reactive<GroupCreationMarketingCreateForm>(emptyCreateForm());
  const rows = ref<GroupCreationMarketingTaskRow[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const accountGroupUsableCounts = ref<Record<number, number>>({});
  const accountCache = ref<Record<number, GroupCreationMarketingAccount[]>>({});
  const marketingTemplates = ref<MarketingTemplateRow[]>([]);
  const accounts = ref<GroupCreationMarketingAccount[]>([]);
  const materialFiles = ref<GroupCreationMarketingUploadedMaterial[]>([]);
  const detailTask = ref<GroupCreationMarketingTaskDetail | null>(null);
  const loading = ref(false);
  const detailLoading = ref(false);
  const createDrawerOpen = ref(false);
  const detailDrawerOpen = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  const matchRows = computed<GroupCreationMarketingMatchRow[]>(() =>
    accounts.value
      .slice(0, materialFiles.value.length)
      .map((account, index) => ({
        accountId: account.accountId,
        accountPhone: account.wsPhone,
        accountStatus: account.status,
        fileName: materialFiles.value[index].fileName,
        content: materialFiles.value[index].content
      }))
  );

  const unmatchedFiles = computed<GroupCreationMarketingUploadedMaterial[]>(
    () => materialFiles.value.slice(accounts.value.length)
  );

  const createBlockReason = computed(() => {
    if (!createForm.taskName.trim()) return "请先填写任务名称";
    if (!createForm.accountGroupId) return "请选择账号分组";
    if (!createForm.marketingTemplateId) return "请选择营销模板";
    if (materialFiles.value.length === 0) return "请上传料子文件";
    if (materialFiles.value.some(file => !file.content.trim())) {
      return "料子文件不能为空";
    }
    if (matchRows.value.length === 0) {
      return "没有可执行的账号和料子文件匹配";
    }
    if (
      !Number.isFinite(createForm.sendIntervalSeconds) ||
      createForm.sendIntervalSeconds < 1
    ) {
      return "发送间隔必须大于 0 秒";
    }
    return "";
  });

  function buildQuery() {
    const id = Number(searchForm.id);
    return {
      page: page.value,
      pageSize: pageSize.value,
      id: searchForm.id.trim() && Number.isFinite(id) ? id : undefined,
      keyword: searchForm.keyword.trim() || undefined,
      status: searchForm.status || undefined
    };
  }

  async function loadTasks(): Promise<void> {
    loading.value = true;
    try {
      const result = await listGroupCreationMarketingTasks(buildQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "建群营销任务加载失败"));
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
      const groups = groupResult.list ?? [];
      accountGroups.value = groups;
      marketingTemplates.value = templateResult.list ?? [];
      await loadAccountGroupUsableCounts(groups);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "建群营销选项加载失败"));
    }
  }

  async function loadAccounts(groupId: number | ""): Promise<void> {
    accounts.value = [];
    if (!groupId) return;
    const cached = accountCache.value[groupId];
    if (cached) {
      accounts.value = cached;
      return;
    }
    try {
      const rows = await listGroupCreationMarketingAccountCandidates(groupId);
      const usableAccounts = toUsableAccounts(rows);
      accounts.value = usableAccounts;
      accountCache.value = {
        ...accountCache.value,
        [groupId]: usableAccounts
      };
      accountGroupUsableCounts.value = {
        ...accountGroupUsableCounts.value,
        [groupId]: usableAccounts.length
      };
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "账号列表加载失败"));
    }
  }

  async function loadAccountGroupUsableCounts(
    groups: AccountGroupApiRow[]
  ): Promise<void> {
    const entries = await Promise.all(
      groups.map(async group => {
        const rows = await listGroupCreationMarketingAccountCandidates(
          group.id
        );
        return [group.id, toUsableAccounts(rows)] as const;
      })
    );
    const nextCounts: Record<number, number> = {};
    const nextCache: Record<number, GroupCreationMarketingAccount[]> = {};
    for (const [groupId, usableAccounts] of entries) {
      nextCounts[groupId] = usableAccounts.length;
      nextCache[groupId] = usableAccounts;
    }
    accountGroupUsableCounts.value = nextCounts;
    accountCache.value = nextCache;
  }

  async function addMaterialFiles(files: File[]): Promise<void> {
    const loaded = await Promise.all(
      files.map(async file => ({
        fileName: file.name,
        content: await file.text()
      }))
    );
    materialFiles.value = [...materialFiles.value, ...loaded];
  }

  function removeMaterialFile(index: number): void {
    materialFiles.value = materialFiles.value.filter((_, i) => i !== index);
  }

  function searchTasks(): void {
    page.value = 1;
    void loadTasks();
  }

  function resetSearchForm(): void {
    searchForm.id = "";
    searchForm.keyword = "";
    searchForm.status = "";
    page.value = 1;
    void loadTasks();
  }

  async function openCreateDrawer(): Promise<void> {
    Object.assign(createForm, emptyCreateForm());
    accounts.value = [];
    materialFiles.value = [];
    await loadOptions();
    if (accountGroups.value[0]?.id) {
      createForm.accountGroupId = accountGroups.value[0].id;
      await loadAccounts(createForm.accountGroupId);
    }
    if (marketingTemplates.value[0]?.id) {
      createForm.marketingTemplateId = marketingTemplates.value[0].id;
    }
    createDrawerOpen.value = true;
  }

  function closeCreateDrawer(): void {
    createDrawerOpen.value = false;
    accounts.value = [];
    materialFiles.value = [];
  }

  async function submitCreate(): Promise<void> {
    const group = accountGroups.value.find(
      item => item.id === createForm.accountGroupId
    );
    const template = marketingTemplates.value.find(
      item => item.id === createForm.marketingTemplateId
    );
    const blockReason = createBlockReason.value;
    if (blockReason) {
      ElMessage.warning(blockReason);
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
    if (matchRows.value.length === 0) {
      ElMessage.warning("没有可执行的账号和料子文件匹配");
      return;
    }
    const materials: GroupCreationMarketingMaterialPayload[] =
      materialFiles.value.map(file => ({
        fileName: file.fileName,
        content: file.content
      }));
    try {
      await createGroupCreationMarketingTask({
        taskName: createForm.taskName.trim(),
        accountGroupId: group.id,
        accountGroupName: group.name,
        marketingTemplateId: template.id,
        marketingTemplateName: template.templateName,
        sendIntervalSeconds: createForm.sendIntervalSeconds,
        groupNamePrefix: createForm.groupNamePrefix.trim() || null,
        remark: createForm.remark.trim() || null,
        materials
      });
      ElMessage.success("建群营销任务已创建");
      closeCreateDrawer();
      await loadTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "建群营销任务创建失败"));
    }
  }

  async function stopTask(row: GroupCreationMarketingTaskRow): Promise<void> {
    try {
      await stopGroupCreationMarketingTask(row.id);
      ElMessage.success("建群营销任务已停止");
      await loadTasks();
      if (detailTask.value?.id === row.id) {
        detailTask.value = await getGroupCreationMarketingTaskDetail(row.id);
      }
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "停止建群营销任务失败"));
    }
  }

  async function openDetailDrawer(
    row: GroupCreationMarketingTaskRow
  ): Promise<void> {
    detailDrawerOpen.value = true;
    detailLoading.value = true;
    try {
      detailTask.value = await getGroupCreationMarketingTaskDetail(row.id);
    } catch (error) {
      detailTask.value = null;
      ElMessage.error(apiErrorMessage(error, "建群营销详情加载失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  function closeDetailDrawer(): void {
    detailDrawerOpen.value = false;
    detailTask.value = null;
  }

  return {
    accountGroups,
    accountGroupUsableCounts,
    accounts,
    addMaterialFiles,
    closeCreateDrawer,
    closeDetailDrawer,
    createDrawerOpen,
    createBlockReason,
    createForm,
    detailDrawerOpen,
    detailLoading,
    detailTask,
    loadAccounts,
    loadOptions,
    loadTasks,
    loading,
    marketingTemplates,
    matchRows,
    materialFiles,
    openCreateDrawer,
    openDetailDrawer,
    page,
    pageSize,
    removeMaterialFile,
    resetSearchForm,
    rows,
    searchForm,
    searchTasks,
    stopTask,
    submitCreate,
    total,
    unmatchedFiles
  };
}

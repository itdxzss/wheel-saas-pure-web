import {
  computed,
  onMounted,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type Ref
} from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteJoinTasks,
  createJoinTask,
  getJoinTaskDetail,
  getJoinTaskResults,
  listJoinTaskIntervals,
  listJoinTasks,
  updateJoinTask,
  type CreateJoinTaskRequest,
  type JoinResultRow,
  type JoinTaskDetail,
  type JoinTaskDistributionMode,
  type JoinTaskRow,
  type JoinTaskStatus
} from "@/api/join-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { listTenantAccounts, type TenantAccount } from "@/api/account";
import type { JoinFailurePolicy } from "../constants";

export interface JoinTaskSearchForm {
  keyword: string;
  status: "" | JoinTaskStatus;
  groupId: number | "";
  distributionMode: "" | JoinTaskDistributionMode;
  interval: string;
  dateRange: string[];
}

export interface JoinTaskEditorForm {
  name: string;
  accountGroupIds: number[];
  selectedAccountIds: number[];
  linksText: string;
  distributionMode: JoinTaskDistributionMode;
  accountsPerLink: number;
  executorAccountCount: number;
  linksPerAccount: number;
  fixedIntervalMinSec: number;
  fixedIntervalMaxSec: number;
  multiIntervalMinSec: number;
  multiIntervalMaxSec: number;
  retryEnabled: boolean;
  retryLimit: number;
  failurePolicy: JoinFailurePolicy;
}

export interface JoinTaskAccountOption {
  id: number;
  phone: string;
  groupId: number | null;
  groupName: string;
  loginState: number | null;
  riskStatus: number | null;
  accountState: number | null;
  isOnline: boolean;
  disabled: boolean;
  stateLabel: string;
  riskLabel: string;
  isAdmin: boolean;
}

export interface JoinTaskPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  accountKeyword: Ref<string>;
  accountOptions: Ref<JoinTaskAccountOption[]>;
  accountsLoading: Ref<boolean>;
  advancedOpen: Ref<boolean>;
  deleteSelected: () => Promise<void>;
  detailDrawerOpen: Ref<boolean>;
  detailLoading: Ref<boolean>;
  detailResults: Ref<JoinResultRow[]>;
  detailTask: Ref<JoinTaskDetail | null>;
  editorDrawerOpen: Ref<boolean>;
  editorForm: JoinTaskEditorForm;
  editorLoading: Ref<boolean>;
  editorMode: Ref<"create" | "edit" | "copy">;
  intervalOptions: Ref<string[]>;
  loading: Ref<boolean>;
  onSelectionChange: (rows: JoinTaskRow[]) => void;
  onlyAvailable: Ref<boolean>;
  onlyOnline: Ref<boolean>;
  openCopyDrawer: (row: JoinTaskRow) => Promise<void>;
  openCreateDrawer: (initial?: Partial<JoinTaskEditorForm>) => Promise<void>;
  openDetailDrawer: (row: JoinTaskRow) => Promise<void>;
  openEditDrawer: (row: JoinTaskRow) => Promise<void>;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshTasks: () => Promise<void>;
  resetSearchForm: () => void;
  rows: Ref<JoinTaskRow[]>;
  searchForm: JoinTaskSearchForm;
  searchTasks: () => void;
  selectedCount: ComputedRef<number>;
  submitEditor: () => Promise<void>;
  total: Ref<number>;
  toggleAdvanced: () => void;
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

function emptyEditorForm(): JoinTaskEditorForm {
  return {
    name: "",
    accountGroupIds: [],
    selectedAccountIds: [],
    linksText: "",
    distributionMode: "FIXED_ACCOUNTS_PER_LINK",
    accountsPerLink: 2,
    executorAccountCount: 2,
    linksPerAccount: 3,
    fixedIntervalMinSec: 10,
    fixedIntervalMaxSec: 20,
    multiIntervalMinSec: 10,
    multiIntervalMaxSec: 20,
    retryEnabled: true,
    retryLimit: 2,
    failurePolicy: "RETRY_THEN_EXPORT"
  };
}

function firstQuery(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return typeof value === "string" ? value : "";
}

function parseLinks(text: string): string[] {
  const seen = new Set<string>();
  const links: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const value = line.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    links.push(value);
  }
  return links;
}

function positiveInt(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function accountStateLabel(account: TenantAccount): string {
  if (account.account_state === 3) return "封禁";
  if (account.login_state !== 1) return "离线";
  return "在线";
}

function riskStateLabel(account: TenantAccount): string {
  if ((account.risk_status ?? 1) > 1) return "风控中";
  return "未风控";
}

function toAccountOption(account: TenantAccount): JoinTaskAccountOption | null {
  if (!account.id) return null;
  const isOnline = account.login_state === 1;
  const isBanned = account.account_state === 3;
  const isRisk = (account.risk_status ?? 1) > 1;
  return {
    id: account.id,
    phone: account.ws_phone ?? String(account.id),
    groupId: account.group_id ?? null,
    groupName: account.group_name ?? "-",
    loginState: account.login_state ?? null,
    riskStatus: account.risk_status ?? null,
    accountState: account.account_state ?? null,
    isOnline,
    disabled: !isOnline || isRisk || isBanned,
    stateLabel: accountStateLabel(account),
    riskLabel: riskStateLabel(account),
    isAdmin: false
  };
}

export function useJoinTaskPage(): JoinTaskPageState {
  const route = useRoute();

  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const accountOptions = ref<JoinTaskAccountOption[]>([]);
  const accountsLoading = ref(false);
  const accountKeyword = ref("");
  const advancedOpen = ref(false);
  const detailDrawerOpen = ref(false);
  const detailLoading = ref(false);
  const detailResults = ref<JoinResultRow[]>([]);
  const detailTask = ref<JoinTaskDetail | null>(null);
  const editorDrawerOpen = ref(false);
  const editorLoading = ref(false);
  const editorMode = ref<"create" | "edit" | "copy">("create");
  const editingTaskId = ref<number | null>(null);
  const intervalOptions = ref<string[]>([]);
  const loading = ref(false);
  const onlyAvailable = ref(true);
  const onlyOnline = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const rows = ref<JoinTaskRow[]>([]);
  const selectedRows = ref<JoinTaskRow[]>([]);
  const total = ref(0);

  const selectedCount = computed(() => selectedRows.value.length);

  const searchForm = reactive<JoinTaskSearchForm>({
    keyword: "",
    status: "",
    groupId: "",
    distributionMode: "",
    interval: "",
    dateRange: []
  });

  const editorForm = reactive<JoinTaskEditorForm>(emptyEditorForm());

  let accountRequestId = 0;

  function toListQuery() {
    const [dateFrom, dateTo] = searchForm.dateRange;
    return {
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchForm.keyword,
      status: searchForm.status,
      groupId: searchForm.groupId,
      distributionMode: searchForm.distributionMode,
      interval: searchForm.interval,
      dateFrom,
      dateTo: dateTo ? Number(dateTo) + 86_400_000 : undefined
    };
  }

  async function refreshTasks(): Promise<void> {
    loading.value = true;
    try {
      const result = await listJoinTasks(toListQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
      selectedRows.value = [];
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "加载进群任务失败"));
      rows.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function loadAccountGroups(): Promise<void> {
    try {
      const result = await listAccountGroups({ pageSize: 500 });
      accountGroups.value = result.list ?? [];
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "加载账号分组失败"));
      accountGroups.value = [];
    }
  }

  async function loadIntervals(): Promise<void> {
    try {
      intervalOptions.value = await listJoinTaskIntervals();
    } catch {
      intervalOptions.value = [];
    }
  }

  async function loadAccountsForGroups(groupIds: number[]): Promise<void> {
    const requestId = ++accountRequestId;
    if (!groupIds.length) {
      accountOptions.value = [];
      return;
    }

    accountsLoading.value = true;
    try {
      const pages = await Promise.all(
        groupIds.map(groupId =>
          listTenantAccounts({ accountGroupId: groupId, pageSize: 500 })
        )
      );
      if (requestId !== accountRequestId) return;

      const byId = new Map<number, JoinTaskAccountOption>();
      for (const pageResult of pages) {
        for (const account of pageResult.list ?? []) {
          const option = toAccountOption(account);
          if (option) byId.set(option.id, option);
        }
      }
      accountOptions.value = Array.from(byId.values());

      const loadedIds = new Set(
        accountOptions.value.map(account => account.id)
      );
      editorForm.selectedAccountIds = editorForm.selectedAccountIds.filter(id =>
        loadedIds.has(id)
      );
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "加载分组账号失败"));
      accountOptions.value = [];
    } finally {
      if (requestId === accountRequestId) accountsLoading.value = false;
    }
  }

  function resetEditorForm(initial: Partial<JoinTaskEditorForm> = {}): void {
    Object.assign(editorForm, emptyEditorForm(), initial);
    accountKeyword.value = "";
    onlyAvailable.value = true;
    onlyOnline.value = false;
  }

  function detailToForm(
    detail: JoinTaskDetail,
    mode: "edit" | "copy"
  ): Partial<JoinTaskEditorForm> {
    return {
      name: mode === "copy" ? `${detail.name} 副本` : detail.name,
      accountGroupIds: detail.accountGroupIds ?? [],
      selectedAccountIds: detail.selectedAccountIds ?? [],
      linksText: detail.linksText ?? "",
      distributionMode: detail.distributionMode,
      accountsPerLink: detail.accountsPerLink,
      executorAccountCount: detail.executorAccountCount,
      linksPerAccount: detail.linksPerAccount,
      fixedIntervalMinSec: detail.fixedIntervalMinSec,
      fixedIntervalMaxSec: detail.fixedIntervalMaxSec,
      multiIntervalMinSec: detail.multiIntervalMinSec,
      multiIntervalMaxSec: detail.multiIntervalMaxSec,
      retryEnabled: detail.retryEnabled,
      retryLimit: detail.retryLimit,
      failurePolicy: detail.failurePolicy || "RETRY_THEN_EXPORT"
    };
  }

  async function openCreateDrawer(
    initial: Partial<JoinTaskEditorForm> = {}
  ): Promise<void> {
    editorMode.value = "create";
    editingTaskId.value = null;
    resetEditorForm(initial);
    editorDrawerOpen.value = true;
    await loadAccountsForGroups(editorForm.accountGroupIds);
  }

  async function openEditorFromDetail(
    row: JoinTaskRow,
    mode: "edit" | "copy"
  ): Promise<void> {
    editorLoading.value = true;
    try {
      const detail = await getJoinTaskDetail(row.id);
      editorMode.value = mode;
      editingTaskId.value = mode === "edit" ? row.id : null;
      resetEditorForm(detailToForm(detail, mode));
      editorDrawerOpen.value = true;
      await loadAccountsForGroups(editorForm.accountGroupIds);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "加载任务配置失败"));
    } finally {
      editorLoading.value = false;
    }
  }

  async function openEditDrawer(row: JoinTaskRow): Promise<void> {
    if (row.status !== "DRAFT" || row.executed > 0) {
      ElMessage.warning("仅待启动且未执行的进群任务可编辑");
      return;
    }
    await openEditorFromDetail(row, "edit");
  }

  async function openCopyDrawer(row: JoinTaskRow): Promise<void> {
    await openEditorFromDetail(row, "copy");
  }

  function validateEditorForm(): string | null {
    const links = parseLinks(editorForm.linksText);
    const selectedMap = new Map(
      accountOptions.value.map(account => [account.id, account])
    );
    const selectedAccounts = editorForm.selectedAccountIds
      .map(id => selectedMap.get(id))
      .filter(Boolean) as JoinTaskAccountOption[];

    if (!editorForm.name.trim()) return "请填写任务名称";
    if (!editorForm.accountGroupIds.length) return "请选择账号分组";
    if (!editorForm.selectedAccountIds.length) return "请选择执行账号";
    if (selectedAccounts.length !== editorForm.selectedAccountIds.length) {
      return "部分已选账号未加载，请重新选择执行账号";
    }
    if (selectedAccounts.some(account => account.disabled)) {
      return "离线、风控或封禁账号不可作为执行账号";
    }
    if (!links.length) return "请填写进群链接";

    if (editorForm.distributionMode === "FIXED_ACCOUNTS_PER_LINK") {
      if (!positiveInt(editorForm.accountsPerLink)) {
        return "每条链接账号数必须为正整数";
      }
      if (editorForm.accountsPerLink > selectedAccounts.length) {
        return "可用执行账号不足，请减少每条链接账号数或补充账号";
      }
      if (
        !positiveInt(editorForm.fixedIntervalMinSec) ||
        !positiveInt(editorForm.fixedIntervalMaxSec) ||
        editorForm.fixedIntervalMinSec > editorForm.fixedIntervalMaxSec
      ) {
        return "方式一执行间隔必须为正整数，且最小值不能大于最大值";
      }
    }

    if (editorForm.distributionMode === "FIXED_ACCOUNT_MULTI_LINK") {
      if (
        !positiveInt(editorForm.executorAccountCount) ||
        !positiveInt(editorForm.linksPerAccount)
      ) {
        return "执行账号数量和每账号链接数必须为正整数";
      }
      if (editorForm.executorAccountCount > selectedAccounts.length) {
        return "可用执行账号不足，请减少执行账号数量或补充账号";
      }
      if (
        !positiveInt(editorForm.multiIntervalMinSec) ||
        !positiveInt(editorForm.multiIntervalMaxSec) ||
        editorForm.multiIntervalMinSec > editorForm.multiIntervalMaxSec
      ) {
        return "方式二执行间隔必须为正整数，且最小值不能大于最大值";
      }
    }

    if (editorForm.retryEnabled && !positiveInt(editorForm.retryLimit)) {
      return "开启失败重试后，重试次数必须为正整数";
    }

    return null;
  }

  function buildCreateRequest(): CreateJoinTaskRequest {
    const selectedMap = new Map(
      accountOptions.value.map(account => [account.id, account])
    );
    const groupNameMap = new Map(
      accountGroups.value.map(group => [group.id, group.name])
    );
    const linksText = parseLinks(editorForm.linksText).join("\n");

    return {
      name: editorForm.name.trim(),
      accountGroupIds: editorForm.accountGroupIds,
      accountGroupNames: editorForm.accountGroupIds.map(
        id => groupNameMap.get(id) ?? String(id)
      ),
      selectedAccounts: editorForm.selectedAccountIds.map(id => ({
        accountId: id,
        phone: selectedMap.get(id)?.phone ?? String(id)
      })),
      linksText,
      distributionMode: editorForm.distributionMode,
      accountsPerLink: editorForm.accountsPerLink,
      executorAccountCount: editorForm.executorAccountCount,
      linksPerAccount: editorForm.linksPerAccount,
      fixedIntervalMinSec: editorForm.fixedIntervalMinSec,
      fixedIntervalMaxSec: editorForm.fixedIntervalMaxSec,
      multiIntervalMinSec: editorForm.multiIntervalMinSec,
      multiIntervalMaxSec: editorForm.multiIntervalMaxSec,
      retryEnabled: editorForm.retryEnabled,
      retryLimit: editorForm.retryEnabled ? editorForm.retryLimit : 0,
      failurePolicy: editorForm.failurePolicy
    };
  }

  async function submitEditor(): Promise<void> {
    const error = validateEditorForm();
    if (error) {
      ElMessage.warning(error);
      return;
    }

    editorLoading.value = true;
    try {
      const payload = buildCreateRequest();
      if (editorMode.value === "edit" && editingTaskId.value) {
        await updateJoinTask(editingTaskId.value, payload);
        ElMessage.success("进群任务已更新");
      } else {
        await createJoinTask(payload);
        ElMessage.success("进群任务已保存");
      }
      editorDrawerOpen.value = false;
      await refreshTasks();
      await loadIntervals();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "保存进群任务失败"));
    } finally {
      editorLoading.value = false;
    }
  }

  async function openDetailDrawer(row: JoinTaskRow): Promise<void> {
    detailDrawerOpen.value = true;
    detailLoading.value = true;
    detailTask.value = null;
    detailResults.value = [];
    try {
      const [detail, results] = await Promise.all([
        getJoinTaskDetail(row.id),
        getJoinTaskResults(row.id)
      ]);
      detailTask.value = detail;
      detailResults.value = results;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "加载进群任务详情失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  async function deleteSelected(): Promise<void> {
    if (!selectedRows.value.length) return;
    const ids = selectedRows.value.map(row => row.id);
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${ids.length} 个进群任务？`,
        "批量删除",
        { type: "warning" }
      );
      const result = await batchDeleteJoinTasks(ids);
      ElMessage.success(`已删除 ${result.deleted_count} 个进群任务`);
      await refreshTasks();
    } catch (error) {
      if (error === "cancel" || error === "close") return;
      ElMessage.error(apiErrorMessage(error, "删除进群任务失败"));
    }
  }

  function onSelectionChange(selection: JoinTaskRow[]): void {
    selectedRows.value = selection;
  }

  function searchTasks(): void {
    page.value = 1;
    void refreshTasks();
  }

  function resetSearchForm(): void {
    searchForm.keyword = "";
    searchForm.status = "";
    searchForm.groupId = "";
    searchForm.distributionMode = "";
    searchForm.interval = "";
    searchForm.dateRange = [];
    searchTasks();
  }

  function toggleAdvanced(): void {
    advancedOpen.value = !advancedOpen.value;
  }

  function openCreateFromGroupList(): void {
    if (firstQuery(route.query.from) !== "group-list") return;
    const groupName = firstQuery(route.query.groupName);
    const link = firstQuery(route.query.link);
    void openCreateDrawer({
      name: groupName ? `${groupName} 进群任务` : "",
      linksText: link
    });
  }

  watch(
    () => editorForm.accountGroupIds.slice(),
    groupIds => {
      if (!editorDrawerOpen.value) return;
      void loadAccountsForGroups(groupIds);
    }
  );

  onMounted(() => {
    void Promise.all([
      loadAccountGroups(),
      loadIntervals(),
      refreshTasks()
    ]).then(openCreateFromGroupList);
  });

  return {
    accountGroups,
    accountKeyword,
    accountOptions,
    accountsLoading,
    advancedOpen,
    deleteSelected,
    detailDrawerOpen,
    detailLoading,
    detailResults,
    detailTask,
    editorDrawerOpen,
    editorForm,
    editorLoading,
    editorMode,
    intervalOptions,
    loading,
    onSelectionChange,
    onlyAvailable,
    onlyOnline,
    openCopyDrawer,
    openCreateDrawer,
    openDetailDrawer,
    openEditDrawer,
    page,
    pageSize,
    refreshTasks,
    resetSearchForm,
    rows,
    searchForm,
    searchTasks,
    selectedCount,
    submitEditor,
    total,
    toggleAdvanced
  };
}

import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  getTenantAccountSummary,
  listTenantAccounts,
  onlineTenantAccount,
  type AccountState,
  type RiskStatus,
  type TenantAccount,
  type TenantAccountListQuery,
  type TenantAccountSummary
} from "@/api/account";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";

export interface AccountSearchForm {
  keyword: string;
  phone: string;
  riskStatus: "" | "1" | "2" | "3";
  accountStatus:
    | ""
    | "正常"
    | "封禁"
    | "导出"
    | "禁言6小时"
    | "禁言24小时"
    | "解绑";
  ipGroupName: string;
  groupId: "" | number;
  country: string;
  assignedService: string;
}

export interface BatchMoveForm {
  groupId: "" | number;
  remark: string;
}

const ZERO_SUMMARY: TenantAccountSummary = {
  total: 0,
  banned: 0,
  online: 0,
  offline: 0,
  risk: 0,
  assigned: 0,
  unassigned: 0
};

// 前端缓解同账号连续点上线的竞态；后端仍需要账号级互斥做最终兜底。
const ONLINE_COOLDOWN_MS = 30_000;
const ONLINE_COOLDOWN_TICK_MS = 1_000;
const ONLINE_COOLDOWN_KEY_PREFIX = "armada:account-online-cooldown:";

function routeNumber(value: unknown): "" | number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw.trim()) return "";
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : "";
}

export interface AccountListPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  accountStatusOptions: string[];
  batchMoveForm: BatchMoveForm;
  groupLoading: Ref<boolean>;
  handleBatchAction: (command: string) => void;
  loading: Ref<boolean>;
  onSelectionChange: (selection: TenantAccount[]) => void;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshAccountList: () => Promise<void>;
  resetSearchForm: () => void;
  riskStatusOptions: Array<{ label: string; value: string }>;
  handleRowAction: (row: TenantAccount, action: string) => void;
  isOnlineActionDisabled: (row: TenantAccount) => boolean;
  onlineActionLabel: (row: TenantAccount) => string;
  rows: Ref<TenantAccount[]>;
  searchAccounts: () => void;
  searchForm: AccountSearchForm;
  selectedCount: ComputedRef<number>;
  showAdvancedSearch: Ref<boolean>;
  showBatchMoveDrawer: Ref<boolean>;
  statCards: ComputedRef<Array<{ key: string; label: string; value: number }>>;
  submitBatchMove: () => void;
  total: Ref<number>;
}

export function useAccountListPage(): AccountListPageState {
  const route = useRoute();
  const initialGroupId = routeNumber(
    route.query.accountGroupId ?? route.query.groupId
  );
  const riskStatusOptions = [
    { label: "未风控", value: "1" },
    { label: "风控中", value: "2" },
    { label: "待解除", value: "3" }
  ];
  const accountStatusOptions = [
    "正常",
    "封禁",
    "导出",
    "禁言6小时",
    "禁言24小时",
    "解绑"
  ];
  const searchForm = reactive<AccountSearchForm>({
    keyword: "",
    phone: "",
    riskStatus: "",
    accountStatus: "",
    ipGroupName: "",
    groupId: initialGroupId,
    country: "",
    assignedService: ""
  });
  const batchMoveForm = reactive<BatchMoveForm>({
    groupId: "",
    remark: ""
  });
  const summary = ref<TenantAccountSummary>({ ...ZERO_SUMMARY });
  const rows = ref<TenantAccount[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const selectedRows = ref<TenantAccount[]>([]);
  const loading = ref(false);
  const groupLoading = ref(false);
  const showAdvancedSearch = ref(initialGroupId !== "");
  const showBatchMoveDrawer = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const now = ref(Date.now());
  // Set 记录正在提交的账号，Map 负责当前页面内的倒计时响应。
  const onlineSubmittingIds = ref<Set<number>>(new Set());
  const onlineCooldownUntilById = ref<Map<number, number>>(new Map());
  let onlineCooldownTimer: number | null = null;

  const statCards = computed(() => [
    { key: "total", label: "总账号数", value: summary.value.total },
    { key: "banned", label: "封禁账号", value: summary.value.banned },
    { key: "online", label: "在线账号", value: summary.value.online },
    { key: "offline", label: "离线账号", value: summary.value.offline },
    { key: "risk", label: "风控账号", value: summary.value.risk },
    { key: "assigned", label: "已分配账号", value: summary.value.assigned },
    { key: "unassigned", label: "未分配账户", value: summary.value.unassigned }
  ]);
  const selectedCount = computed(() => selectedRows.value.length);

  function apiErrorMessage(error: unknown, fallback: string) {
    const data = (
      error as { response?: { data?: { msg?: unknown; message?: unknown } } }
    )?.response?.data;
    const message = data?.msg ?? data?.message;
    return typeof message === "string" && message.trim()
      ? message.trim()
      : fallback;
  }

  function accountId(row: TenantAccount): number | null {
    return typeof row.id === "number" && Number.isSafeInteger(row.id)
      ? row.id
      : null;
  }

  function onlineCooldownKey(id: number): string {
    return `${ONLINE_COOLDOWN_KEY_PREFIX}${id}`;
  }

  // localStorage 让刷新页面或重新打开账号列表后，未过期的 30 秒冷却仍然生效。
  function readOnlineCooldownUntil(id: number): number {
    const inMemoryUntil = onlineCooldownUntilById.value.get(id) ?? 0;
    let storedUntil = 0;
    try {
      const raw = window.localStorage.getItem(onlineCooldownKey(id));
      const value = raw ? Number(raw) : 0;
      storedUntil = Number.isFinite(value) && value > 0 ? value : 0;
      if (storedUntil > 0 && storedUntil <= now.value) {
        window.localStorage.removeItem(onlineCooldownKey(id));
      }
    } catch {
      storedUntil = 0;
    }
    const until = Math.max(inMemoryUntil, storedUntil);
    if (until <= now.value) {
      onlineCooldownUntilById.value.delete(id);
      return 0;
    }
    return until;
  }

  function writeOnlineCooldown(id: number): void {
    const until = Date.now() + ONLINE_COOLDOWN_MS;
    onlineCooldownUntilById.value.set(id, until);
    try {
      window.localStorage.setItem(onlineCooldownKey(id), String(until));
    } catch {
      // localStorage 不可用时仍保留当前页面内的 30 秒禁用。
    }
    now.value = Date.now();
  }

  function setOnlineSubmitting(id: number, submitting: boolean): void {
    const next = new Set(onlineSubmittingIds.value);
    if (submitting) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onlineSubmittingIds.value = next;
  }

  function onlineCooldownRemaining(row: TenantAccount): number {
    const id = accountId(row);
    if (!id) return 0;
    const until = readOnlineCooldownUntil(id);
    return Math.max(
      0,
      Math.ceil((until - now.value) / ONLINE_COOLDOWN_TICK_MS)
    );
  }

  function isOnlineActionDisabled(row: TenantAccount): boolean {
    const id = accountId(row);
    if (!id || row.login_state === 1) return false;
    return (
      onlineSubmittingIds.value.has(id) || onlineCooldownRemaining(row) > 0
    );
  }

  function onlineActionLabel(row: TenantAccount): string {
    if (row.login_state === 1) return "下线";
    const remaining = onlineCooldownRemaining(row);
    return remaining > 0 ? `上线(${remaining}s)` : "上线";
  }

  function buildQuery(): TenantAccountListQuery {
    const query: TenantAccountListQuery = {
      page: page.value,
      pageSize: pageSize.value
    };
    if (searchForm.keyword.trim()) query.keyword = searchForm.keyword.trim();
    if (searchForm.phone.trim()) query.phone = searchForm.phone.trim();
    if (searchForm.riskStatus) {
      query.riskStatus = Number(searchForm.riskStatus) as RiskStatus;
    }
    if (searchForm.accountStatus) {
      const accountStateMap: Record<string, AccountState | undefined> = {
        正常: 2,
        封禁: 3,
        导出: 4,
        解绑: 5
      };
      const accountState = accountStateMap[searchForm.accountStatus];
      if (accountState) query.accountState = accountState;
      if (searchForm.accountStatus === "禁言6小时") query.mute_status = "6h";
      if (searchForm.accountStatus === "禁言24小时") query.mute_status = "24h";
    }
    if (searchForm.ipGroupName) query.ip_group_name = searchForm.ipGroupName;
    if (searchForm.groupId) query.accountGroupId = Number(searchForm.groupId);
    if (searchForm.country.trim()) query.country = searchForm.country.trim();
    if (searchForm.assignedService)
      query.assigned_service = searchForm.assignedService;
    return query;
  }

  async function loadSummary() {
    try {
      summary.value = await getTenantAccountSummary();
    } catch {
      summary.value = { ...ZERO_SUMMARY };
    }
  }

  async function loadAccountGroups() {
    groupLoading.value = true;
    try {
      const response = await listAccountGroups({ page: 1, pageSize: 200 });
      accountGroups.value = response.list ?? [];
    } catch (error) {
      accountGroups.value = [];
      ElMessage.warning(apiErrorMessage(error, "账号分组加载失败"));
    } finally {
      groupLoading.value = false;
    }
  }

  async function refreshAccountList() {
    loading.value = true;
    void loadSummary();
    try {
      const response = await listTenantAccounts(buildQuery());
      rows.value = response.list ?? [];
      total.value = response.total ?? 0;
      selectedRows.value = selectedRows.value.filter(row =>
        rows.value.some(item => item.id === row.id)
      );
    } catch (error) {
      rows.value = [];
      total.value = 0;
      selectedRows.value = [];
      ElMessage.error(apiErrorMessage(error, "账号列表加载失败"));
    } finally {
      loading.value = false;
    }
  }

  function searchAccounts() {
    page.value = 1;
    void refreshAccountList();
  }

  function resetSearchForm() {
    searchForm.keyword = "";
    searchForm.phone = "";
    searchForm.riskStatus = "";
    searchForm.accountStatus = "";
    searchForm.ipGroupName = "";
    searchForm.groupId = "";
    searchForm.country = "";
    searchForm.assignedService = "";
    searchAccounts();
  }

  function onSelectionChange(selection: TenantAccount[]) {
    selectedRows.value = selection;
  }

  function openBatchMoveDrawer() {
    if (selectedRows.value.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    batchMoveForm.groupId = "";
    batchMoveForm.remark = "";
    showBatchMoveDrawer.value = true;
  }

  function submitBatchMove() {
    if (!batchMoveForm.groupId) {
      ElMessage.warning("请选择目标分组");
      return;
    }
    ElMessage.warning("迁移到分组写接口待接入，当前只完成账号列表页面迁移");
  }

  async function submitOnline(row: TenantAccount): Promise<void> {
    const id = accountId(row);
    if (!id) {
      ElMessage.warning("账号 ID 为空，无法上线");
      return;
    }
    if (isOnlineActionDisabled(row)) return;

    // 点击后立即开始冷却，不等接口返回，避免慢请求窗口里被重复点击。
    writeOnlineCooldown(id);
    setOnlineSubmitting(id, true);
    try {
      const result = await onlineTenantAccount(id);
      if (result.accepted) {
        ElMessage.success("上线请求已提交");
      } else {
        ElMessage.warning("协议层未受理上线请求");
      }
      void refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "上线请求失败"));
    } finally {
      setOnlineSubmitting(id, false);
    }
  }

  function handleBatchAction(command: string) {
    if (command === "move-group") {
      openBatchMoveDrawer();
      return;
    }
    if (selectedRows.value.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    const labelMap: Record<string, string> = {
      online: "登录",
      offline: "离线",
      delete: "批量删除"
    };
    ElMessage.warning(
      `${labelMap[command] ?? "批量操作"}接口待接入，未伪造成功结果`
    );
  }

  function handleRowAction(row: TenantAccount, action: string) {
    if (action === "上线") {
      void submitOnline(row);
      return;
    }
    ElMessage.warning(`${action}接口待接入，未伪造成功结果`);
  }

  onMounted(() => {
    onlineCooldownTimer = window.setInterval(() => {
      now.value = Date.now();
    }, ONLINE_COOLDOWN_TICK_MS);
    void loadAccountGroups();
    void refreshAccountList();
  });

  onUnmounted(() => {
    if (onlineCooldownTimer !== null) {
      window.clearInterval(onlineCooldownTimer);
    }
  });

  return {
    accountGroups,
    accountStatusOptions,
    batchMoveForm,
    groupLoading,
    handleBatchAction,
    loading,
    onSelectionChange,
    page,
    pageSize,
    refreshAccountList,
    resetSearchForm,
    riskStatusOptions,
    handleRowAction,
    isOnlineActionDisabled,
    onlineActionLabel,
    rows,
    searchAccounts,
    searchForm,
    selectedCount,
    showAdvancedSearch,
    showBatchMoveDrawer,
    statCards,
    submitBatchMove,
    total
  };
}

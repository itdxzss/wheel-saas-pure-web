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
  batchDeleteTenantAccounts,
  batchMigrateTenantAccountsToGroup,
  batchOfflineTenantAccounts,
  batchOnlineTenantAccounts,
  getTenantAccountSummary,
  listTenantAccounts,
  onlineTenantAccount,
  type AccountState,
  type AccountType,
  type LoginState,
  type NumberSource,
  type RiskStatus,
  type TenantAccount,
  type TenantAccountListQuery,
  type TenantAccountSummary
} from "@/api/account";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";
import {
  buildAccountStatCards,
  canDeleteAccount,
  type AccountStatCard
} from "../account-display";
import {
  buildBatchMoveInput,
  type BatchMoveForm,
  type BatchMoveMode
} from "../account-move";

export interface AccountSearchForm {
  keyword: string;
  phone: string;
  accountType: "" | AccountType;
  protocolId: string;
  numberSource: "" | NumberSource;
  channelName: string;
  truthIp: string;
  loginState: "" | "1" | "2";
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
  accountTypeOptions: Array<{ label: string; value: AccountType }>;
  batchMoveForm: BatchMoveForm;
  batchMoveModeOptions: Array<{ label: string; value: BatchMoveMode }>;
  groupLoading: Ref<boolean>;
  handleBatchAction: (command: string) => void;
  loginStateOptions: Array<{ label: string; value: string }>;
  loading: Ref<boolean>;
  numberSourceOptions: Array<{ label: string; value: NumberSource }>;
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
  statCards: ComputedRef<AccountStatCard[]>;
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
  const loginStateOptions = [
    { label: "在线", value: "1" },
    { label: "离线", value: "2" }
  ];
  const accountTypeOptions: Array<{ label: string; value: AccountType }> = [
    { label: "个人号", value: 1 },
    { label: "商业号", value: 2 }
  ];
  const numberSourceOptions: Array<{ label: string; value: NumberSource }> = [
    { label: "买量", value: 1 },
    { label: "裂变", value: 2 },
    { label: "自购", value: 3 }
  ];
  const accountStatusOptions = [
    "正常",
    "封禁",
    "导出",
    "禁言6小时",
    "禁言24小时",
    "解绑"
  ];
  const batchMoveModeOptions: Array<{ label: string; value: BatchMoveMode }> = [
    { label: "已有分组", value: "existing" },
    { label: "新建分组", value: "new" }
  ];
  const searchForm = reactive<AccountSearchForm>({
    keyword: "",
    phone: "",
    accountType: "",
    protocolId: "",
    numberSource: "",
    channelName: "",
    truthIp: "",
    loginState: "",
    riskStatus: "",
    accountStatus: "",
    ipGroupName: "",
    groupId: initialGroupId,
    country: "",
    assignedService: ""
  });
  const batchMoveForm = reactive<BatchMoveForm>({
    mode: "existing",
    groupId: "",
    newGroupName: "",
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

  const statCards = computed(() => buildAccountStatCards(summary.value));
  const selectedCount = computed(() => selectedRows.value.length);

  function accountId(row: TenantAccount): number | null {
    return typeof row.id === "number" && Number.isSafeInteger(row.id)
      ? row.id
      : null;
  }

  function selectedAccountIds(): number[] {
    return selectedRows.value
      .map(row => accountId(row))
      .filter((id): id is number => id !== null);
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
    if (searchForm.accountType) query.accountType = searchForm.accountType;
    if (searchForm.protocolId.trim())
      query.protocolId = searchForm.protocolId.trim();
    if (searchForm.numberSource) query.numberSource = searchForm.numberSource;
    if (searchForm.channelName.trim())
      query.channelName = searchForm.channelName.trim();
    if (searchForm.truthIp.trim()) query.truthIp = searchForm.truthIp.trim();
    if (searchForm.loginState) {
      query.loginState = Number(searchForm.loginState) as LoginState;
    }
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
      if (searchForm.accountStatus === "禁言6小时") query.muteStatus = 1;
      if (searchForm.accountStatus === "禁言24小时") query.muteStatus = 2;
    }
    if (searchForm.groupId) query.accountGroupId = Number(searchForm.groupId);
    if (searchForm.country.trim()) query.country = searchForm.country.trim();
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
    searchForm.accountType = "";
    searchForm.protocolId = "";
    searchForm.numberSource = "";
    searchForm.channelName = "";
    searchForm.truthIp = "";
    searchForm.loginState = "";
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
    if (selectedAccountIds().length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    batchMoveForm.mode = "existing";
    batchMoveForm.groupId = "";
    batchMoveForm.newGroupName = "";
    batchMoveForm.remark = "";
    showBatchMoveDrawer.value = true;
  }

  async function submitBatchMove(): Promise<void> {
    const ids = selectedAccountIds();
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    const result = buildBatchMoveInput(ids, batchMoveForm);
    if (result.ok === false) {
      ElMessage.warning(result.message);
      return;
    }
    try {
      await batchMigrateTenantAccountsToGroup(result.payload);
      ElMessage.success("迁移分组成功");
      showBatchMoveDrawer.value = false;
      selectedRows.value = [];
      if (result.payload.newGroupName) {
        await loadAccountGroups();
      }
      await refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "迁移分组失败"));
    }
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

  function batchResultMessage(
    prefix: string,
    result: { requested: number; accepted: number }
  ): string {
    return `${prefix}，已受理 ${result.accepted}/${result.requested}`;
  }

  async function submitBatchOnline(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    ids.forEach(id => {
      writeOnlineCooldown(id);
      setOnlineSubmitting(id, true);
    });
    try {
      const result = await batchOnlineTenantAccounts(ids);
      ElMessage.success(batchResultMessage("登录请求已提交", result));
      await refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "登录请求失败"));
    } finally {
      ids.forEach(id => setOnlineSubmitting(id, false));
    }
  }

  async function submitBatchOffline(
    ids: number[],
    successPrefix = "离线请求已提交"
  ): Promise<void> {
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    try {
      const result = await batchOfflineTenantAccounts(ids);
      ElMessage.success(batchResultMessage(successPrefix, result));
      await refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "离线请求失败"));
    }
  }

  async function submitBatchDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    const deleteText =
      ids.length === 1 ? "该账号" : `选中的 ${ids.length} 个账号`;
    if (
      !window.confirm(
        `确认删除${deleteText}？仅封禁、导出、解绑且不在任务中的账号可删除。`
      )
    ) {
      return;
    }
    try {
      await batchDeleteTenantAccounts(ids);
      ElMessage.success("删除成功");
      selectedRows.value = [];
      await refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "删除失败"));
    }
  }

  function handleBatchAction(command: string) {
    if (command === "move-group") {
      openBatchMoveDrawer();
      return;
    }
    const ids = selectedAccountIds();
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    if (command === "online") {
      void submitBatchOnline(ids);
      return;
    }
    if (command === "offline") {
      void submitBatchOffline(ids);
      return;
    }
    if (command === "delete") {
      void submitBatchDelete(ids);
      return;
    }
    ElMessage.warning("未知批量操作");
  }

  function handleRowAction(row: TenantAccount, action: string) {
    if (action === "上线") {
      void submitOnline(row);
      return;
    }
    const id = accountId(row);
    if (!id) {
      ElMessage.warning("账号 ID 为空，无法操作");
      return;
    }
    if (action === "下线") {
      void submitBatchOffline([id], "下线请求已提交");
      return;
    }
    if (action === "删除") {
      if (!canDeleteAccount(row)) {
        ElMessage.warning("仅封禁、导出、解绑且不在任务中的账号可删除");
        return;
      }
      void submitBatchDelete([id]);
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
    accountTypeOptions,
    batchMoveForm,
    batchMoveModeOptions,
    groupLoading,
    handleBatchAction,
    loginStateOptions,
    loading,
    numberSourceOptions,
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

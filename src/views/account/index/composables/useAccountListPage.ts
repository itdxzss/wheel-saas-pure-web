import {
  computed,
  h,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteTenantAccounts,
  batchMigrateTenantAccountsToGroup,
  batchOfflineTenantAccounts,
  batchOfflineTenantAccountsByQuery,
  batchOnlineTenantAccounts,
  batchOnlineTenantAccountsByQuery,
  batchTakeoverTenantAccounts,
  exportTenantAccountWsPhones,
  getTenantAccountSummary,
  listTenantAccounts,
  onlineTenantAccount,
  previewTenantAccountBatch,
  type AccountType,
  type LoginState,
  type MarketingOccupancyDisplayType,
  type NumberSource,
  type RiskStatus,
  type TenantAccount,
  type TenantAccountBatchOperation,
  type TenantAccountBatchQuery,
  type TenantAccountListQuery,
  type TenantAccountSummary
} from "@/api/account";
import { toTenantAccountBatchQuery } from "@/api/account-mapping";
import {
  getAccountGroupMarketingOccupancy,
  listAccountGroups,
  type AccountGroupApiRow,
  type AccountGroupMarketingOccupancy
} from "@/api/account-group";
import { apiErrorMessage, isRequestTimeout } from "@/utils/api-error";
import { currentUserDataStorageKey } from "@/utils/current-user-data-storage";
import { downloadBlobFile } from "@/utils/download";
import {
  buildAccountStatCards,
  canDeleteAccount,
  type AccountStatCard
} from "../account-display";
import {
  accountStatusOptions,
  accountStatusToQuery,
  type AccountStatusFilter
} from "../account-status-filter";
import {
  buildBatchMoveInput,
  type BatchMoveForm,
  type BatchMoveMode
} from "../account-move";
import {
  isTakeoverCandidate,
  singleOnlineBlockedTip,
  takeoverBatchDisabledTip,
  TAKEOVER_SELECTION_MESSAGE
} from "../account-takeover";
import {
  batchCommandResultMessage,
  batchConfirmMessage,
  buildBatchPreviewRequest
} from "../account-batch-operation";
import {
  createAccountQueryState,
  type AccountQueryRequest
} from "../account-query-state";
import { analyzeWsPhoneExportSelection } from "../account-ws-phone-export";
import { createMarketingOccupancyDetailSession } from "../marketing-occupancy";

export interface AccountSearchForm {
  keyword: string;
  phone: string;
  accountType: "" | AccountType;
  protocolId: string;
  numberSource: "" | NumberSource;
  channelName: string;
  truthIp: string;
  loginState: "" | "1" | "2" | "3";
  riskStatus: "" | "1" | "2" | "3";
  accountStatus: AccountStatusFilter;
  ipGroupName: string;
  groupId: "" | number;
  marketingOccupancyType: "" | MarketingOccupancyDisplayType;
  occupiedTaskKeyword: string;
  occupiedBusinessType: "" | number;
  callable: "" | boolean;
  country: string;
  assignedService: string;
}

const ZERO_SUMMARY: TenantAccountSummary = {
  total: 0,
  banned: 0,
  unbound: 0,
  muted: 0,
  exported: 0,
  restricted: 0,
  restrictedTotal: 0,
  online: 0,
  offline: 0,
  pendingOnline: 0,
  risk: 0,
  assigned: 0,
  unassigned: 0
};

// 前端缓解同账号连续点上线的竞态；后端仍需要账号级互斥做最终兜底。
const ONLINE_COOLDOWN_MS = 30_000;
const ONLINE_COOLDOWN_TICK_MS = 1_000;
const ONLINE_COOLDOWN_KEY_PREFIX = "armada:account-online-cooldown:";
// 批量上线冷却只在当前页面生效，不持久化到 localStorage。
const BATCH_ONLINE_COOLDOWN_MS = 30_000;

function routeNumber(value: unknown): "" | number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw.trim()) return "";
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : "";
}

export interface AccountListPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  accountStatusOptions: string[];
  batchOnlineCooldownRemaining: ComputedRef<number>;
  batchSubmitting: Ref<boolean>;
  accountTypeOptions: Array<{ label: string; value: AccountType }>;
  batchMoveForm: BatchMoveForm;
  batchMoveModeOptions: Array<{ label: string; value: BatchMoveMode }>;
  groupLoading: Ref<boolean>;
  handleBatchAction: (command: string) => void;
  loginStateOptions: Array<{ label: string; value: string }>;
  loading: Ref<boolean>;
  marketingOccupancyDetail: Ref<AccountGroupMarketingOccupancy | null>;
  marketingOccupancyDialogOpen: Ref<boolean>;
  marketingOccupancyLoading: Ref<boolean>;
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
  openMarketingOccupancy: (row: TenantAccount) => Promise<void>;
  rows: Ref<TenantAccount[]>;
  searchAccounts: () => void;
  searchForm: AccountSearchForm;
  selectedCount: ComputedRef<number>;
  showAdvancedSearch: Ref<boolean>;
  showBatchMoveDrawer: Ref<boolean>;
  statCards: ComputedRef<AccountStatCard[]>;
  submitBatchMove: () => void;
  takeoverBatchDisabled: ComputedRef<boolean>;
  takeoverBatchTip: ComputedRef<string>;
  total: Ref<number>;
  wsExporting: Ref<boolean>;
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
    { label: "离线", value: "2" },
    { label: "待上线", value: "3" }
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
    marketingOccupancyType: "",
    occupiedTaskKeyword: "",
    occupiedBusinessType: "",
    callable: "",
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
  const batchSubmitting = ref(false);
  const groupLoading = ref(false);
  const wsExporting = ref(false);
  const showAdvancedSearch = ref(initialGroupId !== "");
  const showBatchMoveDrawer = ref(false);
  const marketingOccupancyDialogOpen = ref(false);
  const marketingOccupancyLoading = ref(false);
  const marketingOccupancyDetail = ref<AccountGroupMarketingOccupancy | null>(
    null
  );
  // 会话负责请求去重与失效；弹窗只接收最后一次点击对应的结果。
  const marketingOccupancySession = createMarketingOccupancyDetailSession(
    getAccountGroupMarketingOccupancy
  );
  let marketingOccupancyRequestVersion = 0;
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const queryState = createAccountQueryState();
  const now = ref(Date.now());
  const batchOnlineCooldownUntil = ref(0);
  // Set 记录正在提交的账号，Map 负责当前页面内的倒计时响应。
  const onlineSubmittingIds = ref<Set<number>>(new Set());
  const onlineCooldownUntilById = ref<Map<number, number>>(new Map());
  let onlineCooldownTimer: number | null = null;

  const statCards = computed(() => buildAccountStatCards(summary.value));
  const selectedCount = computed(() => selectedRows.value.length);
  const batchOnlineCooldownRemaining = computed(() =>
    Math.max(
      0,
      Math.ceil(
        (batchOnlineCooldownUntil.value - now.value) / ONLINE_COOLDOWN_TICK_MS
      )
    )
  );
  const takeoverBatchTip = computed(() =>
    takeoverBatchDisabledTip(selectedRows.value)
  );
  const takeoverBatchDisabled = computed(() => takeoverBatchTip.value !== "");

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

  function onlineCooldownKey(id: number): string | null {
    return currentUserDataStorageKey(`${ONLINE_COOLDOWN_KEY_PREFIX}${id}`);
  }

  // localStorage 让刷新页面或重新打开账号列表后，未过期的 30 秒冷却仍然生效。
  function readOnlineCooldownUntil(id: number): number {
    const inMemoryUntil = onlineCooldownUntilById.value.get(id) ?? 0;
    let storedUntil = 0;
    try {
      const storageKey = onlineCooldownKey(id);
      if (storageKey) {
        const raw = window.localStorage.getItem(storageKey);
        const value = raw ? Number(raw) : 0;
        storedUntil = Number.isFinite(value) && value > 0 ? value : 0;
        if (storedUntil > 0 && storedUntil <= now.value) {
          window.localStorage.removeItem(storageKey);
        }
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
      const storageKey = onlineCooldownKey(id);
      if (storageKey) {
        window.localStorage.setItem(storageKey, String(until));
      }
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
    if (singleOnlineBlockedTip(row)) return true;
    return (
      onlineSubmittingIds.value.has(id) || onlineCooldownRemaining(row) > 0
    );
  }

  function onlineActionLabel(row: TenantAccount): string {
    if (row.login_state === 1) return "下线";
    const remaining = onlineCooldownRemaining(row);
    return remaining > 0 ? `上线(${remaining}s)` : "上线";
  }

  function buildEditingFilters(): TenantAccountBatchQuery {
    const query: TenantAccountListQuery = {};
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
      Object.assign(query, accountStatusToQuery(searchForm.accountStatus));
    }
    if (searchForm.groupId) query.accountGroupId = Number(searchForm.groupId);
    if (searchForm.marketingOccupancyType) {
      query.marketingOccupancyType = searchForm.marketingOccupancyType;
    }
    if (searchForm.occupiedTaskKeyword.trim()) {
      query.occupiedTaskKeyword = searchForm.occupiedTaskKeyword.trim();
    }
    if (searchForm.occupiedBusinessType) {
      query.occupiedBusinessType = searchForm.occupiedBusinessType;
    }
    if (searchForm.callable !== "") query.callable = searchForm.callable;
    if (searchForm.country.trim()) query.country = searchForm.country.trim();
    return toTenantAccountBatchQuery(query);
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

  async function loadAccountList(
    request: AccountQueryRequest,
    requestedPage: number,
    applyFiltersOnSuccess: boolean
  ): Promise<boolean> {
    loading.value = true;
    void loadSummary();
    try {
      const response = await listTenantAccounts({
        ...request.filters,
        page: requestedPage,
        pageSize: pageSize.value
      });
      if (!queryState.isLatest(request)) return false;
      rows.value = response.list ?? [];
      total.value = response.total ?? 0;
      page.value = requestedPage;
      selectedRows.value = [];
      marketingOccupancyRequestVersion += 1;
      marketingOccupancySession.invalidate();
      marketingOccupancyDialogOpen.value = false;
      marketingOccupancyLoading.value = false;
      marketingOccupancyDetail.value = null;
      if (applyFiltersOnSuccess) queryState.commit(request);
      return true;
    } catch (error) {
      if (queryState.isLatest(request)) {
        ElMessage.error(apiErrorMessage(error, "账号列表加载失败"));
      }
      return false;
    } finally {
      if (queryState.isLatest(request)) loading.value = false;
    }
  }

  async function refreshAccountList(): Promise<void> {
    const appliedFilters = queryState.applied();
    if (appliedFilters === null) {
      const initialRequest = queryState.begin(buildEditingFilters());
      await loadAccountList(initialRequest, 1, true);
      return;
    }
    const request = queryState.begin(appliedFilters);
    await loadAccountList(request, page.value, false);
  }

  function searchAccounts() {
    const request = queryState.begin(buildEditingFilters());
    void loadAccountList(request, 1, true);
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
    searchForm.marketingOccupancyType = "";
    searchForm.occupiedTaskKeyword = "";
    searchForm.occupiedBusinessType = "";
    searchForm.callable = "";
    searchForm.country = "";
    searchForm.assignedService = "";
    searchAccounts();
  }

  function onSelectionChange(selection: TenantAccount[]) {
    selectedRows.value = selection;
  }

  /**
   * 用户点击分组标签后再加载详情；同一页面内重复点击复用一次结果。
   */
  async function openMarketingOccupancy(row: TenantAccount): Promise<void> {
    const groupId = row.group_id;
    if (!groupId) return;

    const requestVersion = ++marketingOccupancyRequestVersion;
    marketingOccupancyDialogOpen.value = true;
    marketingOccupancyDetail.value = null;
    marketingOccupancyLoading.value = true;
    try {
      const detail = await marketingOccupancySession.select(groupId);
      if (detail) marketingOccupancyDetail.value = detail;
    } catch (error) {
      if (requestVersion === marketingOccupancyRequestVersion) {
        ElMessage.error(apiErrorMessage(error, "营销占用详情加载失败"));
      }
    } finally {
      if (requestVersion === marketingOccupancyRequestVersion) {
        marketingOccupancyLoading.value = false;
      }
    }
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
    const blockedTip = singleOnlineBlockedTip(row);
    if (blockedTip) {
      ElMessage.warning(blockedTip);
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
      } else if (result.stateSource === "ALREADY_PENDING") {
        ElMessage.warning("正在上线，请稍后");
      } else if (result.stateSource === "ALREADY_ONLINE") {
        ElMessage.info("账号已在线");
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

  async function submitLifecycleBatch(
    operation: TenantAccountBatchOperation
  ): Promise<void> {
    if (batchSubmitting.value) return;
    if (operation === "ONLINE" && batchOnlineCooldownRemaining.value > 0) {
      ElMessage.warning(
        `请稍后 ${batchOnlineCooldownRemaining.value} 秒再发起批量登录`
      );
      return;
    }
    const ids = selectedAccountIds();
    const appliedFilters = queryState.applied();
    if (!queryState.hasApplied() || appliedFilters === null) {
      ElMessage.warning("账号列表尚未加载成功，请先查询后再执行批量操作");
      return;
    }
    const appliedRevision = queryState.appliedRevision();
    const previewRequest = buildBatchPreviewRequest(
      operation,
      ids,
      appliedFilters
    );
    // 预估请求超时不代表上线已发起，只有执行请求发出后才能提示“正在上线”。
    let onlineRequestDispatched = false;
    batchSubmitting.value = true;
    try {
      const preview = await previewTenantAccountBatch(previewRequest);
      if (preview.executable === 0) {
        ElMessage.warning("当前范围内没有可执行账号");
        return;
      }
      if (queryState.appliedRevision() !== appliedRevision) {
        ElMessage.warning("账号列表筛选条件已更新，请重新发起批量操作");
        return;
      }
      await ElMessageBox.confirm(
        batchConfirmMessage(
          operation,
          ids.length,
          Object.keys(appliedFilters).length > 0,
          preview
        ),
        operation === "ONLINE" ? "确认批量登录" : "确认批量离线",
        {
          confirmButtonText: "继续执行",
          cancelButtonText: "取消",
          type: "warning"
        }
      );
      if (queryState.appliedRevision() !== appliedRevision) {
        ElMessage.warning("账号列表筛选条件已更新，请重新发起批量操作");
        return;
      }
      if (operation === "ONLINE") {
        batchOnlineCooldownUntil.value = Date.now() + BATCH_ONLINE_COOLDOWN_MS;
        now.value = Date.now();
        onlineRequestDispatched = true;
      }
      const result =
        ids.length > 0
          ? operation === "ONLINE"
            ? await batchOnlineTenantAccounts(ids)
            : await batchOfflineTenantAccounts(ids)
          : operation === "ONLINE"
            ? await batchOnlineTenantAccountsByQuery(appliedFilters)
            : await batchOfflineTenantAccountsByQuery(appliedFilters);
      ElMessage.success(batchCommandResultMessage(operation, result));
      selectedRows.value = [];
      await refreshAccountList();
    } catch (error) {
      if (error === "cancel" || error === "close") return;
      if (
        operation === "ONLINE" &&
        onlineRequestDispatched &&
        isRequestTimeout(error)
      ) {
        ElMessage.warning("正在上线，请稍后");
        void refreshAccountList();
        return;
      }
      ElMessage.error(
        apiErrorMessage(
          error,
          operation === "ONLINE" ? "批量登录失败" : "批量离线失败"
        )
      );
    } finally {
      batchSubmitting.value = false;
    }
  }

  async function submitSingleOffline(id: number): Promise<void> {
    try {
      const result = await batchOfflineTenantAccounts([id]);
      ElMessage.success(batchResultMessage("下线请求已提交", result));
      await refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "下线请求失败"));
    }
  }

  async function submitBatchTakeover(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    if (!selectedRows.value.every(isTakeoverCandidate)) {
      ElMessage.warning(TAKEOVER_SELECTION_MESSAGE);
      return;
    }
    ids.forEach(id => {
      writeOnlineCooldown(id);
      setOnlineSubmitting(id, true);
    });
    try {
      const result = await batchTakeoverTenantAccounts(ids);
      ElMessage.success(batchResultMessage("一键抢登请求已提交", result));
      await refreshAccountList();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "一键抢登失败"));
    } finally {
      ids.forEach(id => setOnlineSubmitting(id, false));
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

  async function submitWsPhoneExport(): Promise<void> {
    if (wsExporting.value) return;
    const selectedSnapshot = [...selectedRows.value];
    if (selectedSnapshot.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }

    const analysis = analyzeWsPhoneExportSelection(selectedSnapshot);
    if (analysis.invalidIdCount > 0) {
      ElMessage.error("勾选的账号数据异常，请刷新列表后重试");
      return;
    }
    const confirmContent =
      analysis.abnormalCount > 0
        ? [
            h(
              "p",
              `本次预计导出 ${analysis.normalCount + analysis.abnormalCount} 个WS号码。`
            ),
            h("p", `正常状态账号：${analysis.normalCount}个`),
            h("p", `非正常状态账号：${analysis.abnormalCount}个`),
            h("p", `导出文件名称：${analysis.previewFilename}`)
          ]
        : [
            h("p", `本次预计导出 ${analysis.normalCount}个WS号码。`),
            h("p", `导出文件名称：${analysis.previewFilename}`)
          ];

    try {
      await ElMessageBox.confirm(h("div", confirmContent), "确认导出WS号", {
        confirmButtonText: "确认导出",
        cancelButtonText: "取消",
        type: "warning"
      });
    } catch {
      return;
    }

    wsExporting.value = true;
    try {
      const result = await exportTenantAccountWsPhones({
        ids: analysis.ids,
        ...(analysis.groupName ? { groupName: analysis.groupName } : {})
      });
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(`导出成功，共导出${result.exportedCount}个WS号码。`);
    } catch (error) {
      const message = apiErrorMessage(error, "导出失败，请重新操作。");
      if (message === "当前所选账号中没有可导出的有效WS号码。") {
        ElMessage.warning(message);
      } else {
        ElMessage.error(message);
      }
    } finally {
      wsExporting.value = false;
    }
  }

  function handleBatchAction(command: string) {
    if (command === "move-group") {
      openBatchMoveDrawer();
      return;
    }
    if (command === "online") {
      void submitLifecycleBatch("ONLINE");
      return;
    }
    if (command === "offline") {
      void submitLifecycleBatch("OFFLINE");
      return;
    }
    if (command === "export-ws-phones") {
      void submitWsPhoneExport();
      return;
    }
    const ids = selectedAccountIds();
    if (ids.length === 0) {
      ElMessage.warning("请先选择账号");
      return;
    }
    if (command === "takeover") {
      void submitBatchTakeover(ids);
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
      void submitSingleOffline(id);
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
    batchOnlineCooldownRemaining,
    batchSubmitting,
    batchMoveForm,
    batchMoveModeOptions,
    groupLoading,
    handleBatchAction,
    loginStateOptions,
    loading,
    marketingOccupancyDetail,
    marketingOccupancyDialogOpen,
    marketingOccupancyLoading,
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
    openMarketingOccupancy,
    rows,
    searchAccounts,
    searchForm,
    selectedCount,
    showAdvancedSearch,
    showBatchMoveDrawer,
    statCards,
    submitBatchMove,
    takeoverBatchDisabled,
    takeoverBatchTip,
    total,
    wsExporting
  };
}

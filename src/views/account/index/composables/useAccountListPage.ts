import {
  computed,
  onMounted,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { ElMessage } from "element-plus";
import {
  getTenantAccountSummary,
  listTenantAccounts,
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
  rowActionWarning: (action: string) => void;
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
    groupId: "",
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
  const showAdvancedSearch = ref(false);
  const showBatchMoveDrawer = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

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

  function buildQuery(): TenantAccountListQuery {
    const query: TenantAccountListQuery = {
      page: page.value,
      page_size: pageSize.value
    };
    if (searchForm.keyword.trim()) query.keyword = searchForm.keyword.trim();
    if (searchForm.phone.trim()) query.phone = searchForm.phone.trim();
    if (searchForm.riskStatus) {
      query.risk_status = Number(searchForm.riskStatus) as RiskStatus;
    }
    if (searchForm.accountStatus) {
      const accountStateMap: Record<string, AccountState | undefined> = {
        正常: 2,
        封禁: 3,
        导出: 4,
        解绑: 5
      };
      const accountState = accountStateMap[searchForm.accountStatus];
      if (accountState) query.account_state = accountState;
      if (searchForm.accountStatus === "禁言6小时") query.mute_status = "6h";
      if (searchForm.accountStatus === "禁言24小时") query.mute_status = "24h";
    }
    if (searchForm.ipGroupName) query.ip_group_name = searchForm.ipGroupName;
    if (searchForm.groupId) query.group_id = Number(searchForm.groupId);
    if (searchForm.country.trim()) query.country = searchForm.country.trim();
    if (searchForm.assignedService)
      query.assigned_service = searchForm.assignedService;
    return query;
  }

  async function loadSummary() {
    try {
      const response = await getTenantAccountSummary();
      summary.value = response.data ?? { ...ZERO_SUMMARY };
    } catch {
      summary.value = { ...ZERO_SUMMARY };
    }
  }

  async function loadAccountGroups() {
    groupLoading.value = true;
    try {
      const response = await listAccountGroups({ page: 1, page_size: 200 });
      accountGroups.value = response.data?.list ?? [];
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
      rows.value = response.data?.list ?? [];
      total.value = response.data?.total ?? 0;
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

  function rowActionWarning(action: string) {
    ElMessage.warning(`${action}接口待接入，未伪造成功结果`);
  }

  onMounted(() => {
    void loadAccountGroups();
    void refreshAccountList();
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
    rowActionWarning,
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

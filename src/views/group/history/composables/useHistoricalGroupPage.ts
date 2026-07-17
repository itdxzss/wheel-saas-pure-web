import { computed, ref, type ComputedRef, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { listTenantAccounts, type TenantAccount } from "@/api/account";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import {
  listHistoricalGroups,
  refreshHistoricalGroups as refreshHistoricalGroupsApi,
  type HistoricalGroupItem
} from "@/api/historical-group";
import { apiErrorMessage } from "@/utils/api-error";
import { accountStatusLabel, loginStateLabel } from "@/utils/account-state";

const ACCOUNT_PAGE_SIZE = 500;
const NORMAL_ACCOUNT_STATE = 2;
const ONLINE_LOGIN_STATE = 1;

/** 操作账号下拉框使用的完整号码选项。 */
export interface HistoricalGroupAccountOption {
  id: number;
  phone: string;
  label: string;
}

/** 历史群列表按当前关系与角色划分的展示区段。 */
export interface HistoricalGroupSection {
  key: "ADMIN" | "MEMBER" | "LEFT" | "UNVERIFIED";
  title: string;
  rows: HistoricalGroupItem[];
}

/** 历史群主页面的选择、列表和显式刷新状态。 */
export interface HistoricalGroupPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  accountGroupsLoading: Ref<boolean>;
  accounts: Ref<HistoricalGroupAccountOption[]>;
  accountsLoading: Ref<boolean>;
  activeGroup: Ref<HistoricalGroupItem | null>;
  baselineLoading: Ref<boolean>;
  closeGroup: () => void;
  loadAccountGroups: () => Promise<void>;
  openGroup: (row: HistoricalGroupItem) => void;
  refreshHistoricalGroups: () => Promise<void>;
  refreshing: Ref<boolean>;
  rows: Ref<HistoricalGroupItem[]>;
  sections: ComputedRef<HistoricalGroupSection[]>;
  selectAccountGroup: (groupId: number | null) => Promise<void>;
  selectOperationAccount: (accountId: number | null) => Promise<void>;
  selectedAccountGroupId: Ref<number | null>;
  selectedAccountId: Ref<number | null>;
}

function historicalGroupSections(
  rows: HistoricalGroupItem[]
): HistoricalGroupSection[] {
  const definitions: Array<{
    key: HistoricalGroupSection["key"];
    title: string;
    accepts: (row: HistoricalGroupItem) => boolean;
  }> = [
    {
      key: "ADMIN",
      title: "管理员群组",
      accepts: row =>
        row.membershipState === "CURRENT_IN_GROUP" &&
        row.roleCategory === "ADMIN"
    },
    {
      key: "MEMBER",
      title: "普通成员群组",
      accepts: row =>
        row.membershipState === "CURRENT_IN_GROUP" &&
        row.roleCategory === "MEMBER"
    },
    {
      key: "LEFT",
      title: "已退出",
      accepts: row => row.membershipState === "CURRENT_NOT_IN_GROUP"
    },
    {
      key: "UNVERIFIED",
      title: "未校验 / 获取失败",
      accepts: row =>
        row.membershipState === "UNVERIFIED" ||
        row.membershipState === "FETCH_FAILED" ||
        (row.membershipState === "CURRENT_IN_GROUP" && !row.roleCategory)
    }
  ];
  return definitions
    .map(definition => ({
      key: definition.key,
      title: definition.title,
      rows: rows.filter(definition.accepts)
    }))
    .filter(section => section.rows.length > 0);
}

async function listAccountGroupAccounts(
  accountGroupId: number
): Promise<TenantAccount[]> {
  const firstPage = await listTenantAccounts({
    accountGroupId,
    accountState: NORMAL_ACCOUNT_STATE,
    loginState: ONLINE_LOGIN_STATE,
    page: 1,
    pageSize: ACCOUNT_PAGE_SIZE
  });
  const totalPages =
    firstPage.totalPages ??
    Math.max(
      1,
      Math.ceil(
        (firstPage.total ?? firstPage.list?.length ?? 0) / ACCOUNT_PAGE_SIZE
      )
    );
  if (totalPages <= 1) return firstPage.list ?? [];

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listTenantAccounts({
        accountGroupId,
        accountState: NORMAL_ACCOUNT_STATE,
        loginState: ONLINE_LOGIN_STATE,
        page: index + 2,
        pageSize: ACCOUNT_PAGE_SIZE
      })
    )
  );
  return [firstPage, ...remainingPages].flatMap(result => result.list ?? []);
}

/**
 * 创建历史群主页面状态。
 *
 * <p>选择操作账号只读取 baseline；只有调用 {@code refreshHistoricalGroups} 才触发协议摘要刷新。</p>
 */
export function useHistoricalGroupPage(): HistoricalGroupPageState {
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const accountGroupsLoading = ref(false);
  const accounts = ref<HistoricalGroupAccountOption[]>([]);
  const accountsLoading = ref(false);
  const activeGroup = ref<HistoricalGroupItem | null>(null);
  const baselineLoading = ref(false);
  const refreshing = ref(false);
  const rows = ref<HistoricalGroupItem[]>([]);
  const selectedAccountGroupId = ref<number | null>(null);
  const selectedAccountId = ref<number | null>(null);
  const sections = computed(() => historicalGroupSections(rows.value));

  let accountRequestId = 0;
  let baselineRequestId = 0;
  let refreshRequestId = 0;

  function clearAccountContext(): void {
    refreshRequestId += 1;
    refreshing.value = false;
    accountsLoading.value = false;
    baselineLoading.value = false;
    selectedAccountId.value = null;
    accounts.value = [];
    rows.value = [];
    activeGroup.value = null;
    baselineRequestId += 1;
  }

  async function loadAccountGroups(): Promise<void> {
    accountGroupsLoading.value = true;
    try {
      const result = await listAccountGroups({ page: 1, pageSize: 500 });
      accountGroups.value = result.list ?? [];
    } catch (error) {
      accountGroups.value = [];
      ElMessage.error(apiErrorMessage(error, "加载账号分组失败"));
    } finally {
      accountGroupsLoading.value = false;
    }
  }

  async function selectAccountGroup(groupId: number | null): Promise<void> {
    const requestId = ++accountRequestId;
    selectedAccountGroupId.value = groupId;
    clearAccountContext();
    if (groupId == null) return;

    accountsLoading.value = true;
    try {
      const result = await listAccountGroupAccounts(groupId);
      if (requestId !== accountRequestId) return;
      accounts.value = result
        .filter(account => account.id != null)
        .map(account => {
          const id = account.id as number;
          const phone = account.ws_phone ?? String(id);
          const accountState = accountStatusLabel(account);
          const loginState = loginStateLabel(account.login_state);
          return {
            id,
            phone,
            label: `${phone}（ID ${id}｜${accountState}｜${loginState}）`
          };
        });
    } catch (error) {
      if (requestId !== accountRequestId) return;
      accounts.value = [];
      ElMessage.error(apiErrorMessage(error, "加载分组账号失败"));
    } finally {
      if (requestId === accountRequestId) accountsLoading.value = false;
    }
  }

  async function selectOperationAccount(
    accountId: number | null
  ): Promise<void> {
    const requestId = ++baselineRequestId;
    refreshRequestId += 1;
    refreshing.value = false;
    selectedAccountId.value = accountId;
    rows.value = [];
    activeGroup.value = null;
    baselineLoading.value = false;
    if (accountId == null) return;

    baselineLoading.value = true;
    try {
      const result = await listHistoricalGroups(accountId);
      if (requestId !== baselineRequestId) return;
      rows.value = result;
    } catch (error) {
      if (requestId !== baselineRequestId) return;
      rows.value = [];
      ElMessage.error(apiErrorMessage(error, "加载历史群 baseline 失败"));
    } finally {
      if (requestId === baselineRequestId) baselineLoading.value = false;
    }
  }

  async function refreshHistoricalGroups(): Promise<void> {
    const accountId = selectedAccountId.value;
    if (accountId == null || refreshing.value) return;

    const requestId = ++refreshRequestId;
    refreshing.value = true;
    activeGroup.value = null;
    try {
      const result = await refreshHistoricalGroupsApi(accountId);
      if (
        requestId !== refreshRequestId ||
        selectedAccountId.value !== accountId
      ) {
        return;
      }
      rows.value = result;
    } catch (error) {
      if (
        requestId !== refreshRequestId ||
        selectedAccountId.value !== accountId
      ) {
        return;
      }
      const message = apiErrorMessage(error, "加载群列表失败");
      // 刷新整体失败只说明当前状态不可判断，绝不能把 baseline 群误标为已退出。
      rows.value = rows.value.map(row => ({
        ...row,
        membershipState: "FETCH_FAILED",
        roleCategory: null,
        selfRole: null,
        speechState: "ABNORMAL",
        memberSize: null,
        announceOnly: null,
        errorMessage: message
      }));
      ElMessage.error(message);
    } finally {
      if (requestId === refreshRequestId) refreshing.value = false;
    }
  }

  function openGroup(row: HistoricalGroupItem): void {
    // 这里只记录用户点击目标；完整成员和邀请链接由后续详情抽屉按需加载。
    activeGroup.value = row;
  }

  function closeGroup(): void {
    activeGroup.value = null;
  }

  return {
    accountGroups,
    accountGroupsLoading,
    accounts,
    accountsLoading,
    activeGroup,
    baselineLoading,
    closeGroup,
    loadAccountGroups,
    openGroup,
    refreshHistoricalGroups,
    refreshing,
    rows,
    sections,
    selectAccountGroup,
    selectOperationAccount,
    selectedAccountGroupId,
    selectedAccountId
  };
}

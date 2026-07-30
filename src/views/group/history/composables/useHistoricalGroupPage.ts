import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
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

const DEFAULT_PAGE_SIZE = 20;

/** 历史群主页面的账号分组、分页列表和显式同步状态。 */
export interface HistoricalGroupPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  accountGroupsLoading: Ref<boolean>;
  activeGroup: Ref<HistoricalGroupItem | null>;
  baselineLoading: Ref<boolean>;
  changePage: (page: number) => Promise<void>;
  closeGroup: () => void;
  loadAccountGroups: () => Promise<void>;
  openGroup: (row: HistoricalGroupItem) => void;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshHistoricalGroups: () => Promise<void>;
  refreshing: Ref<boolean>;
  rows: Ref<HistoricalGroupItem[]>;
  selectAccountGroup: (groupId: number | null) => Promise<void>;
  selectedAccountGroupId: Ref<number | null>;
  total: Ref<number>;
}

/** 创建账号分组维度的历史群页面状态。 */
export function useHistoricalGroupPage(): HistoricalGroupPageState {
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const accountGroupsLoading = ref(false);
  const activeGroup = ref<HistoricalGroupItem | null>(null);
  const baselineLoading = ref(false);
  const page = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const refreshing = ref(false);
  const rows = ref<HistoricalGroupItem[]>([]);
  const selectedAccountGroupId = ref<number | null>(null);
  const total = ref(0);

  let listRequestId = 0;
  let refreshRequestId = 0;

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

  async function loadPage(targetPage: number): Promise<void> {
    const accountGroupId = selectedAccountGroupId.value;
    if (accountGroupId == null) return;

    const requestId = ++listRequestId;
    baselineLoading.value = true;
    try {
      const result = await listHistoricalGroups({
        accountGroupId,
        page: targetPage,
        pageSize: pageSize.value
      });
      if (
        requestId !== listRequestId ||
        selectedAccountGroupId.value !== accountGroupId
      ) {
        return;
      }
      rows.value = result.list ?? [];
      page.value = result.page ?? targetPage;
      total.value = result.total ?? 0;
      activeGroup.value = null;
    } catch (error) {
      if (
        requestId !== listRequestId ||
        selectedAccountGroupId.value !== accountGroupId
      ) {
        return;
      }
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "加载历史群失败"));
    } finally {
      if (requestId === listRequestId) baselineLoading.value = false;
    }
  }

  async function selectAccountGroup(groupId: number | null): Promise<void> {
    listRequestId += 1;
    refreshRequestId += 1;
    selectedAccountGroupId.value = groupId;
    page.value = 1;
    total.value = 0;
    rows.value = [];
    activeGroup.value = null;
    baselineLoading.value = false;
    refreshing.value = false;
    if (groupId != null) await loadPage(1);
  }

  async function changePage(targetPage: number): Promise<void> {
    if (targetPage === page.value || targetPage < 1) return;
    await loadPage(targetPage);
  }

  async function refreshHistoricalGroups(): Promise<void> {
    const accountGroupId = selectedAccountGroupId.value;
    if (accountGroupId == null || refreshing.value) return;

    const requestId = ++refreshRequestId;
    refreshing.value = true;
    activeGroup.value = null;
    try {
      await refreshHistoricalGroupsApi(accountGroupId);
      if (
        requestId !== refreshRequestId ||
        selectedAccountGroupId.value !== accountGroupId
      ) {
        return;
      }
      await loadPage(page.value);
      if (requestId === refreshRequestId) ElMessage.success("群列表已同步");
    } catch (error) {
      if (
        requestId !== refreshRequestId ||
        selectedAccountGroupId.value !== accountGroupId
      ) {
        return;
      }
      // WhatsApp 同步失败时保留已经展示的历史数据，避免把缓存误清空。
      ElMessage.error(apiErrorMessage(error, "加载群列表失败"));
    } finally {
      if (requestId === refreshRequestId) refreshing.value = false;
    }
  }

  function openGroup(row: HistoricalGroupItem): void {
    activeGroup.value = row;
  }

  function closeGroup(): void {
    activeGroup.value = null;
  }

  return {
    accountGroups,
    accountGroupsLoading,
    activeGroup,
    baselineLoading,
    changePage,
    closeGroup,
    loadAccountGroups,
    openGroup,
    page,
    pageSize,
    refreshHistoricalGroups,
    refreshing,
    rows,
    selectAccountGroup,
    selectedAccountGroupId,
    total
  };
}

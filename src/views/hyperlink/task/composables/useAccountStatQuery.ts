import { reactive, ref, watch, type ComputedRef, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createHyperlinkAccountStatsExport,
  listHyperlinkAccountStats,
  type HyperlinkAccountStatFilter,
  type HyperlinkAccountStatItem,
  type HyperlinkAccountStatQuery,
  type HyperlinkAccountStatSortField,
  type HyperlinkPageResult,
  type HyperlinkSortOrder,
  type HyperlinkTaskExportJob
} from "@/api/hyperlink-task-account-stats";
import { apiErrorMessage } from "@/utils/api-error";
import {
  DEFAULT_ACCOUNT_STAT_SORT,
  emptyAccountStatSearchForm,
  normalizedAccountStatSort,
  toAccountStatFilter,
  validateAccountStatSearch,
  type AccountStatSearchForm
} from "../domain/account-stats";
import {
  useHyperlinkExportJob,
  type HyperlinkExportJobState
} from "./useHyperlinkExportJob";

export interface AccountStatDependencies {
  list: (
    taskId: number,
    query: HyperlinkAccountStatQuery
  ) => Promise<HyperlinkPageResult<HyperlinkAccountStatItem>>;
  createExport: (
    taskId: number,
    filter: HyperlinkAccountStatFilter
  ) => Promise<HyperlinkTaskExportJob>;
}

export interface AccountStatQueryState {
  errorMessage: Ref<string>;
  exporting: ComputedRef<boolean>;
  loading: Ref<boolean>;
  page: Ref<number>;
  pageSize: Ref<number>;
  rows: Ref<HyperlinkAccountStatItem[]>;
  searchForm: AccountStatSearchForm;
  sortField: Ref<HyperlinkAccountStatSortField>;
  sortOrder: Ref<HyperlinkSortOrder>;
  total: Ref<number>;
  exportCurrent: () => Promise<void>;
  load: () => Promise<void>;
  onSortChange: (event: {
    prop?: string | null;
    order?: string | null;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  search: () => Promise<void>;
}

const defaultDependencies: AccountStatDependencies = {
  list: listHyperlinkAccountStats,
  createExport: createHyperlinkAccountStatsExport
};

export function useAccountStatQuery(
  taskId: Ref<number | null>,
  active: Ref<boolean>,
  refreshSummary: () => void,
  dependencies: AccountStatDependencies = defaultDependencies,
  exportJob: HyperlinkExportJobState = useHyperlinkExportJob()
): AccountStatQueryState {
  const searchForm = reactive<AccountStatSearchForm>(
    emptyAccountStatSearchForm()
  );
  const appliedFilter = ref<HyperlinkAccountStatFilter>({
    ...DEFAULT_ACCOUNT_STAT_SORT
  });
  const rows = ref<HyperlinkAccountStatItem[]>([]);
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const sortField = ref<HyperlinkAccountStatSortField>("successNum");
  const sortOrder = ref<HyperlinkSortOrder>("desc");
  const loading = ref(false);
  const errorMessage = ref("");
  let requestVersion = 0;

  function currentFilter(): HyperlinkAccountStatFilter {
    return toAccountStatFilter(searchForm, sortField.value, sortOrder.value);
  }

  async function load(): Promise<void> {
    const id = taskId.value;
    if (!active.value || id == null || id <= 0) return;
    const version = ++requestVersion;
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await dependencies.list(id, {
        ...appliedFilter.value,
        page: page.value,
        pageSize: pageSize.value
      });
      if (version !== requestVersion) return;
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      if (version !== requestVersion) return;
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(
        error,
        "发信账号统计加载失败，请稍后重试"
      );
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  async function search(): Promise<void> {
    const message = validateAccountStatSearch(searchForm);
    if (message) {
      ElMessage.warning(message);
      return;
    }
    page.value = 1;
    appliedFilter.value = currentFilter();
    await load();
  }

  async function reset(): Promise<void> {
    Object.assign(searchForm, emptyAccountStatSearchForm());
    sortField.value = DEFAULT_ACCOUNT_STAT_SORT.sortField;
    sortOrder.value = DEFAULT_ACCOUNT_STAT_SORT.sortOrder;
    page.value = 1;
    pageSize.value = 20;
    appliedFilter.value = { ...DEFAULT_ACCOUNT_STAT_SORT };
    await load();
  }

  async function refresh(): Promise<void> {
    await load();
    refreshSummary();
  }

  async function onSortChange(event: {
    prop?: string | null;
    order?: string | null;
  }): Promise<void> {
    const sort = normalizedAccountStatSort(event.prop, event.order);
    sortField.value = sort.sortField;
    sortOrder.value = sort.sortOrder;
    page.value = 1;
    appliedFilter.value = currentFilter();
    await load();
  }

  async function exportCurrent(): Promise<void> {
    const message = validateAccountStatSearch(searchForm);
    if (message) {
      ElMessage.warning(message);
      return;
    }
    const id = taskId.value;
    if (id == null || id <= 0) {
      ElMessage.warning("请先选择超链任务");
      return;
    }
    appliedFilter.value = currentFilter();
    await exportJob.run(() =>
      dependencies.createExport(id, appliedFilter.value)
    );
  }

  watch(
    [taskId, active],
    ([nextTaskId, isActive], previousValues) => {
      const previousTaskId = previousValues?.[0];
      if (nextTaskId !== previousTaskId) {
        rows.value = [];
        total.value = 0;
        page.value = 1;
      }
      if (isActive && nextTaskId != null && nextTaskId > 0) void load();
    },
    { immediate: true }
  );

  return {
    errorMessage,
    exporting: exportJob.exporting,
    loading,
    page,
    pageSize,
    rows,
    searchForm,
    sortField,
    sortOrder,
    total,
    exportCurrent,
    load,
    onSortChange,
    refresh,
    reset,
    search
  };
}

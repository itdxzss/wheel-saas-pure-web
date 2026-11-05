import { onScopeDispose, ref, type Ref } from "vue";
import {
  listTierChecks,
  type TierCheckMode,
  type TierCheckTask
} from "@/api/account-tier-check";
import { apiErrorMessage } from "@/utils/api-error";

export interface TierCheckListState {
  searchForm: Ref<{
    keyword: string;
    mode: TierCheckMode | undefined;
    status: number | undefined;
  }>;
  rows: Ref<TierCheckTask[]>;
  loading: Ref<boolean>;
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  refreshTasks: () => Promise<void>;
  searchTasks: () => void;
  resetSearchForm: () => void;
}

/** 批次分页/筛选只保留最后一次请求结果，旧请求不能覆盖新的搜索。 */
export function useTierCheckList(
  reportError: (message: string) => void
): TierCheckListState {
  const searchForm = ref({
    keyword: "",
    mode: undefined as TierCheckMode | undefined,
    status: undefined as number | undefined
  });
  const rows = ref<TierCheckTask[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  let generation = 0;
  async function refreshTasks(): Promise<void> {
    const current = ++generation;
    loading.value = true;
    try {
      const result = await listTierChecks({
        page: page.value,
        pageSize: pageSize.value,
        keyword: searchForm.value.keyword.trim() || undefined,
        mode: searchForm.value.mode,
        status: searchForm.value.status
      });
      if (current !== generation) return;
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      if (current !== generation) return;
      rows.value = [];
      total.value = 0;
      reportError(apiErrorMessage(error, "档位检测批次加载失败，请稍后重试"));
    } finally {
      if (current === generation) loading.value = false;
    }
  }
  function searchTasks(): void {
    page.value = 1;
    void refreshTasks();
  }
  function resetSearchForm(): void {
    searchForm.value = { keyword: "", mode: undefined, status: undefined };
    searchTasks();
  }
  onScopeDispose(() => {
    generation++;
  });
  return {
    searchForm,
    rows,
    loading,
    page,
    pageSize,
    total,
    refreshTasks,
    searchTasks,
    resetSearchForm
  };
}

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from "vue";
import { ElMessage } from "element-plus";
import {
  createHyperlinkStrategy,
  countHyperlinkStrategyAccounts,
  deleteHyperlinkStrategy,
  getHyperlinkStrategy,
  getHyperlinkStrategyAccountContext,
  listHyperlinkStrategies,
  updateHyperlinkStrategy,
  type HyperlinkStrategyAccountContext,
  type HyperlinkStrategyListItem
} from "@/api/hyperlink-strategy";
import type {
  HyperlinkFilterOptions,
  HyperlinkTaskMode
} from "@/api/hyperlink-task";
import { apiErrorMessage } from "@/utils/api-error";
import {
  createHyperlinkStrategyForm,
  strategyCreatePayload,
  strategyDetailToForm,
  strategyUpdatePayload,
  validateHyperlinkStrategyForm,
  type HyperlinkStrategyForm
} from "../domain/strategy-form";

const EMPTY_OPTIONS: HyperlinkFilterOptions = {
  groups: [],
  countries: [],
  channels: [],
  protocols: []
};

export function useHyperlinkStrategyPage() {
  const rows = ref<HyperlinkStrategyListItem[]>([]);
  const page = ref(1);
  const pageSize = ref<10 | 20 | 50 | 100>(20);
  const total = ref(0);
  const loading = ref(false);
  const errorMessage = ref("");
  const filters = reactive<{
    name: string;
    enabled?: boolean;
    taskMode?: HyperlinkTaskMode;
  }>({ name: "" });

  const dialogVisible = ref(false);
  const detailLoading = ref(false);
  const saving = ref(false);
  const editingId = ref<number | null>(null);
  const form = ref<HyperlinkStrategyForm>(createHyperlinkStrategyForm());
  const filterVisible = ref(false);
  const accountContext = ref<HyperlinkStrategyAccountContext | null>(null);
  const contextLoading = ref(false);
  const contextError = ref("");
  const match = ref<
    import("@/api/hyperlink-task").HyperlinkAccountMatchCount | null
  >(null);
  const matching = ref(false);
  const matchError = ref("");
  let matchTimer: ReturnType<typeof setTimeout> | undefined;
  let matchController: AbortController | undefined;
  let matchSequence = 0;

  const filterOptions = computed<HyperlinkFilterOptions>(() =>
    accountContext.value
      ? {
          groups: accountContext.value.groupOptions,
          countries: accountContext.value.countryOptions,
          channels: accountContext.value.channelOptions,
          protocols: accountContext.value.protocolOptions
        }
      : EMPTY_OPTIONS
  );
  const defaultGroupIds = computed(
    () => accountContext.value?.defaultAccountGroupIds ?? []
  );
  const optionErrors = computed<Record<string, string>>(() =>
    contextError.value ? { 创建上下文: contextError.value } : {}
  );

  function stopMatch(): void {
    if (matchTimer) clearTimeout(matchTimer);
    matchTimer = undefined;
    matchController?.abort();
    matchController = undefined;
  }

  function scheduleMatch(): void {
    if (!dialogVisible.value || detailLoading.value) return;
    stopMatch();
    const current = ++matchSequence;
    match.value = null;
    matchError.value = "";
    matching.value = true;
    matchTimer = setTimeout(() => void runMatch(current), 250);
  }

  async function runMatch(current = ++matchSequence): Promise<void> {
    if (!dialogVisible.value || current !== matchSequence) return;
    stopMatch();
    const controller = new AbortController();
    matchController = controller;
    matching.value = true;
    matchError.value = "";
    try {
      const result = await countHyperlinkStrategyAccounts(
        form.value.accountFilter,
        controller.signal
      );
      if (current === matchSequence) match.value = result;
    } catch (error) {
      if (controller.signal.aborted || current !== matchSequence) return;
      match.value = null;
      matchError.value = apiErrorMessage(error, "账号试算失败");
    } finally {
      if (current === matchSequence) matching.value = false;
    }
  }

  function retryMatch(): void {
    stopMatch();
    void runMatch(++matchSequence);
  }

  async function refresh(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await listHyperlinkStrategies({
        page: page.value,
        pageSize: pageSize.value,
        name: filters.name,
        enabled: filters.enabled,
        taskMode: filters.taskMode
      });
      rows.value = result.list;
      total.value = result.total;
      if (result.page !== page.value) page.value = result.page;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "超链策略加载失败");
    } finally {
      loading.value = false;
    }
  }

  function search(): void {
    page.value = 1;
    void refresh();
  }

  function reset(): void {
    filters.name = "";
    filters.enabled = undefined;
    filters.taskMode = undefined;
    search();
  }

  async function loadAccountContext(force = false): Promise<void> {
    if (!force && accountContext.value) return;
    contextLoading.value = true;
    contextError.value = "";
    try {
      accountContext.value = await getHyperlinkStrategyAccountContext();
    } catch (error) {
      accountContext.value = null;
      contextError.value = apiErrorMessage(error, "账号筛选候选加载失败");
    } finally {
      contextLoading.value = false;
    }
  }

  async function openCreate(): Promise<void> {
    editingId.value = null;
    await loadAccountContext();
    form.value = createHyperlinkStrategyForm(defaultGroupIds.value);
    dialogVisible.value = true;
  }

  async function openEdit(row: HyperlinkStrategyListItem): Promise<void> {
    editingId.value = row.id;
    dialogVisible.value = true;
    detailLoading.value = true;
    try {
      const [detail] = await Promise.all([
        getHyperlinkStrategy(row.id),
        loadAccountContext()
      ]);
      form.value = strategyDetailToForm(detail);
    } catch (error) {
      dialogVisible.value = false;
      ElMessage.error(apiErrorMessage(error, "策略详情加载失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  async function save(): Promise<void> {
    const validation = validateHyperlinkStrategyForm(form.value);
    if (validation) {
      ElMessage.warning(validation);
      return;
    }
    saving.value = true;
    try {
      if (editingId.value == null) {
        await createHyperlinkStrategy(strategyCreatePayload(form.value));
        ElMessage.success("新建成功");
      } else {
        await updateHyperlinkStrategy(
          editingId.value,
          strategyUpdatePayload(form.value)
        );
        ElMessage.success("保存成功");
      }
      dialogVisible.value = false;
      await refresh();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "策略保存失败"));
    } finally {
      saving.value = false;
    }
  }

  async function toggle(
    row: HyperlinkStrategyListItem,
    enabled: boolean
  ): Promise<void> {
    try {
      const detail = await getHyperlinkStrategy(row.id);
      await updateHyperlinkStrategy(row.id, {
        ...strategyCreatePayload(strategyDetailToForm(detail)),
        enabled,
        version: detail.version
      });
      ElMessage.success(enabled ? "策略已启用" : "策略已停用");
      await refresh();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "策略状态更新失败"));
      await refresh();
    }
  }

  async function remove(row: HyperlinkStrategyListItem): Promise<void> {
    try {
      await deleteHyperlinkStrategy(row.id);
      ElMessage.success("策略已删除");
      if (rows.value.length === 1 && page.value > 1) page.value -= 1;
      await refresh();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "策略删除失败"));
    }
  }

  onMounted(() => void refresh());
  watch(
    [dialogVisible, detailLoading, () => form.value.accountFilter],
    ([opened, loadingDetail]) => {
      if (!opened) {
        stopMatch();
        return;
      }
      if (!loadingDetail) scheduleMatch();
    },
    { deep: true }
  );
  onBeforeUnmount(stopMatch);

  return {
    rows,
    page,
    pageSize,
    total,
    loading,
    errorMessage,
    filters,
    dialogVisible,
    detailLoading,
    saving,
    editingId,
    form,
    filterVisible,
    filterOptions,
    defaultGroupIds,
    optionErrors,
    contextLoading,
    match,
    matching,
    matchError,
    refresh,
    search,
    reset,
    loadAccountContext,
    retryMatch,
    openCreate,
    openEdit,
    save,
    toggle,
    remove
  };
}

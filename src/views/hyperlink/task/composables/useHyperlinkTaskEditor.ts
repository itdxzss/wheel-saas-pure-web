import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { hasArmadaBusinessCode } from "@/api/armada";
import {
  countHyperlinkTaskAccounts,
  createHyperlinkTask,
  getHyperlinkTask,
  getHyperlinkTaskCreateContext,
  getHyperlinkTaskProvisionStatus,
  listHyperlinkStrategyOptions,
  quoteHyperlinkTask,
  updateHyperlinkTask,
  type HyperlinkAccountMatchCount,
  type HyperlinkEditorMode,
  type HyperlinkFilterOptions,
  type HyperlinkStrategyOption,
  type HyperlinkTaskCreateContext,
  type HyperlinkTaskDetail,
  type HyperlinkTaskMutationReceipt,
  type HyperlinkTaskQuote
} from "@/api/hyperlink-task";
import {
  getHyperlinkTemplate,
  listHyperlinkTemplates,
  type HyperlinkTemplateOption
} from "@/api/hyperlink-template";
import {
  listDataPackages,
  type DataPackageListItem
} from "@/api/hyperlink-data-package";
import { apiErrorMessage } from "@/utils/api-error";
import {
  createEmptyHyperlinkTaskForm,
  detailToHyperlinkTaskForm,
  importHyperlinkStrategy,
  importHyperlinkTemplate,
  createEmptyAccountFilter,
  normalizeAccountFilter,
  shouldUseFinalReview,
  suggestTaskNameFromDataPackage,
  toHyperlinkTaskSaveRequest,
  validateAccountFilter,
  validateHyperlinkTaskForm,
  type HyperlinkTaskForm
} from "../domain/editor-rules";

export interface HyperlinkTaskEditorEmits {
  submitted: [receipt: HyperlinkTaskMutationReceipt];
}

const EMPTY_FILTER_OPTIONS: HyperlinkFilterOptions = {
  groups: [],
  countries: [],
  channels: [],
  protocols: []
};

export function useHyperlinkTaskEditor(
  emit: (event: "submitted", receipt: HyperlinkTaskMutationReceipt) => void
) {
  const visible = ref(false);
  const mode = ref<HyperlinkEditorMode>("create");
  const taskId = ref<number | null>(null);
  const form = ref<HyperlinkTaskForm>(createEmptyHyperlinkTaskForm());
  const detail = ref<HyperlinkTaskDetail | null>(null);
  const detailLoading = ref(false);
  const resourceLoading = ref(false);
  const saving = ref(false);
  const provisioning = ref(false);
  const provisionFailed = ref(false);
  const provisionError = ref("");
  const provisionTaskId = ref<number | null>(null);
  const createContext = ref<HyperlinkTaskCreateContext | null>(null);
  const dataPackages = ref<DataPackageListItem[]>([]);
  const dataPackageLoading = ref(false);
  const dataPackagePage = ref(1);
  const dataPackageTotalPages = ref(1);
  const dataPackageKeyword = ref("");
  const templateOptions = ref<HyperlinkTemplateOption[]>([]);
  const templateLoading = ref(false);
  const templatePage = ref(1);
  const templateTotalPages = ref(1);
  const templateKeyword = ref("");
  const strategyOptions = ref<HyperlinkStrategyOption[]>([]);
  const filterOptions = ref<HyperlinkFilterOptions>(EMPTY_FILTER_OPTIONS);
  const resourceErrors = ref<Record<string, string>>({});
  const match = ref<HyperlinkAccountMatchCount | null>(null);
  const matching = ref(false);
  const matchError = ref("");
  const quote = ref<HyperlinkTaskQuote | null>(null);
  const finalReviewVisible = ref(false);
  const importingTemplate = ref(false);
  const conflictError = ref("");
  let matchTimer: ReturnType<typeof setTimeout> | undefined;
  let matchController: AbortController | undefined;
  let matchSequence = 0;
  let provisionTimer: ReturnType<typeof setTimeout> | undefined;
  let filterTouched = false;
  let dataPackageRequestVersion = 0;
  let templateRequestVersion = 0;
  let suggestedTaskName = "";

  const readonly = computed(() => mode.value === "view");
  const drawerTitle = computed(() => {
    const labels: Record<HyperlinkEditorMode, string> = {
      create: "新建超链群发任务",
      edit: "编辑超链群发任务",
      view: "查看超链群发任务",
      copy: "复制超链群发任务"
    };
    return labels[mode.value];
  });
  const dataPackageAvailable = computed(() => {
    if (form.value.dataPackageId == null) return true;
    if (dataPackages.value.some(item => item.id === form.value.dataPackageId)) {
      return true;
    }
    return detail.value?.dataPackageId === form.value.dataPackageId
      ? detail.value.dataPackageAvailable
      : false;
  });
  const selectedDataPackage = computed(() =>
    dataPackages.value.find(item => item.id === form.value.dataPackageId)
  );
  const dataPackageHasMore = computed(
    () => dataPackagePage.value < dataPackageTotalPages.value
  );
  const templateHasMore = computed(
    () => templatePage.value < templateTotalPages.value
  );
  const accountMatchUnready = computed(
    () =>
      form.value.enabled &&
      (matching.value || Boolean(matchError.value) || match.value == null)
  );
  const defaultGroupDependencyError = computed(() =>
    createContext.value && createContext.value.defaultAccountGroupIds.length < 2
      ? "系统默认业务组 public + hyperlink 尚未就绪，当前只能仅保存，不能启用任务"
      : ""
  );

  function clearTimers(): void {
    if (matchTimer) clearTimeout(matchTimer);
    matchTimer = undefined;
    matchController?.abort();
    matchController = undefined;
    if (provisionTimer) clearTimeout(provisionTimer);
    provisionTimer = undefined;
  }

  function resetEditor(nextMode: HyperlinkEditorMode): void {
    clearTimers();
    mode.value = nextMode;
    taskId.value = null;
    form.value = createEmptyHyperlinkTaskForm();
    detail.value = null;
    createContext.value = null;
    dataPackages.value = [];
    dataPackageLoading.value = false;
    dataPackagePage.value = 1;
    dataPackageTotalPages.value = 1;
    dataPackageKeyword.value = "";
    templateOptions.value = [];
    templateLoading.value = false;
    templatePage.value = 1;
    templateTotalPages.value = 1;
    templateKeyword.value = "";
    strategyOptions.value = [];
    filterOptions.value = {
      groups: [],
      countries: [],
      channels: [],
      protocols: []
    };
    match.value = null;
    matching.value = false;
    matchError.value = "";
    quote.value = null;
    provisioning.value = false;
    provisionFailed.value = false;
    provisionError.value = "";
    provisionTaskId.value = null;
    finalReviewVisible.value = false;
    conflictError.value = "";
    resourceErrors.value = {};
    filterTouched = false;
    dataPackageRequestVersion += 1;
    templateRequestVersion += 1;
    suggestedTaskName = "";
  }

  function clearResourceError(key: string): void {
    const errors = { ...resourceErrors.value };
    delete errors[key];
    resourceErrors.value = errors;
  }

  function setResourceError(key: string, error: unknown): void {
    resourceErrors.value = {
      ...resourceErrors.value,
      [key]: apiErrorMessage(error, `${key}加载失败`)
    };
  }

  async function loadResource<T>(
    key: string,
    loader: () => Promise<T>,
    assign: (value: T) => void
  ): Promise<void> {
    try {
      assign(await loader());
      clearResourceError(key);
    } catch (error) {
      setResourceError(key, error);
    }
  }

  function loadCreateContext(): Promise<void> {
    return loadResource("创建上下文", getHyperlinkTaskCreateContext, value => {
      createContext.value = value;
      filterOptions.value = {
        groups: value.groupOptions,
        countries: value.countryOptions,
        channels: value.channelOptions,
        protocols: value.protocolOptions
      };
      if (
        mode.value === "create" &&
        !filterTouched &&
        form.value.accountFilter.groupIds.length === 0
      ) {
        form.value.accountFilter = createEmptyAccountFilter(
          value.defaultAccountGroupIds
        );
      }
      if (
        (mode.value === "create" || mode.value === "copy") &&
        value.defaultAccountGroupIds.length < 2
      ) {
        form.value.enabled = false;
      }
    });
  }

  async function loadDataPackageOptions(
    page = 1,
    append = false
  ): Promise<void> {
    const requestVersion = ++dataPackageRequestVersion;
    dataPackageLoading.value = true;
    try {
      const value = await listDataPackages({
        page,
        pageSize: 30,
        name: dataPackageKeyword.value,
        forTask: true
      });
      if (requestVersion !== dataPackageRequestVersion) return;
      const selected = dataPackages.value.find(
        item => item.id === form.value.dataPackageId
      );
      const base = append ? dataPackages.value : selected ? [selected] : [];
      dataPackages.value = [
        ...base,
        ...value.list.filter(
          item => !base.some(existing => existing.id === item.id)
        )
      ];
      dataPackagePage.value = value.page;
      dataPackageTotalPages.value = value.totalPages;
      clearResourceError("数据包");
    } catch (error) {
      if (requestVersion === dataPackageRequestVersion) {
        setResourceError("数据包", error);
      }
    } finally {
      if (requestVersion === dataPackageRequestVersion) {
        dataPackageLoading.value = false;
      }
    }
  }

  async function loadTemplateOptions(page = 1, append = false): Promise<void> {
    const requestVersion = ++templateRequestVersion;
    templateLoading.value = true;
    try {
      const value = await listHyperlinkTemplates({
        page,
        pageSize: 30,
        name: templateKeyword.value || undefined
      });
      if (requestVersion !== templateRequestVersion) return;
      const rows = value.list.map(item => ({
        id: item.id,
        name: item.name,
        messageType: item.messageType,
        title: item.title,
        version: item.version
      }));
      templateOptions.value = append
        ? [
            ...templateOptions.value,
            ...rows.filter(
              item =>
                !templateOptions.value.some(existing => existing.id === item.id)
            )
          ]
        : rows;
      templatePage.value = value.page;
      templateTotalPages.value = value.totalPages;
      clearResourceError("模板");
    } catch (error) {
      if (requestVersion === templateRequestVersion) {
        setResourceError("模板", error);
      }
    } finally {
      if (requestVersion === templateRequestVersion) {
        templateLoading.value = false;
      }
    }
  }

  async function searchDataPackages(keyword: string): Promise<void> {
    dataPackageKeyword.value = keyword.trim();
    await loadDataPackageOptions(1, false);
  }

  const loadMoreDataPackages = () =>
    dataPackageHasMore.value
      ? loadDataPackageOptions(dataPackagePage.value + 1, true)
      : Promise.resolve();

  async function searchTemplates(keyword: string): Promise<void> {
    templateKeyword.value = keyword.trim();
    await loadTemplateOptions(1, false);
  }

  const loadMoreTemplates = () =>
    templateHasMore.value
      ? loadTemplateOptions(templatePage.value + 1, true)
      : Promise.resolve();

  function loadStrategyOptions(): Promise<void> {
    return loadResource(
      "策略",
      () => listHyperlinkStrategyOptions(),
      value => {
        strategyOptions.value = value;
      }
    );
  }

  async function withResourceLoading(
    loader: () => Promise<void>
  ): Promise<void> {
    resourceLoading.value = true;
    try {
      await loader();
    } finally {
      resourceLoading.value = false;
    }
  }

  async function loadResources(): Promise<void> {
    await withResourceLoading(async () => {
      const loaders = [loadCreateContext()];
      if (mode.value === "create" || mode.value === "copy") {
        loaders.push(
          loadDataPackageOptions(),
          loadTemplateOptions(),
          loadStrategyOptions()
        );
      } else if (mode.value === "edit") {
        loaders.push(loadDataPackageOptions());
      }
      await Promise.all(loaders);
    });
  }

  const retryCreateContext = () => withResourceLoading(loadCreateContext);
  const retryDataPackages = () => loadDataPackageOptions(1, false);
  const retryTemplates = () => loadTemplateOptions(1, false);
  const retryStrategies = () => withResourceLoading(loadStrategyOptions);

  function applyDetail(
    value: HyperlinkTaskDetail,
    nextMode: HyperlinkEditorMode
  ): void {
    detail.value = value;
    taskId.value = value.id;
    form.value = detailToHyperlinkTaskForm(value, nextMode);
    conflictError.value = "";
    suggestedTaskName = "";
    if (nextMode === "edit" && !value.editable) mode.value = "view";
  }

  async function openCreate(): Promise<void> {
    resetEditor("create");
    visible.value = true;
    await loadResources();
    scheduleMatch();
  }

  async function openExisting(
    id: number,
    nextMode: Exclude<HyperlinkEditorMode, "create">
  ): Promise<void> {
    resetEditor(nextMode);
    detailLoading.value = true;
    try {
      const value = await getHyperlinkTask(id);
      applyDetail(value, nextMode);
      visible.value = true;
      await loadResources();
      scheduleMatch();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "超链任务详情加载失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  function invalidateMatch(): number {
    if (matchTimer) clearTimeout(matchTimer);
    matchTimer = undefined;
    matchController?.abort();
    matchController = undefined;
    matchSequence += 1;
    match.value = null;
    matchError.value = "";
    matching.value = true;
    return matchSequence;
  }

  function scheduleMatch(): void {
    if (!visible.value || readonly.value) return;
    const sequence = invalidateMatch();
    matchTimer = setTimeout(() => void runMatch(sequence), 250);
  }

  async function runMatch(sequence: number): Promise<void> {
    if (readonly.value || sequence !== matchSequence) return;
    const controller = new AbortController();
    matchController = controller;
    try {
      const normalized = normalizeAccountFilter(form.value.accountFilter);
      const filterError = validateAccountFilter(normalized);
      if (filterError) {
        matchError.value = filterError;
        return;
      }
      const result = await countHyperlinkTaskAccounts(
        normalized,
        controller.signal
      );
      if (sequence !== matchSequence) return;
      match.value = result;
    } catch (error) {
      if (controller.signal.aborted || sequence !== matchSequence) return;
      match.value = null;
      matchError.value = apiErrorMessage(error, "账号试算失败");
    } finally {
      if (sequence === matchSequence) matching.value = false;
    }
  }

  async function refreshMatch(): Promise<void> {
    if (readonly.value) return;
    const sequence = invalidateMatch();
    await runMatch(sequence);
  }

  function setAccountFilter(value: HyperlinkTaskForm["accountFilter"]): void {
    filterTouched = true;
    form.value.accountFilter = normalizeAccountFilter(value);
    scheduleMatch();
  }

  function resetAccountFilter(): void {
    filterTouched = true;
    form.value.accountFilter = createEmptyAccountFilter(
      createContext.value?.defaultAccountGroupIds ?? []
    );
    scheduleMatch();
  }

  function selectDataPackage(id: number | null): void {
    form.value.dataPackageId = id;
    const selected = dataPackages.value.find(item => item.id === id);
    if (!selected) return;
    const suggestion = suggestTaskNameFromDataPackage(
      form.value.taskName,
      suggestedTaskName,
      selected.name
    );
    form.value.taskName = suggestion.taskName;
    suggestedTaskName = suggestion.suggestion;
  }

  async function useTemplate(id: number | null): Promise<void> {
    if (id == null) return;
    importingTemplate.value = true;
    try {
      const template = await getHyperlinkTemplate(id);
      form.value = importHyperlinkTemplate(form.value, template);
      ElMessage.success(`已带入模板“${template.name}”`);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "模板加载失败"));
    } finally {
      importingTemplate.value = false;
    }
  }

  function useStrategy(id: number | null): void {
    if (id == null) {
      form.value.sourceStrategyId = null;
      return;
    }
    const strategy = strategyOptions.value.find(item => item.id === id);
    if (!strategy) return;
    form.value = importHyperlinkStrategy(form.value, strategy);
    scheduleMatch();
    ElMessage.success(`已带入策略“${strategy.name}”`);
  }

  function switchTaskMode(): void {
    if (form.value.taskMode === "rolling" && form.value.plannedEndAt == null) {
      const end = new Date();
      end.setHours(23, 59, 0, 0);
      form.value.plannedEndAt = end.getTime();
    }
    if (form.value.taskMode === "cycle") {
      if (form.value.cycleIntervalMinutes < 1)
        form.value.cycleIntervalMinutes = 60;
      if (form.value.maxUseAccounts < 1) form.value.maxUseAccounts = 5;
      if (form.value.maxExecutingAccounts > form.value.maxUseAccounts) {
        form.value.maxExecutingAccounts = form.value.maxUseAccounts;
      }
    }
  }

  function validationMessage(): string {
    return validateHyperlinkTaskForm(form.value, {
      mode: mode.value,
      createContext: createContext.value,
      matchedAccountCount: match.value?.availableAccountCount ?? null,
      matchedMaxConcurrentNum: match.value?.maxConcurrentNum ?? null,
      matching: matching.value,
      matchError: matchError.value,
      dataPackageAvailable: dataPackageAvailable.value
    });
  }

  async function requestQuote(): Promise<void> {
    if (form.value.dataPackageId == null) return;
    quote.value = await quoteHyperlinkTask({
      purpose: "CREATE",
      taskId: null,
      dataPackageId: form.value.dataPackageId,
      taskMode: form.value.taskMode,
      maxExecutingAccounts: form.value.maxExecutingAccounts,
      maxUseAccounts: form.value.maxUseAccounts
    });
  }

  async function submit(): Promise<void> {
    const error = validationMessage();
    if (error) {
      ElMessage.warning(error);
      return;
    }
    if (shouldUseFinalReview(mode.value)) {
      try {
        quote.value = null;
        if (form.value.enabled) await requestQuote();
        finalReviewVisible.value = true;
      } catch (quoteError) {
        ElMessage.error(apiErrorMessage(quoteError, "报价失败"));
      }
      return;
    }
    await persist(null);
  }

  async function confirmFinalReview(): Promise<void> {
    await refreshMatch();
    const validationError = validationMessage();
    if (validationError) {
      ElMessage.warning(validationError);
      return;
    }
    if (!form.value.enabled) {
      await persist(null);
      return;
    }
    if (!quote.value) return;
    if (quote.value.expiresAt <= Date.now()) {
      try {
        await requestQuote();
        ElMessage.warning("报价已更新，请重新核对并等待倒计时");
      } catch (error) {
        ElMessage.error(apiErrorMessage(error, "报价刷新失败"));
      }
      return;
    }
    await persist(quote.value.quoteToken);
  }

  async function persist(quoteToken: string | null): Promise<void> {
    if (saving.value || mode.value === "view") return;
    saving.value = true;
    conflictError.value = "";
    try {
      const request = toHyperlinkTaskSaveRequest(form.value, quoteToken);
      const receipt =
        mode.value === "edit"
          ? await updateHyperlinkTask(taskId.value as number, {
              ...request,
              sourceTaskId: null
            })
          : await createHyperlinkTask(request);
      finalReviewVisible.value = false;
      await handleReceipt(receipt);
    } catch (error) {
      if (hasArmadaBusinessCode(error, 40910)) {
        finalReviewVisible.value = false;
        conflictError.value =
          "任务已被其他操作修改。当前表单已保留，请重新加载服务器版本后再编辑。";
        return;
      }
      ElMessage.error(apiErrorMessage(error, "超链任务保存失败"));
    } finally {
      saving.value = false;
    }
  }

  async function reloadAfterConflict(): Promise<void> {
    if (taskId.value == null) return;
    detailLoading.value = true;
    try {
      const value = await getHyperlinkTask(taskId.value);
      applyDetail(value, "edit");
      scheduleMatch();
      ElMessage.success("已重新加载服务器最新版本");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "重新加载任务失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  async function handleReceipt(
    receipt: HyperlinkTaskMutationReceipt
  ): Promise<void> {
    if (receipt.provisionStatus === "PROCESSING") {
      const firstProcessingReceipt = !provisioning.value;
      provisioning.value = true;
      provisionFailed.value = false;
      provisionError.value = "";
      provisionTaskId.value = receipt.taskId;
      taskId.value = receipt.taskId;
      form.value.version = receipt.version;
      if (firstProcessingReceipt) {
        ElMessage.info("任务正在准备，完成后进入列表");
      }
      scheduleProvisionPoll(receipt);
      return;
    }
    if (receipt.provisionStatus === "FAILED") {
      provisioning.value = false;
      provisionFailed.value = true;
      provisionTaskId.value = receipt.taskId;
      taskId.value = receipt.taskId;
      mode.value = "edit";
      form.value.version = receipt.version;
      form.value.sourceTaskId = null;
      provisionError.value = receipt.failureReason || "任务准备失败";
      ElMessage.error(provisionError.value);
      return;
    }
    provisioning.value = false;
    provisionFailed.value = false;
    provisionError.value = "";
    provisionTaskId.value = null;
    visible.value = false;
    ElMessage.success(mode.value === "edit" ? "修改成功" : "创建成功");
    emit("submitted", receipt);
  }

  function scheduleProvisionPoll(receipt: HyperlinkTaskMutationReceipt): void {
    if (provisionTimer) clearTimeout(provisionTimer);
    provisionTimer = setTimeout(
      async () => {
        try {
          await handleReceipt(
            await getHyperlinkTaskProvisionStatus(receipt.taskId)
          );
        } catch (error) {
          provisionError.value = apiErrorMessage(error, "任务准备状态查询失败");
          ElMessage.error(provisionError.value);
        }
      },
      Math.max(500, receipt.pollAfterMs ?? 1000)
    );
  }

  async function retryProvisionStatus(): Promise<void> {
    if (provisionTaskId.value == null) return;
    provisionError.value = "";
    try {
      await handleReceipt(
        await getHyperlinkTaskProvisionStatus(provisionTaskId.value)
      );
    } catch (error) {
      provisionError.value = apiErrorMessage(error, "任务准备状态查询失败");
      ElMessage.error(provisionError.value);
    }
  }

  async function retryProvisionSubmission(): Promise<void> {
    if (!provisionFailed.value || taskId.value == null) return;
    provisionError.value = "";
    await refreshMatch();
    const error = validationMessage();
    if (error) {
      provisionError.value = error;
      ElMessage.warning(error);
      return;
    }
    await persist(null);
  }

  function forceClose(): void {
    clearTimers();
    finalReviewVisible.value = false;
    provisioning.value = false;
    provisionFailed.value = false;
    provisionError.value = "";
    provisionTaskId.value = null;
    visible.value = false;
  }

  watch(
    () => form.value.accountFilter,
    () => scheduleMatch(),
    { deep: true }
  );
  onBeforeUnmount(clearTimers);

  return {
    visible,
    mode,
    taskId,
    form,
    detail,
    detailLoading,
    resourceLoading,
    saving,
    provisioning,
    provisionFailed,
    provisionError,
    conflictError,
    createContext,
    dataPackages,
    dataPackageLoading,
    dataPackageHasMore,
    templateOptions,
    templateLoading,
    templateHasMore,
    strategyOptions,
    filterOptions,
    resourceErrors,
    match,
    matching,
    matchError,
    quote,
    finalReviewVisible,
    importingTemplate,
    readonly,
    drawerTitle,
    selectedDataPackage,
    accountMatchUnready,
    defaultGroupDependencyError,
    openCreate,
    openEdit: (id: number) => openExisting(id, "edit"),
    openView: (id: number) => openExisting(id, "view"),
    openCopy: (id: number) => openExisting(id, "copy"),
    loadResources,
    retryCreateContext,
    retryDataPackages,
    retryTemplates,
    retryStrategies,
    searchDataPackages,
    loadMoreDataPackages,
    searchTemplates,
    loadMoreTemplates,
    refreshMatch,
    setAccountFilter,
    resetAccountFilter,
    selectDataPackage,
    useTemplate,
    useStrategy,
    switchTaskMode,
    submit,
    requestQuote,
    confirmFinalReview,
    retryProvisionStatus,
    retryProvisionSubmission,
    reloadAfterConflict,
    forceClose
  };
}

import { computed, ref, type ComputedRef, type Ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createHistoricalGroupPullExecution,
  getHistoricalGroupPullExecution,
  getLatestHistoricalGroupPullExecution,
  sendHistoricalGroupMarketing,
  startHistoricalGroupPullExecution,
  type HistoricalGroupDetail,
  type HistoricalGroupPullExecution
} from "@/api/historical-group";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import {
  listMarketingTemplates,
  type MarketingTemplateRow
} from "@/api/marketing-template";
import { apiErrorMessage } from "@/utils/api-error";

export interface HistoricalGroupExecutionScheduler {
  schedule: (
    callback: () => void | Promise<void>,
    delayMs: number
  ) => () => void;
}

export interface HistoricalGroupExecutionOptions {
  createIdempotencyKey?: () => string;
  detail: () => HistoricalGroupDetail | null;
  scheduler?: HistoricalGroupExecutionScheduler;
  sourceAccountGroupId: () => number | null;
}

export interface HistoricalGroupExecutionState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  close: () => void;
  execution: Ref<HistoricalGroupPullExecution | null>;
  executionError: Ref<string>;
  gateReason: ComputedRef<string>;
  linkGateOpen: ComputedRef<boolean>;
  marketingDisabled: ComputedRef<boolean>;
  marketingReady: ComputedRef<boolean>;
  marketingSending: Ref<boolean>;
  marketingTemplateId: Ref<number | null>;
  marketingTemplates: Ref<MarketingTemplateRow[]>;
  materialFile: Ref<File | null>;
  open: () => Promise<void>;
  optionsLoading: Ref<boolean>;
  polling: Ref<boolean>;
  pullDisabled: ComputedRef<boolean>;
  pullPhaseComplete: ComputedRef<boolean>;
  pullerAccountGroupId: Ref<number | null>;
  sendMarketing: () => Promise<void>;
  singleAddCount: Ref<number>;
  startPull: () => Promise<void>;
  submitting: Ref<boolean>;
  validatePull: () => string;
}

const POLL_DELAY_MS = 2000;
const supportedMaterialPattern = /\.(txt|csv|xls|xlsx)$/i;
const terminalPullStatuses = new Set<
  HistoricalGroupPullExecution["pullStatus"]
>(["SUCCESS", "PARTIAL_SUCCESS", "FAILED"]);

const browserScheduler: HistoricalGroupExecutionScheduler = {
  schedule(callback, delayMs) {
    const timer = setTimeout(() => {
      void callback();
    }, delayMs);
    return () => clearTimeout(timer);
  }
};

function defaultIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `historical-group-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isAdministrator(detail: HistoricalGroupDetail | null): boolean {
  return detail?.selfRole === "OWNER" || detail?.selfRole === "ADMIN";
}

function hasUsableLink(detail: HistoricalGroupDetail | null): boolean {
  return (
    isAdministrator(detail) &&
    detail?.linkAvailable === true &&
    Boolean(detail.inviteUrl?.trim())
  );
}

function completeGateReason(detail: HistoricalGroupDetail | null): string {
  if (!detail) return "详情尚未加载，拉人和营销均已禁用";
  if (!isAdministrator(detail)) {
    return "当前账号不是管理员，仅支持查看群详情";
  }
  const reasons = [detail.errorCode, detail.errorMessage].filter(
    (value): value is string => Boolean(value?.trim())
  );
  return reasons.length > 0
    ? reasons.join(" / ")
    : "未取得可用群邀请链接，拉人和营销均已禁用";
}

function executionNeedsPolling(
  execution: HistoricalGroupPullExecution
): boolean {
  return (
    !terminalPullStatuses.has(execution.pullStatus) ||
    execution.marketingStatus === "SENDING"
  );
}

/** 管理单个历史群的拉人、轮询及全部营销账号发送流程。 */
export function useHistoricalGroupExecution(
  options: HistoricalGroupExecutionOptions
): HistoricalGroupExecutionState {
  const scheduler = options.scheduler ?? browserScheduler;
  const createIdempotencyKey =
    options.createIdempotencyKey ?? defaultIdempotencyKey;
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const execution = ref<HistoricalGroupPullExecution | null>(null);
  const executionError = ref("");
  const marketingSending = ref(false);
  const marketingTemplateId = ref<number | null>(null);
  const marketingTemplates = ref<MarketingTemplateRow[]>([]);
  const materialFile = ref<File | null>(null);
  const optionsLoading = ref(false);
  const polling = ref(false);
  const pullerAccountGroupId = ref<number | null>(null);
  const singleAddCount = ref(25);
  const submitting = ref(false);
  let cancelPoll: (() => void) | null = null;
  let sessionId = 0;

  const linkGateOpen = computed(() => hasUsableLink(options.detail()));
  const gateReason = computed(() =>
    linkGateOpen.value ? "" : completeGateReason(options.detail())
  );
  const pullPhaseComplete = computed(() =>
    execution.value
      ? terminalPullStatuses.has(execution.value.pullStatus)
      : false
  );
  const marketingReady = computed(
    () =>
      linkGateOpen.value &&
      pullPhaseComplete.value &&
      (execution.value?.marketingCount ?? 0) > 0
  );

  function validatePull(): string {
    if (!hasUsableLink(options.detail())) {
      return completeGateReason(options.detail());
    }
    if (pullerAccountGroupId.value == null) return "请选择拉手账号分组";
    if (!materialFile.value) return "请选择 TXT、CSV、XLS、XLSX 材料文件";
    if (!supportedMaterialPattern.test(materialFile.value.name)) {
      return "材料文件仅支持 TXT、CSV、XLS、XLSX";
    }
    if (!Number.isInteger(singleAddCount.value) || singleAddCount.value <= 0) {
      return "单次添加人数必须是正整数";
    }
    return "";
  }

  const pullDisabled = computed(
    () => submitting.value || Boolean(validatePull())
  );
  const marketingDisabled = computed(
    () =>
      marketingSending.value ||
      !marketingReady.value ||
      execution.value?.marketingStatus !== "NOT_STARTED" ||
      marketingTemplateId.value == null
  );

  function clearPoll(): void {
    if (!cancelPoll) return;
    cancelPoll();
    cancelPoll = null;
  }

  function resetState(): void {
    accountGroups.value = [];
    execution.value = null;
    executionError.value = "";
    marketingSending.value = false;
    marketingTemplateId.value = null;
    marketingTemplates.value = [];
    materialFile.value = null;
    optionsLoading.value = false;
    polling.value = false;
    pullerAccountGroupId.value = null;
    singleAddCount.value = 25;
    submitting.value = false;
  }

  function schedulePoll(
    currentExecution: HistoricalGroupPullExecution,
    activeSessionId: number
  ): void {
    clearPoll();
    if (
      activeSessionId !== sessionId ||
      !executionNeedsPolling(currentExecution)
    ) {
      return;
    }
    cancelPoll = scheduler.schedule(async () => {
      cancelPoll = null;
      await pollExecution(currentExecution.id, activeSessionId);
    }, POLL_DELAY_MS);
  }

  async function pollExecution(
    executionId: number,
    activeSessionId: number
  ): Promise<void> {
    if (activeSessionId !== sessionId) return;
    polling.value = true;
    try {
      const result = await getHistoricalGroupPullExecution(executionId);
      if (activeSessionId !== sessionId) return;
      execution.value = result;
      executionError.value = "";
      schedulePoll(result, activeSessionId);
    } catch (error) {
      if (activeSessionId !== sessionId) return;
      executionError.value = apiErrorMessage(error, "轮询拉人执行失败");
      ElMessage.error(executionError.value);
      clearPoll();
    } finally {
      if (activeSessionId === sessionId) polling.value = false;
    }
  }

  async function open(): Promise<void> {
    const activeSessionId = ++sessionId;
    clearPoll();
    resetState();
    const currentDetail = options.detail();
    const sourceAccountGroupId = options.sourceAccountGroupId();
    if (!hasUsableLink(currentDetail)) {
      executionError.value = completeGateReason(currentDetail);
      return;
    }
    if (sourceAccountGroupId == null) {
      executionError.value = "缺少来源账号分组，拉人和营销均已禁用";
      return;
    }

    optionsLoading.value = true;
    try {
      const [groupResult, templateResult, latestExecution] = await Promise.all([
        listAccountGroups({ page: 1, pageSize: 500 }),
        listMarketingTemplates({ page: 1, pageSize: 500 }),
        getLatestHistoricalGroupPullExecution({
          sourceAccountGroupId,
          groupJid: currentDetail.groupJid
        })
      ]);
      if (activeSessionId !== sessionId) return;
      accountGroups.value = groupResult.list ?? [];
      marketingTemplates.value = templateResult.list ?? [];
      execution.value = latestExecution;
      if (latestExecution) schedulePoll(latestExecution, activeSessionId);
    } catch (error) {
      if (activeSessionId !== sessionId) return;
      executionError.value = apiErrorMessage(error, "加载拉人和营销选项失败");
      ElMessage.error(executionError.value);
    } finally {
      if (activeSessionId === sessionId) optionsLoading.value = false;
    }
  }

  function close(): void {
    sessionId += 1;
    clearPoll();
    resetState();
  }

  async function startPull(): Promise<void> {
    if (submitting.value) return;
    const validationError = validatePull();
    const currentDetail = options.detail();
    const sourceAccountGroupId = options.sourceAccountGroupId();
    const file = materialFile.value;
    const accountGroupId = pullerAccountGroupId.value;
    if (
      validationError ||
      !currentDetail ||
      sourceAccountGroupId == null ||
      !file ||
      accountGroupId == null
    ) {
      executionError.value = validationError;
      if (validationError) ElMessage.warning(validationError);
      return;
    }

    const activeSessionId = sessionId;
    const idempotencyKey = createIdempotencyKey();
    submitting.value = true;
    executionError.value = "";
    clearPoll();
    try {
      const created = await createHistoricalGroupPullExecution({
        file,
        sourceAccountGroupId,
        groupJid: currentDetail.groupJid,
        pullerAccountGroupId: accountGroupId,
        singleAddCount: singleAddCount.value,
        idempotencyKey
      });
      if (activeSessionId !== sessionId) return;
      execution.value = created;

      const started = await startHistoricalGroupPullExecution(created.id);
      if (activeSessionId !== sessionId) return;
      execution.value = started;
      schedulePoll(started, activeSessionId);
      ElMessage.success("单群拉人执行已启动");
    } catch (error) {
      if (activeSessionId !== sessionId) return;
      executionError.value = apiErrorMessage(error, "启动单群拉人失败");
      ElMessage.error(executionError.value);
    } finally {
      if (activeSessionId === sessionId) submitting.value = false;
    }
  }

  async function sendMarketing(): Promise<void> {
    const currentExecution = execution.value;
    const templateId = marketingTemplateId.value;
    if (marketingDisabled.value || !currentExecution || templateId == null) {
      return;
    }

    const activeSessionId = sessionId;
    marketingSending.value = true;
    executionError.value = "";
    clearPoll();
    try {
      const result = await sendHistoricalGroupMarketing(
        currentExecution.id,
        templateId
      );
      if (activeSessionId !== sessionId) return;
      execution.value = result;
      schedulePoll(result, activeSessionId);
      ElMessage.success("全部营销账号发送已启动");
    } catch (error) {
      if (activeSessionId !== sessionId) return;
      executionError.value = apiErrorMessage(error, "启动全部营销账号发送失败");
      ElMessage.error(executionError.value);
    } finally {
      if (activeSessionId === sessionId) marketingSending.value = false;
    }
  }

  return {
    accountGroups,
    close,
    execution,
    executionError,
    gateReason,
    linkGateOpen,
    marketingDisabled,
    marketingReady,
    marketingSending,
    marketingTemplateId,
    marketingTemplates,
    materialFile,
    open,
    optionsLoading,
    polling,
    pullDisabled,
    pullPhaseComplete,
    pullerAccountGroupId,
    sendMarketing,
    singleAddCount,
    startPull,
    submitting,
    validatePull
  };
}

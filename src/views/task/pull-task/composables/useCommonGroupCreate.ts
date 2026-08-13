import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createCommonGroupTask,
  getCommonGroupTask,
  retryCommonGroupTaskItem,
  type CommonGroupTaskCreateRequest,
  type CommonGroupTaskDetailResult,
  type CommonGroupTaskItemResult,
  type CommonGroupTaskSummary
} from "@/api/common-group-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { listGroupFolders, type GroupFolderRow } from "@/api/group-folder";
import { apiErrorMessage } from "@/utils/api-error";
import {
  createCommonGroupForm,
  toCommonGroupCreateRequest,
  validateCommonGroupForm,
  type CommonGroupForm,
  type CommonGroupFormErrors
} from "../common-group/common-group-form";

const POLL_INTERVAL_MS = 2500;
const MAX_UNCHANGED_POLL_ATTEMPTS = 120;
const MAX_CONSECUTIVE_POLL_ERRORS = 3;
const ACTIVE_TASK_STORAGE_KEY = "armada:normal-group-creation:active-task-id";
const PENDING_SUBMISSION_STORAGE_KEY =
  "armada:normal-group-creation:pending-submission";
const PENDING_SUBMISSION_STORAGE_VERSION = 2;
const PENDING_SUBMISSION_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_SUBMISSION_CLOCK_SKEW_MS = 60 * 1000;

interface PendingSubmission {
  fingerprint: string;
  idempotencyKey: string;
  payload: CommonGroupTaskCreateRequest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[]
): boolean {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  return (
    actualKeys.length === sortedExpectedKeys.length &&
    actualKeys.every((key, index) => key === sortedExpectedKeys[index])
  );
}

function isPositiveSafeInteger(value: unknown, max?: number): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    (max === undefined || value <= max)
  );
}

function isNullablePositiveSafeInteger(value: unknown): value is number | null {
  return value === null || isPositiveSafeInteger(value);
}

function isNonNegativeSafeInteger(value: unknown, max?: number): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    (max === undefined || value <= max)
  );
}

function isCommonGroupTaskCreateRequest(
  value: unknown
): value is CommonGroupTaskCreateRequest {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "adminAccountGroupId",
      "secondaryAdminAccountGroupId",
      "secondaryAdminCount",
      "creatorLeavePolicy",
      "memberSource",
      "memberAccountGroupId",
      "memberCount",
      "folderId",
      "groupNameTemplate",
      "groupCount",
      "startNo",
      "speed",
      "successMigrationGroupId",
      "failedMigrationGroupId",
      "settings"
    ]) ||
    !isPositiveSafeInteger(value.adminAccountGroupId) ||
    !isNullablePositiveSafeInteger(value.secondaryAdminAccountGroupId) ||
    !isNonNegativeSafeInteger(value.secondaryAdminCount, 1024) ||
    (value.secondaryAdminAccountGroupId === null
      ? value.secondaryAdminCount !== 0
      : value.secondaryAdminCount === 0) ||
    (value.creatorLeavePolicy !== "KEEP" &&
      value.creatorLeavePolicy !== "LEAVE") ||
    (value.memberSource !== "CONTROLLED_GROUP" &&
      value.memberSource !== "EMPTY_GROUP") ||
    !isPositiveSafeInteger(value.memberAccountGroupId) ||
    !isPositiveSafeInteger(value.memberCount, 1024) ||
    (value.memberSource === "EMPTY_GROUP" && value.memberCount !== 1) ||
    !isNullablePositiveSafeInteger(value.folderId) ||
    typeof value.groupNameTemplate !== "string" ||
    value.groupNameTemplate.length > 128 ||
    !isPositiveSafeInteger(value.groupCount, 1000) ||
    !isPositiveSafeInteger(value.startNo) ||
    value.speed !== "NORMAL" ||
    !isNullablePositiveSafeInteger(value.successMigrationGroupId) ||
    !isNullablePositiveSafeInteger(value.failedMigrationGroupId) ||
    value.groupCount * (value.memberCount + value.secondaryAdminCount) >
      10000 ||
    !isRecord(value.settings) ||
    !hasExactKeys(value.settings, [
      "sendMessagesAllowed",
      "editGroupSettingsAllowed",
      "addMembersAllowed",
      "joinApprovalEnabled",
      "ephemeralDurationSeconds"
    ])
  ) {
    return false;
  }
  return (
    typeof value.settings.sendMessagesAllowed === "boolean" &&
    typeof value.settings.editGroupSettingsAllowed === "boolean" &&
    typeof value.settings.addMembersAllowed === "boolean" &&
    typeof value.settings.joinApprovalEnabled === "boolean" &&
    typeof value.settings.ephemeralDurationSeconds === "number" &&
    [0, 86400, 604800, 7776000].includes(
      value.settings.ephemeralDurationSeconds
    )
  );
}

function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `normal-group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type CommonGroupTaskItemStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "PARTIAL"
  | "RESULT_UNKNOWN"
  | "FAILED";

export interface CommonGroupTaskItem {
  id: number;
  index: number;
  groupName: string;
  status: CommonGroupTaskItemStatus;
  message: string;
  retryable: boolean;
  updatedAt: number;
}

export interface CommonGroupTask {
  taskId: number;
  status: "PROCESSING" | "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
  items: CommonGroupTaskItem[];
}

export interface CommonGroupCreateState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  cancel: () => Promise<void>;
  confirmCreate: () => Promise<void>;
  confirmVisible: Ref<boolean>;
  creating: Ref<boolean>;
  errors: CommonGroupFormErrors;
  form: CommonGroupForm;
  groupFolders: Ref<GroupFolderRow[]>;
  loading: Ref<boolean>;
  open: () => Promise<void>;
  pollingError: Ref<string>;
  requestClose: (done: () => void) => Promise<void>;
  refreshCurrentTask: () => Promise<void>;
  reset: () => void;
  resultVisible: Ref<boolean>;
  returnToForm: () => Promise<void>;
  retryItem: (item: CommonGroupTaskItem) => Promise<void>;
  submit: () => void;
  task: Ref<CommonGroupTask | null>;
  taskProgress: ComputedRef<number>;
  visible: Ref<boolean>;
}

export function useCommonGroupCreate(): CommonGroupCreateState {
  const visible = ref(false);
  const loading = ref(false);
  const creating = ref(false);
  const confirmVisible = ref(false);
  const resultVisible = ref(false);
  const form = reactive<CommonGroupForm>(createCommonGroupForm());
  const errors = reactive<CommonGroupFormErrors>({});
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const groupFolders = ref<GroupFolderRow[]>([]);
  const task = ref<CommonGroupTask | null>(null);
  const pollingError = ref("");
  const retryingItemBaselines = new Map<number, number>();
  let cleanSnapshot = JSON.stringify(form);
  let pollTimer: number | undefined;
  let unchangedPollAttempts = 0;
  let consecutivePollErrors = 0;
  let lastTaskProgressSignature: string | null = null;
  let activeTaskId: number | null = null;
  let taskGeneration = 0;
  let taskRequestSequence = 0;
  let disposed = false;
  let pendingSubmission: PendingSubmission | null = null;

  const taskProgress = computed(() => {
    if (!task.value?.items.length) return 0;
    const finished = task.value.items.filter(item =>
      ["SUCCESS", "PARTIAL", "RESULT_UNKNOWN", "FAILED"].includes(item.status)
    ).length;
    return Math.round((finished / task.value.items.length) * 100);
  });

  function clearErrors(): void {
    Object.keys(errors).forEach(key => {
      delete errors[key as keyof CommonGroupFormErrors];
    });
  }

  function reset(): void {
    Object.assign(form, createCommonGroupForm());
    clearErrors();
    cleanSnapshot = JSON.stringify(form);
    pendingSubmission = null;
  }

  function storedTaskId(): number | null {
    try {
      const value = window.sessionStorage.getItem(ACTIVE_TASK_STORAGE_KEY);
      const taskId = Number(value);
      return Number.isSafeInteger(taskId) && taskId > 0 ? taskId : null;
    } catch {
      return null;
    }
  }

  function storeTaskId(taskId: number): void {
    try {
      window.sessionStorage.setItem(ACTIVE_TASK_STORAGE_KEY, String(taskId));
    } catch {
      // 浏览器禁用 sessionStorage 时仍可在当前页面跟踪任务。
    }
  }

  function clearStoredTaskId(): void {
    try {
      window.sessionStorage.removeItem(ACTIVE_TASK_STORAGE_KEY);
    } catch {
      // 无持久化能力不影响任务本身执行。
    }
  }

  function storedSubmissionIdentity(): PendingSubmission | null {
    try {
      const value = window.sessionStorage.getItem(
        PENDING_SUBMISSION_STORAGE_KEY
      );
      if (!value) return null;
      const parsed = JSON.parse(value) as {
        createdAt?: unknown;
        fingerprint?: unknown;
        idempotencyKey?: unknown;
        payload?: unknown;
        version?: unknown;
      };
      const now = Date.now();
      if (
        parsed.version !== PENDING_SUBMISSION_STORAGE_VERSION ||
        typeof parsed.createdAt !== "number" ||
        !Number.isSafeInteger(parsed.createdAt) ||
        parsed.createdAt <= 0 ||
        parsed.createdAt > now + PENDING_SUBMISSION_CLOCK_SKEW_MS ||
        now - parsed.createdAt > PENDING_SUBMISSION_TTL_MS ||
        typeof parsed.fingerprint !== "string" ||
        parsed.fingerprint.length === 0 ||
        parsed.fingerprint.length > 8192 ||
        typeof parsed.idempotencyKey !== "string" ||
        !/^[A-Za-z0-9-]{8,128}$/.test(parsed.idempotencyKey) ||
        !isCommonGroupTaskCreateRequest(parsed.payload) ||
        JSON.stringify(parsed.payload) !== parsed.fingerprint
      ) {
        window.sessionStorage.removeItem(PENDING_SUBMISSION_STORAGE_KEY);
        return null;
      }
      return {
        fingerprint: parsed.fingerprint,
        idempotencyKey: parsed.idempotencyKey,
        payload: parsed.payload
      };
    } catch {
      return null;
    }
  }

  function storeSubmissionIdentity(
    fingerprint: string,
    idempotencyKey: string,
    payload: CommonGroupTaskCreateRequest
  ): void {
    try {
      window.sessionStorage.setItem(
        PENDING_SUBMISSION_STORAGE_KEY,
        JSON.stringify({
          version: PENDING_SUBMISSION_STORAGE_VERSION,
          fingerprint,
          idempotencyKey,
          payload,
          createdAt: Date.now()
        })
      );
    } catch {
      // 浏览器禁用 sessionStorage 时退回当前页面内的幂等保护。
    }
  }

  function clearStoredSubmissionIdentity(): void {
    try {
      window.sessionStorage.removeItem(PENDING_SUBMISSION_STORAGE_KEY);
    } catch {
      // 无持久化能力不影响任务本身执行。
    }
  }

  function submissionFor(payload: CommonGroupTaskCreateRequest): {
    idempotencyKey: string;
    payload: CommonGroupTaskCreateRequest;
  } {
    const fingerprint = JSON.stringify(payload);
    if (!pendingSubmission || pendingSubmission.fingerprint !== fingerprint) {
      const storedIdentity = storedSubmissionIdentity();
      pendingSubmission = {
        fingerprint,
        idempotencyKey:
          storedIdentity?.fingerprint === fingerprint
            ? storedIdentity.idempotencyKey
            : createIdempotencyKey(),
        payload
      };
      storeSubmissionIdentity(
        fingerprint,
        pendingSubmission.idempotencyKey,
        payload
      );
    }
    return pendingSubmission;
  }

  async function loadOptions(): Promise<void> {
    loading.value = true;
    try {
      const [accountResult, folderResult] = await Promise.allSettled([
        listAccountGroups({ page: 1, pageSize: 500 }),
        listGroupFolders({ page: 1, pageSize: 500 })
      ]);
      if (accountResult.status === "fulfilled") {
        accountGroups.value = accountResult.value.list ?? [];
      } else {
        accountGroups.value = [];
        ElMessage.error(
          apiErrorMessage(accountResult.reason, "账号分组加载失败")
        );
      }
      if (folderResult.status === "fulfilled") {
        groupFolders.value = folderResult.value.list ?? [];
      } else {
        groupFolders.value = [];
        ElMessage.error(
          apiErrorMessage(folderResult.reason, "群组分组加载失败")
        );
      }
    } finally {
      loading.value = false;
    }
  }

  async function open(): Promise<void> {
    const activeTaskId = task.value?.taskId ?? storedTaskId();
    if (activeTaskId) {
      const generation = activateTask(activeTaskId);
      visible.value = false;
      resultVisible.value = true;
      try {
        await refreshTask(activeTaskId, generation);
        schedulePolling(activeTaskId, generation);
      } catch (error) {
        ElMessage.error(apiErrorMessage(error, "任务进度读取失败，请稍后刷新"));
      }
      return;
    }
    const storedSubmission = storedSubmissionIdentity();
    if (storedSubmission) {
      await recoverStoredSubmission(storedSubmission);
      return;
    }
    reset();
    visible.value = true;
    await loadOptions();
  }

  async function requestClose(done: () => void): Promise<void> {
    if (JSON.stringify(form) !== cleanSnapshot) {
      try {
        await ElMessageBox.confirm("放弃未提交的修改？", "提示", {
          confirmButtonText: "放弃",
          cancelButtonText: "继续编辑",
          type: "warning"
        });
      } catch {
        return;
      }
    }
    done();
    reset();
  }

  async function cancel(): Promise<void> {
    await requestClose(() => {
      visible.value = false;
    });
  }

  function submit(): void {
    clearErrors();
    Object.assign(errors, validateCommonGroupForm(form, accountGroups.value));
    if (Object.keys(errors).length) {
      ElMessage.warning("请检查并完善表单配置");
      return;
    }
    confirmVisible.value = true;
  }

  function stopPolling(): void {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = undefined;
  }

  function resetPollingState(): void {
    unchangedPollAttempts = 0;
    consecutivePollErrors = 0;
    lastTaskProgressSignature = null;
    pollingError.value = "";
  }

  function taskProgressSignature(detail: CommonGroupTaskDetailResult): string {
    return JSON.stringify({
      status: detail.task.status,
      successCount: detail.task.successCount,
      failedCount: detail.task.failedCount,
      updatedAt: detail.task.updatedAt,
      items: detail.items.map(item => ({
        id: item.id,
        status: item.status,
        currentStep: item.currentStep,
        settingsStatus: item.settingsStatus,
        creatorLeaveStatus: item.creatorLeaveStatus,
        groupJid: item.groupJid,
        lastErrorCode: item.lastErrorCode,
        updatedAt: item.updatedAt
      }))
    });
  }

  function recordTaskProgress(detail: CommonGroupTaskDetailResult): void {
    const signature = taskProgressSignature(detail);
    if (
      lastTaskProgressSignature === null ||
      lastTaskProgressSignature !== signature
    ) {
      lastTaskProgressSignature = signature;
      unchangedPollAttempts = 0;
    } else {
      unchangedPollAttempts += 1;
    }
    consecutivePollErrors = 0;
  }

  function stopPollingWithError(message: string): void {
    stopPolling();
    pollingError.value = message;
    ElMessage.error(message);
  }

  function itemStatus(
    row: CommonGroupTaskItemResult
  ): CommonGroupTaskItemStatus {
    if (row.status === "CREATED") return "SUCCESS";
    if (row.status === "CREATED_PARTIAL") return "PARTIAL";
    if (row.status === "RESULT_UNKNOWN") return "RESULT_UNKNOWN";
    if (row.status === "FAILED") return "FAILED";
    if (row.status === "RUNNING") return "PROCESSING";
    return "PENDING";
  }

  function itemMessage(row: CommonGroupTaskItemResult): string {
    if (row.lastErrorMessage) return row.lastErrorMessage;
    if (row.status === "CREATED") return "建群及后处理完成";
    if (row.status === "CREATED_PARTIAL")
      return "群已创建，部分成员或后处理未完成";
    if (row.status === "RESULT_UNKNOWN") return "协议结果未知，请先人工对账";
    if (row.status === "RUNNING") return `正在执行：${row.currentStep}`;
    return "等待执行";
  }

  function notifyRetryResult(row: CommonGroupTaskItemResult): void {
    const baseline = retryingItemBaselines.get(row.id);
    if (baseline === undefined || row.updatedAt <= baseline) return;
    if (row.status === "PENDING" || row.status === "RUNNING") return;
    retryingItemBaselines.delete(row.id);
    if (row.status === "CREATED") {
      ElMessage.success(`${row.groupSubject} 重试成功`);
      return;
    }
    if (row.status === "FAILED") {
      ElMessage.error(`${row.groupSubject} 重试失败：${itemMessage(row)}`);
      return;
    }
    ElMessage.warning(
      `${row.groupSubject} 重试结果需处理：${itemMessage(row)}`
    );
  }

  function applyTaskDetail(detail: CommonGroupTaskDetailResult): void {
    detail.items.forEach(notifyRetryResult);
    task.value = {
      taskId: detail.task.id,
      status:
        detail.task.status === "SUCCESS"
          ? "SUCCESS"
          : detail.task.status === "PARTIAL"
            ? "PARTIAL_SUCCESS"
            : detail.task.status === "FAILED"
              ? "FAILED"
              : "PROCESSING",
      items: detail.items.map(row => ({
        id: row.id,
        index: row.itemNo,
        groupName: row.groupSubject,
        status: itemStatus(row),
        message: itemMessage(row),
        retryable: row.status === "FAILED",
        updatedAt: row.updatedAt
      }))
    };
  }

  function applyTaskSummary(summary: CommonGroupTaskSummary): void {
    task.value = {
      taskId: summary.id,
      status:
        summary.status === "SUCCESS"
          ? "SUCCESS"
          : summary.status === "PARTIAL"
            ? "PARTIAL_SUCCESS"
            : summary.status === "FAILED"
              ? "FAILED"
              : "PROCESSING",
      items: []
    };
  }

  function activateTask(taskId: number): number {
    if (activeTaskId !== null && activeTaskId !== taskId) {
      retryingItemBaselines.clear();
    }
    activeTaskId = taskId;
    taskGeneration += 1;
    taskRequestSequence += 1;
    resetPollingState();
    return taskGeneration;
  }

  function prepareTaskRetry(taskId: number): number {
    stopPolling();
    if (activeTaskId !== taskId) return activateTask(taskId);
    taskRequestSequence += 1;
    resetPollingState();
    return taskGeneration;
  }

  async function refreshTask(
    taskId: number,
    generation = taskGeneration
  ): Promise<boolean> {
    const requestSequence = ++taskRequestSequence;
    const detail = await getCommonGroupTask(taskId);
    if (
      disposed ||
      generation !== taskGeneration ||
      requestSequence !== taskRequestSequence ||
      activeTaskId !== taskId
    )
      return false;
    recordTaskProgress(detail);
    applyTaskDetail(detail);
    return true;
  }

  function schedulePolling(taskId: number, generation = taskGeneration): void {
    if (disposed || generation !== taskGeneration || activeTaskId !== taskId)
      return;
    stopPolling();
    if (!resultVisible.value) return;
    if (task.value?.status !== "PROCESSING" && retryingItemBaselines.size === 0)
      return;
    if (unchangedPollAttempts >= MAX_UNCHANGED_POLL_ATTEMPTS) {
      stopPollingWithError(
        "任务连续 5 分钟无进展，已停止自动刷新。请点击刷新重试，或返回表单新建任务。"
      );
      return;
    }
    pollTimer = window.setTimeout(async () => {
      if (disposed || generation !== taskGeneration || activeTaskId !== taskId)
        return;
      if (!resultVisible.value) return stopPolling();
      if (document.hidden) return schedulePolling(taskId, generation);
      try {
        await refreshTask(taskId, generation);
      } catch {
        if (
          disposed ||
          generation !== taskGeneration ||
          activeTaskId !== taskId
        )
          return;
        consecutivePollErrors += 1;
        if (consecutivePollErrors >= MAX_CONSECUTIVE_POLL_ERRORS) {
          stopPollingWithError(
            "任务进度连续 3 次读取失败，已停止自动刷新。请检查网络后点击刷新重试。"
          );
          return;
        }
      }
      schedulePolling(taskId, generation);
    }, POLL_INTERVAL_MS);
  }

  async function recoverStoredSubmission(
    submission: PendingSubmission
  ): Promise<void> {
    loading.value = true;
    try {
      const summary = await createCommonGroupTask(
        submission.payload,
        submission.idempotencyKey
      );
      await enterTaskResult(summary, "已恢复上次提交的普群任务");
    } catch (error) {
      if (disposed) return;
      ElMessage.warning(
        apiErrorMessage(
          error,
          "上次普群提交状态暂时无法恢复，请稍后再次点击新建普群"
        )
      );
    } finally {
      if (!disposed) loading.value = false;
    }
  }

  async function enterTaskResult(
    summary: CommonGroupTaskSummary,
    successMessage: string
  ): Promise<void> {
    storeTaskId(summary.id);
    pendingSubmission = null;
    clearStoredSubmissionIdentity();
    if (disposed) return;
    const generation = activateTask(summary.id);
    applyTaskSummary(summary);
    confirmVisible.value = false;
    visible.value = false;
    resultVisible.value = true;
    try {
      await refreshTask(summary.id, generation);
    } catch (error) {
      if (disposed) return;
      ElMessage.warning(
        apiErrorMessage(error, "任务已创建，首次进度读取失败，将继续自动刷新")
      );
    }
    if (disposed) return;
    schedulePolling(summary.id, generation);
    ElMessage.success(successMessage);
  }

  async function confirmCreate(): Promise<void> {
    creating.value = true;
    try {
      const submission = submissionFor(toCommonGroupCreateRequest(form));
      const summary = await createCommonGroupTask(
        submission.payload,
        submission.idempotencyKey
      );
      await enterTaskResult(summary, "普群任务创建成功");
    } catch (error) {
      if (disposed) return;
      ElMessage.error(apiErrorMessage(error, "普群任务创建失败"));
    } finally {
      if (!disposed) creating.value = false;
    }
  }

  async function refreshCurrentTask(): Promise<void> {
    const taskId = activeTaskId ?? task.value?.taskId ?? storedTaskId();
    if (!taskId) {
      ElMessage.warning("暂无可刷新的普群任务");
      return;
    }
    const generation =
      activeTaskId === taskId ? taskGeneration : activateTask(taskId);
    resetPollingState();
    try {
      await refreshTask(taskId, generation);
      schedulePolling(taskId, generation);
    } catch (error) {
      if (disposed) return;
      ElMessage.error(apiErrorMessage(error, "任务进度刷新失败"));
    }
  }

  async function retryItem(item: CommonGroupTaskItem): Promise<void> {
    if (!item.retryable || !task.value) return;
    if (retryingItemBaselines.has(item.id)) {
      ElMessage.warning(`${item.groupName} 正在重试，请勿重复操作`);
      return;
    }
    const taskId = task.value.taskId;
    const generation = prepareTaskRetry(taskId);
    retryingItemBaselines.set(item.id, item.updatedAt);
    try {
      await retryCommonGroupTaskItem(taskId, item.id);
      if (disposed) return;
      ElMessage.info(`${item.groupName} 重试请求已提交，正在执行`);
    } catch (error) {
      if (disposed) return;
      retryingItemBaselines.delete(item.id);
      ElMessage.error(apiErrorMessage(error, "重试失败"));
      schedulePolling(taskId, generation);
      return;
    }
    try {
      if (!(await refreshTask(taskId, generation))) return;
      schedulePolling(taskId, generation);
    } catch (error) {
      if (disposed) return;
      ElMessage.warning(
        apiErrorMessage(error, "已提交重试，最新进度读取失败，将继续自动刷新")
      );
      schedulePolling(taskId, generation);
    }
  }

  async function returnToForm(): Promise<void> {
    stopPolling();
    activeTaskId = null;
    taskGeneration += 1;
    taskRequestSequence += 1;
    resultVisible.value = false;
    task.value = null;
    retryingItemBaselines.clear();
    clearStoredTaskId();
    await open();
  }

  onBeforeUnmount(() => {
    disposed = true;
    stopPolling();
    activeTaskId = null;
    retryingItemBaselines.clear();
    taskGeneration += 1;
  });

  return {
    accountGroups,
    cancel,
    confirmCreate,
    confirmVisible,
    creating,
    errors,
    form,
    groupFolders,
    loading,
    open,
    pollingError,
    requestClose,
    refreshCurrentTask,
    reset,
    resultVisible,
    returnToForm,
    retryItem,
    submit,
    task,
    taskProgress,
    visible
  };
}

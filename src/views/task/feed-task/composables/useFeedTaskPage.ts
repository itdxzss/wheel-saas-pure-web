import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  actionFeedTask,
  countFeedTaskAccounts,
  createFeedTask,
  getFeedTask,
  listFeedTaskAccounts,
  listFeedTasks,
  updateFeedTask,
  type FeedTaskAccountFilter,
  type FeedTaskAccountRow,
  type FeedTaskAction,
  type FeedTaskDetail,
  type FeedTaskQuery,
  type FeedTaskRow
} from "@/api/feed-task";
import {
  listAccountGroups,
  type AccountGroupApiRow
} from "@/api/account-group";
import { apiErrorMessage } from "@/utils/api-error";
import {
  emptyFeedTaskForm,
  type FeedTaskForm
} from "../constants";

export interface FeedTaskSearchForm {
  name: string;
  taskStatus: FeedTaskQuery["taskStatus"];
  createdAtStart: string;
  createdAtEnd: string;
}

function detailToForm(detail: FeedTaskDetail): FeedTaskForm {
  return {
    name: detail.name ?? "",
    accountFilter: { ...(detail.accountFilter ?? {}) },
    title: detail.title ?? "",
    description: detail.description ?? "",
    content: detail.content ?? "",
    promotionLink: detail.promotionLink ?? "",
    textColor: detail.textColor ?? "#FFFFFF",
    backgroundColor: detail.backgroundColor ?? "#075E54",
    concurrency: detail.concurrency ?? 10,
    retryMax: detail.retryMax ?? 3,
    startMode:
      (detail.taskDelayMinutes ?? 0) > 0 ? "scheduled" : "now",
    taskDelayMinutes: detail.taskDelayMinutes ?? 0,
    taskMode: detail.taskMode ?? "instant",
    taskPlannedEndAt: detail.taskPlannedEndAt
      ? new Date(detail.taskPlannedEndAt).getTime()
      : null,
    status: detail.status ?? 1
  };
}

function formTimeToTimestamp(value: number | string | null): number | null {
  if (value == null || value === "") return null;
  const timestamp = Number(value);
  if (Number.isFinite(timestamp)) return timestamp;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toWritePayload(form: FeedTaskForm) {
  return {
    name: form.name.trim(),
    accountFilter: form.accountFilter,
    title: form.title.trim(),
    description: form.description.trim(),
    content: form.content.trim(),
    promotionLink: form.promotionLink.trim(),
    textColor: form.textColor,
    backgroundColor: form.backgroundColor,
    taskDelayMinutes:
      form.startMode === "scheduled" ? form.taskDelayMinutes : 0,
    status: form.status,
    concurrency: form.concurrency,
    retryMax: form.retryMax,
    taskMode: form.taskMode,
    taskPlannedEndAt: (() => {
      const timestamp =
        form.taskMode === "rolling"
          ? formTimeToTimestamp(form.taskPlannedEndAt)
          : null;
      return timestamp == null ? null : new Date(timestamp).toISOString();
    })()
  };
}

export function useFeedTaskPage() {
  const loading = ref(false);
  const rows = ref<FeedTaskRow[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);
  const searchForm = reactive<FeedTaskSearchForm>({
    name: "",
    taskStatus: "",
    createdAtStart: "",
    createdAtEnd: ""
  });
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const editorVisible = ref(false);
  const editorLoading = ref(false);
  const editorId = ref<number | null>(null);
  const editorReadonly = ref(false);
  const editorForm = reactive<FeedTaskForm>(emptyFeedTaskForm());
  const imageFile = ref<File | null>(null);
  const imagePreview = ref<string | null>(null);
  const availableAccountCount = ref<number | null>(null);
  const accountCountLoading = ref(false);
  const filterVisible = ref(false);
  const dataVisible = ref(false);
  const dataTaskId = ref<number | null>(null);
  const dataTaskName = ref("");
  const accountRows = ref<FeedTaskAccountRow[]>([]);
  const accountDataLoading = ref(false);
  const accountDataTotal = ref(0);
  const accountDataPage = ref(1);
  const accountDataPageSize = ref(20);
  const accountPhone = ref("");

  const runningCount = computed(
    () => rows.value.filter(row => row.taskStatus === 1).length
  );
  const doneCount = computed(
    () => rows.value.filter(row => row.taskStatus === 2).length
  );

  function buildQuery(): FeedTaskQuery {
    return {
      page: page.value,
      pageSize: pageSize.value,
      name: searchForm.name,
      taskStatus: searchForm.taskStatus,
      createdAtStart: searchForm.createdAtStart || undefined,
      createdAtEnd: searchForm.createdAtEnd || undefined
    };
  }

  async function loadTasks(): Promise<void> {
    loading.value = true;
    try {
      const result = await listFeedTasks(buildQuery());
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "动态发布任务加载失败"));
    } finally {
      loading.value = false;
    }
  }

  async function loadOptions(): Promise<void> {
    try {
      const result = await listAccountGroups({ page: 1, pageSize: 500 });
      accountGroups.value = result.list ?? [];
    } catch (error) {
      accountGroups.value = [];
      ElMessage.error(apiErrorMessage(error, "账号分组选项加载失败"));
    }
  }

  async function refreshAccountCount(
    filter: FeedTaskAccountFilter
  ): Promise<void> {
    accountCountLoading.value = true;
    try {
      availableAccountCount.value = await countFeedTaskAccounts(filter);
    } catch (error) {
      availableAccountCount.value = null;
      ElMessage.error(apiErrorMessage(error, "可用账号数量加载失败"));
    } finally {
      accountCountLoading.value = false;
    }
  }

  function resetEditor(): void {
    Object.assign(editorForm, emptyFeedTaskForm());
    imageFile.value = null;
    imagePreview.value = null;
    availableAccountCount.value = null;
  }

  async function openCreateEditor(): Promise<void> {
    resetEditor();
    await loadOptions();
    editorId.value = null;
    editorReadonly.value = false;
    editorVisible.value = true;
    await refreshAccountCount(editorForm.accountFilter);
  }

  async function openEditEditor(
    row: FeedTaskRow,
    readonly = false
  ): Promise<void> {
    editorLoading.value = true;
    editorId.value = row.id;
    editorReadonly.value = readonly;
    try {
      const detail = await getFeedTask(row.id);
      Object.assign(editorForm, detailToForm(detail));
      imageFile.value = null;
      imagePreview.value = detail.linkPreviewImage ?? null;
      await loadOptions();
      editorVisible.value = true;
      await refreshAccountCount(editorForm.accountFilter);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "动态发布任务详情加载失败"));
    } finally {
      editorLoading.value = false;
    }
  }

  function closeEditor(done?: () => void): void {
    if (editorReadonly.value) {
      editorVisible.value = false;
      done?.();
      return;
    }
    void ElMessageBox.confirm(
      "当前填写内容尚未保存，关闭后修改将丢失，是否继续？",
      "确认关闭",
      { type: "warning", confirmButtonText: "关闭", cancelButtonText: "继续编辑" }
    )
      .then(() => {
        editorVisible.value = false;
        resetEditor();
        done?.();
      })
      .catch(() => undefined);
  }

  async function submitEditor(): Promise<void> {
    if (!editorForm.name.trim() || !editorForm.title.trim()) {
      ElMessage.warning("请填写任务名称和推广标题");
      return;
    }
    if (!editorForm.promotionLink.trim()) {
      ElMessage.warning("请输入推广链接");
      return;
    }
    if (editorForm.taskMode === "rolling" && !editorForm.taskPlannedEndAt) {
      ElMessage.warning("请选择计划结束时间");
      return;
    }
    if (
      editorForm.startMode === "scheduled" &&
      (!Number.isInteger(editorForm.taskDelayMinutes) ||
        editorForm.taskDelayMinutes <= 0)
    ) {
      ElMessage.warning("请输入大于 0 的延迟分钟数");
      return;
    }
    const plannedEndTimestamp = formTimeToTimestamp(
      editorForm.taskPlannedEndAt
    );
    if (
      editorForm.taskMode === "rolling" &&
      (plannedEndTimestamp == null || plannedEndTimestamp <= Date.now() + 60_000)
    ) {
      ElMessage.warning("计划结束时间需晚于当前时间至少 1 分钟");
      return;
    }
    if (
      editorForm.status === 1 &&
      editorForm.taskMode === "instant" &&
      availableAccountCount.value === 0
    ) {
      ElMessage.warning("即时任务需要至少 1 个可用账号，请切换为预发布模式");
      return;
    }
    editorLoading.value = true;
    try {
      const payload = toWritePayload(editorForm);
      if (editorId.value) {
        await updateFeedTask(editorId.value, payload, imageFile.value);
        ElMessage.success("动态发布任务修改成功");
      } else {
        await createFeedTask(payload, imageFile.value);
        ElMessage.success("动态发布任务创建成功");
      }
      editorVisible.value = false;
      resetEditor();
      await loadTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "动态发布任务保存失败"));
    } finally {
      editorLoading.value = false;
    }
  }

  async function runAction(row: FeedTaskRow, action: FeedTaskAction): Promise<void> {
    const labels: Record<FeedTaskAction, string> = {
      start: "启动",
      pause: "暂停",
      resume: "恢复",
      stop: "停止"
    };
    try {
      await ElMessageBox.confirm(
        action === "stop" ? "停止后任务将终止且无法恢复，是否继续？" : `确认${labels[action]}任务「${row.title || row.name}」？`,
        `确认${labels[action]}`,
        { type: action === "stop" ? "warning" : "info" }
      );
      await actionFeedTask(row.id, action);
      ElMessage.success(`任务已${labels[action]}`);
      await loadTasks();
    } catch (error) {
      if (error !== "cancel" && error !== "close") {
        ElMessage.error(apiErrorMessage(error, `任务${labels[action]}失败`));
      }
    }
  }

  async function openAccountData(row: FeedTaskRow): Promise<void> {
    dataTaskId.value = row.id;
    dataTaskName.value = row.title || row.name;
    accountDataPage.value = 1;
    accountPhone.value = "";
    dataVisible.value = true;
    await loadAccountData();
  }

  async function loadAccountData(): Promise<void> {
    if (!dataTaskId.value) return;
    accountDataLoading.value = true;
    try {
      const result = await listFeedTaskAccounts(dataTaskId.value, {
        page: accountDataPage.value,
        pageSize: accountDataPageSize.value,
        accountPhone: accountPhone.value.trim() || undefined
      });
      accountRows.value = result.list ?? [];
      accountDataTotal.value = result.total ?? 0;
    } catch (error) {
      accountRows.value = [];
      accountDataTotal.value = 0;
      ElMessage.error(apiErrorMessage(error, "账号发送数据加载失败"));
    } finally {
      accountDataLoading.value = false;
    }
  }

  function searchTasks(): void {
    page.value = 1;
    void loadTasks();
  }

  function resetSearchForm(): void {
    Object.assign(searchForm, {
      name: "",
      taskStatus: "",
      createdAtStart: "",
      createdAtEnd: ""
    });
    page.value = 1;
    void loadTasks();
  }

  return {
    accountCountLoading,
    accountDataLoading,
    accountDataPage,
    accountDataPageSize,
    accountDataTotal,
    accountGroups,
    accountPhone,
    accountRows,
    availableAccountCount,
    closeEditor,
    dataTaskName,
    dataVisible,
    doneCount,
    editorForm,
    editorId,
    editorLoading,
    editorReadonly,
    editorVisible,
    filterVisible,
    imageFile,
    imagePreview,
    loadAccountData,
    loadTasks,
    loading,
    openAccountData,
    openCreateEditor,
    openEditEditor,
    page,
    pageSize,
    refreshAccountCount,
    resetSearchForm,
    rows,
    runningCount,
    runAction,
    searchForm,
    searchTasks,
    submitEditor,
    total
  };
}

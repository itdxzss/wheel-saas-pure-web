import { computed, ref } from "vue";
import { storageLocal } from "@pureadmin/utils";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  actionHyperlinkTask,
  exportHyperlinkTasks,
  getHyperlinkTaskCreateContext,
  listHyperlinkTasks,
  type HyperlinkTaskAction,
  type HyperlinkTaskCreateContext,
  type HyperlinkTaskListItem,
  type HyperlinkTaskListQuery,
  type HyperlinkTaskMode,
  type HyperlinkTaskRunStatus
} from "@/api/hyperlink-task-list";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import { getToken, type DataInfo, userKey } from "@/utils/auth";
import {
  createHyperlinkTaskTableColumns,
  currentUserTenantColumnKey,
  mergeColumnPreferences,
  toColumnPreferences,
  type HyperlinkTaskColumnPreference,
  type HyperlinkTaskTableColumn
} from "../domain/list-display";

export type HyperlinkTaskPageSize = 10 | 20 | 50 | 100 | 200;

export interface HyperlinkTaskSearchForm {
  taskName: string;
  runStatus: HyperlinkTaskRunStatus | null;
  taskMode: HyperlinkTaskMode | null;
  countryIso2: string | null;
  createdRange: [Date, Date] | null;
}

function emptySearchForm(): HyperlinkTaskSearchForm {
  return {
    taskName: "",
    runStatus: null,
    taskMode: null,
    countryIso2: null,
    createdRange: null
  };
}

function columnStorageKey(): string {
  const token = getToken();
  const user = storageLocal().getItem<DataInfo<number>>(userKey);
  return currentUserTenantColumnKey(user?.username, token?.accessToken);
}

function loadColumns(): HyperlinkTaskTableColumn[] {
  const defaults = createHyperlinkTaskTableColumns();
  try {
    const saved = window.localStorage.getItem(columnStorageKey());
    if (!saved) return defaults;
    return mergeColumnPreferences(
      defaults,
      JSON.parse(saved) as HyperlinkTaskColumnPreference[]
    );
  } catch {
    return defaults;
  }
}

export function useHyperlinkTaskPage() {
  const rows = ref<HyperlinkTaskListItem[]>([]);
  const columns = ref(loadColumns());
  const columnKey = ref(0);
  const context = ref<HyperlinkTaskCreateContext | null>(null);
  const loading = ref(false);
  const contextLoading = ref(false);
  const exporting = ref(false);
  const errorMessage = ref("");
  const contextErrorMessage = ref("");
  const page = ref(1);
  const pageSize = ref<HyperlinkTaskPageSize>(20);
  const total = ref(0);
  const searchForm = ref(emptySearchForm());
  const busyActions = ref<Record<number, string | null>>({});
  let requestSequence = 0;
  let nameSearchActive = false;

  const countries = computed(() => context.value?.countryOptions ?? []);
  const groups = computed(() => context.value?.groupOptions ?? []);
  const channels = computed(() => context.value?.channelOptions ?? []);
  const protocols = computed(() => context.value?.protocolOptions ?? []);
  const filtersActive = computed(() => {
    const form = searchForm.value;
    return Boolean(
      form.taskName.trim() ||
        form.runStatus != null ||
        form.taskMode ||
        form.countryIso2 ||
        form.createdRange
    );
  });

  function query(): HyperlinkTaskListQuery {
    const range = searchForm.value.createdRange;
    return {
      page: page.value,
      pageSize: pageSize.value,
      taskName: searchForm.value.taskName,
      runStatus: searchForm.value.runStatus,
      taskMode: searchForm.value.taskMode,
      countryIso2: searchForm.value.countryIso2,
      createdAtStart: range?.[0].getTime(),
      createdAtEnd: range?.[1].getTime()
    };
  }

  async function refreshTasks(): Promise<void> {
    const sequence = ++requestSequence;
    loading.value = true;
    try {
      const result = await listHyperlinkTasks(query());
      if (sequence !== requestSequence) return;
      rows.value = result.list;
      page.value = result.page;
      pageSize.value = result.pageSize as HyperlinkTaskPageSize;
      total.value = result.total;
      errorMessage.value = "";
    } catch (error) {
      if (sequence !== requestSequence) return;
      errorMessage.value = apiErrorMessage(error, "超链任务列表加载失败");
      ElMessage.error(errorMessage.value);
    } finally {
      if (sequence === requestSequence) loading.value = false;
    }
  }

  async function refreshContext(): Promise<void> {
    contextLoading.value = true;
    try {
      context.value = await getHyperlinkTaskCreateContext();
      contextErrorMessage.value = "";
    } catch (error) {
      context.value = null;
      contextErrorMessage.value = apiErrorMessage(error, "价格上下文加载失败");
    } finally {
      contextLoading.value = false;
    }
  }

  async function initialize(): Promise<void> {
    await Promise.all([refreshTasks(), refreshContext()]);
  }

  async function searchTasks(): Promise<void> {
    const hasTaskName = Boolean(searchForm.value.taskName.trim());
    if (hasTaskName && !nameSearchActive) pageSize.value = 200;
    if (!hasTaskName && nameSearchActive) pageSize.value = 20;
    nameSearchActive = hasTaskName;
    page.value = 1;
    await refreshTasks();
  }

  async function resetSearch(): Promise<void> {
    searchForm.value = emptySearchForm();
    nameSearchActive = false;
    page.value = 1;
    pageSize.value = 20;
    await refreshTasks();
  }

  async function exportTasks(): Promise<void> {
    exporting.value = true;
    try {
      const result = await exportHyperlinkTasks(query());
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(`已导出 ${result.exportedCount} 个任务`);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "超链任务导出失败"));
    } finally {
      exporting.value = false;
    }
  }

  async function runLifecycleAction(
    row: HyperlinkTaskListItem,
    action: HyperlinkTaskAction
  ): Promise<void> {
    const messages = {
      PAUSE: `确认暂停“${row.taskName}”？暂停后可恢复。`,
      RESUME: `确认恢复“${row.taskName}”？任务将继续按原策略发送。`,
      STOP: `确认停止“${row.taskName}”？终止后无法恢复。`
    };
    try {
      await ElMessageBox.confirm(
        messages[action],
        `${actionLabel(action)}任务`,
        {
          type: action === "STOP" ? "warning" : "info",
          confirmButtonText: "确认",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }
    busyActions.value = { ...busyActions.value, [row.id]: action };
    try {
      const receipt = await actionHyperlinkTask(row.id, action, row.version);
      rows.value = rows.value.map(item =>
        item.id === row.id
          ? {
              ...item,
              enabled: receipt.enabled,
              runStatus: receipt.runStatus,
              provisionStatus: receipt.provisionStatus,
              version: receipt.version
            }
          : item
      );
      ElMessage.success(`${actionLabel(action)}成功`);
      await refreshTasks();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, `${actionLabel(action)}失败`));
      await refreshTasks();
    } finally {
      busyActions.value = { ...busyActions.value, [row.id]: null };
    }
  }

  function persistColumns(
    dynamicColumns: HyperlinkTaskTableColumn[],
    reason: "update" | "reset"
  ): void {
    if (reason === "reset") {
      columns.value = createHyperlinkTaskTableColumns();
      try {
        window.localStorage.removeItem(columnStorageKey());
      } catch {
        // 浏览器禁用存储时，当前页仍能恢复默认列。
      }
      columnKey.value += 1;
      return;
    }
    const preferences = toColumnPreferences(dynamicColumns);
    columns.value = mergeColumnPreferences(
      createHyperlinkTaskTableColumns(),
      preferences
    );
    try {
      window.localStorage.setItem(
        columnStorageKey(),
        JSON.stringify(preferences)
      );
    } catch {
      // 浏览器禁用存储时，列设置只保留到本次页面生命周期。
    }
  }

  return {
    busyActions,
    channels,
    columnKey,
    columns,
    context,
    contextErrorMessage,
    contextLoading,
    countries,
    errorMessage,
    exporting,
    filtersActive,
    groups,
    loading,
    page,
    pageSize,
    protocols,
    rows,
    searchForm,
    total,
    exportTasks,
    initialize,
    persistColumns,
    refreshContext,
    refreshTasks,
    resetSearch,
    runLifecycleAction,
    searchTasks
  };
}

function actionLabel(action: HyperlinkTaskAction): string {
  return { PAUSE: "暂停", RESUME: "恢复", STOP: "停止" }[action];
}

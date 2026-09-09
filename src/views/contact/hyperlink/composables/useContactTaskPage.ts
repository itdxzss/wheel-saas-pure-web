import { computed, onMounted, ref } from "vue";
import { ElMessageBox, type TableInstance } from "element-plus";
import { message } from "@/utils/message";
import {
  actContactTask,
  batchDeleteContactTasks,
  createContactTask,
  getContactTask,
  listContactTasks,
  previewContactTaskAccounts,
  updateContactTask,
  type ContactTaskAction,
  type ContactTaskDetail,
  type ContactTaskListItem,
  type ContactTaskWriteRequest
} from "@/api/contact-task";
import {
  emptyAccountFilterForm,
  toAccountFilterJson,
  type AccountFilterForm
} from "../domain/account-filter";
import { canDeleteTask } from "../domain/task-status";

type DrawerMode = "create" | "edit" | "view";

/** 列表页的全部状态与动作。抽出来是为了让 index.vue 只管渲染。 */
export function useContactTaskPage() {
  const rows = ref<ContactTaskListItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);
  const loading = ref(false);
  const deleting = ref(false);
  const selectedRows = ref<ContactTaskListItem[]>([]);
  const tableRef = ref<TableInstance>();
  let loadVersion = 0;

  const searchName = ref("");
  const searchRunStatus = ref<number | null>(null);
  const searchCreatedRange = ref<[number, number] | null>(null);

  const drawerVisible = ref(false);
  const drawerMode = ref<DrawerMode>("create");
  const drawerDetail = ref<ContactTaskDetail | null>(null);
  const submitting = ref(false);
  /** 账号范围试算命中数；未试算或试算失败时为 undefined，界面就不显示计数 */
  const matchedAccountCount = ref<number | undefined>(undefined);

  const accountDrawerVisible = ref(false);
  const accountDrawerTaskId = ref<number | null>(null);
  const accountDrawerTaskName = ref("");

  const hasRows = computed(() => rows.value.length > 0);

  async function load() {
    const version = ++loadVersion;
    loading.value = true;
    selectedRows.value = [];
    tableRef.value?.clearSelection();
    try {
      const result = await listContactTasks({
        page: page.value,
        pageSize: pageSize.value,
        name: searchName.value.trim() || undefined,
        runStatus: searchRunStatus.value ?? undefined,
        createdAtStart: searchCreatedRange.value?.[0],
        createdAtEnd: searchCreatedRange.value?.[1]
      });
      if (version !== loadVersion) return;
      const lastPage = Math.max(
        1,
        Math.ceil((result.total ?? 0) / pageSize.value)
      );
      if (page.value > lastPage) {
        page.value = lastPage;
        await load();
        return;
      }
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      if (version !== loadVersion) return;
      rows.value = [];
      total.value = 0;
      message((error as Error)?.message ?? "任务列表加载失败", {
        type: "error"
      });
    } finally {
      if (version === loadVersion) loading.value = false;
    }
  }

  /** 表头全选只包含本页状态允许删除的任务。 */
  function selectable(row: ContactTaskListItem): boolean {
    return !loading.value && !deleting.value && canDeleteTask(row.runStatus);
  }

  function onSelectionChange(selection: ContactTaskListItem[]) {
    selectedRows.value = selection.filter(selectable);
  }

  /** 冻结本次确认的 ID，阻止重复提交；失败保留列表并展示服务端原因。 */
  async function deleteSelected() {
    if (deleting.value || loading.value || selectedRows.value.length === 0)
      return;
    const ids = selectedRows.value.map(row => row.id);
    deleting.value = true;
    try {
      await ElMessageBox.confirm(
        `确认删除选中的 ${ids.length} 个任务？删除后任务将从列表移除，发送明细保留。`,
        "批量删除任务",
        { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
      );
      const count = await batchDeleteContactTasks(ids);
      message(`已删除 ${count} 个任务`, { type: "success" });
      await load();
    } catch (error) {
      if (error !== "cancel" && error !== "close") {
        message((error as Error)?.message ?? "批量删除失败", { type: "error" });
      }
    } finally {
      deleting.value = false;
    }
  }

  function search() {
    page.value = 1;
    load();
  }

  function resetSearch() {
    searchName.value = "";
    searchRunStatus.value = null;
    searchCreatedRange.value = null;
    search();
  }

  function changePage(next: number) {
    page.value = next;
    load();
  }

  function changePageSize(next: number) {
    pageSize.value = next;
    page.value = 1;
    load();
  }

  function openCreate() {
    drawerMode.value = "create";
    drawerDetail.value = null;
    drawerVisible.value = true;
    // 新建时筛选为空，先试算一次「全部有效账号」有多少
    onFilterChange(emptyAccountFilterForm());
  }

  async function openDetail(id: number, mode: DrawerMode) {
    try {
      drawerDetail.value = await getContactTask(id);
      drawerMode.value = mode;
      matchedAccountCount.value = undefined;
      drawerVisible.value = true;
      // 抽屉挂载后会用回填的筛选条件回调 onFilterChange，这里不重复试算
    } catch (error) {
      message((error as Error)?.message ?? "任务详情加载失败", {
        type: "error"
      });
    }
  }

  function openAccountData(row: ContactTaskListItem) {
    accountDrawerTaskId.value = row.id;
    accountDrawerTaskName.value = row.name;
    accountDrawerVisible.value = true;
  }

  async function submit(body: ContactTaskWriteRequest) {
    submitting.value = true;
    try {
      if (drawerMode.value === "edit" && drawerDetail.value) {
        await updateContactTask(drawerDetail.value.id, body);
      } else {
        await createContactTask(body);
      }
      message("保存成功", { type: "success" });
      drawerVisible.value = false;
      await load();
    } catch (error) {
      message((error as Error)?.message ?? "保存失败", { type: "error" });
    } finally {
      submitting.value = false;
    }
  }

  async function act(row: ContactTaskListItem, action: ContactTaskAction) {
    try {
      await actContactTask(row.id, action);
      message("操作成功", { type: "success" });
      await load();
    } catch (error) {
      message((error as Error)?.message ?? "操作失败", { type: "error" });
    }
  }

  /**
   * 抽屉里改了筛选条件后回传，实时试算命中账号数。
   *
   * 试算失败时把计数清空而不是显示 0：0 会让抽屉误判「没命中任何账号」并阻止启用，
   * 把一次网络抖动变成一个假的业务错误。
   */
  async function onFilterChange(filter: AccountFilterForm) {
    try {
      const preview = await previewContactTaskAccounts(
        toAccountFilterJson(filter)
      );
      matchedAccountCount.value = preview.matchedAccountCount;
    } catch {
      matchedAccountCount.value = undefined;
    }
  }

  onMounted(load);

  return {
    rows,
    total,
    page,
    pageSize,
    loading,
    deleting,
    selectedRows,
    tableRef,
    selectable,
    onSelectionChange,
    deleteSelected,
    hasRows,
    searchName,
    searchRunStatus,
    searchCreatedRange,
    drawerVisible,
    drawerMode,
    drawerDetail,
    submitting,
    matchedAccountCount,
    accountDrawerVisible,
    accountDrawerTaskId,
    accountDrawerTaskName,
    emptyFilter: emptyAccountFilterForm,
    load,
    search,
    resetSearch,
    changePage,
    changePageSize,
    openCreate,
    openDetail,
    openAccountData,
    submit,
    act,
    onFilterChange
  };
}

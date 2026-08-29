import { computed, onMounted, ref } from "vue";
import { message } from "@/utils/message";
import {
  actContactTask,
  createContactTask,
  getContactTask,
  listContactTasks,
  updateContactTask,
  type ContactTaskAction,
  type ContactTaskDetail,
  type ContactTaskListItem,
  type ContactTaskWriteRequest
} from "@/api/contact-task";
import {
  emptyAccountFilterForm,
  type AccountFilterForm
} from "../domain/account-filter";

type DrawerMode = "create" | "edit" | "view";

/** 列表页的全部状态与动作。抽出来是为了让 index.vue 只管渲染。 */
export function useContactTaskPage() {
  const rows = ref<ContactTaskListItem[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);
  const loading = ref(false);

  const searchName = ref("");
  const searchRunStatus = ref<number | null>(null);
  const searchCreatedRange = ref<[number, number] | null>(null);

  const drawerVisible = ref(false);
  const drawerMode = ref<DrawerMode>("create");
  const drawerDetail = ref<ContactTaskDetail | null>(null);
  const submitting = ref(false);
  /** 账号范围试算命中数；后端暂无试算接口时保持 undefined，界面就不显示计数 */
  const matchedAccountCount = ref<number | undefined>(undefined);

  const accountDrawerVisible = ref(false);
  const accountDrawerTaskId = ref<number | null>(null);
  const accountDrawerTaskName = ref("");

  const hasRows = computed(() => rows.value.length > 0);

  async function load() {
    loading.value = true;
    try {
      const result = await listContactTasks({
        page: page.value,
        pageSize: pageSize.value,
        name: searchName.value.trim() || undefined,
        runStatus: searchRunStatus.value ?? undefined,
        createdAtStart: searchCreatedRange.value?.[0],
        createdAtEnd: searchCreatedRange.value?.[1]
      });
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      message((error as Error)?.message ?? "任务列表加载失败", {
        type: "error"
      });
    } finally {
      loading.value = false;
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
    matchedAccountCount.value = undefined;
    drawerVisible.value = true;
  }

  async function openDetail(id: number, mode: DrawerMode) {
    try {
      drawerDetail.value = await getContactTask(id);
      drawerMode.value = mode;
      matchedAccountCount.value = undefined;
      drawerVisible.value = true;
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

  /** 抽屉里改了筛选条件后回传，用于账号范围试算。 */
  function onFilterChange(_filter: AccountFilterForm) {
    // 后端暂未提供试算接口；保留钩子，接口就位后在这里补一次查询。
    void _filter;
    matchedAccountCount.value = undefined;
  }

  onMounted(load);

  return {
    rows,
    total,
    page,
    pageSize,
    loading,
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

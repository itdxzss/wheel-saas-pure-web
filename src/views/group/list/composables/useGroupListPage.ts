import {
  computed,
  onMounted,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteGroups,
  listGroups,
  type GroupListQuery,
  type GroupListRow
} from "@/api/group";

export interface GroupSearchForm {
  keyword: string;
  status: string;
  sourceFileName: string;
  origin: "" | number;
  membershipState: "" | number;
}

export interface GroupListPageState {
  closeMemberDrawer: () => void;
  deleteGroup: (row: GroupListRow) => Promise<void>;
  deleteSelectedGroups: () => Promise<void>;
  drawerGroup: Ref<GroupListRow | null>;
  drawerOpen: Ref<boolean>;
  loading: Ref<boolean>;
  onDrawerRefresh: () => Promise<void>;
  onSelectionChange: (selection: GroupListRow[]) => void;
  openJoinTask: (row: GroupListRow) => void;
  openMemberDrawer: (row: GroupListRow) => void;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshGroups: () => Promise<void>;
  resetSearchForm: () => void;
  rows: Ref<GroupListRow[]>;
  searchForm: GroupSearchForm;
  searchGroups: () => void;
  selectedCount: ComputedRef<number>;
  total: Ref<number>;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (
    error as { response?: { data?: { message?: unknown; msg?: unknown } } }
  )?.response?.data;
  const message = data?.message ?? data?.msg ?? (error as Error)?.message;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
}

function groupName(row: GroupListRow): string {
  return row.groupName || row.waSubject || `群组 ${row.id}`;
}

function buildQuery(
  searchForm: GroupSearchForm,
  page: number,
  pageSize: number
): GroupListQuery {
  const keyword = searchForm.keyword.trim();
  const sourceFileName = searchForm.sourceFileName.trim();
  return {
    page,
    pageSize,
    keyword: keyword || undefined,
    status: searchForm.status || undefined,
    sourceFileName: sourceFileName || undefined,
    origin: searchForm.origin || undefined,
    membershipState: searchForm.membershipState || undefined
  };
}

export function useGroupListPage(): GroupListPageState {
  const router = useRouter();
  const searchForm = reactive<GroupSearchForm>({
    keyword: "",
    status: "",
    sourceFileName: "",
    origin: "",
    membershipState: ""
  });
  const rows = ref<GroupListRow[]>([]);
  const selectedRows = ref<GroupListRow[]>([]);
  const drawerGroup = ref<GroupListRow | null>(null);
  const drawerOpen = ref(false);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const selectedCount = computed(() => selectedRows.value.length);

  async function refreshGroups(): Promise<void> {
    selectedRows.value = [];
    loading.value = true;
    try {
      const response = await listGroups(
        buildQuery(searchForm, page.value, pageSize.value)
      );
      rows.value = response.list ?? [];
      total.value = response.total ?? 0;
    } catch (error) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(apiErrorMessage(error, "群组列表加载失败，请稍后重试"));
    } finally {
      loading.value = false;
    }
  }

  function searchGroups(): void {
    page.value = 1;
    void refreshGroups();
  }

  function resetSearchForm(): void {
    searchForm.keyword = "";
    searchForm.status = "";
    searchForm.sourceFileName = "";
    searchForm.origin = "";
    searchForm.membershipState = "";
    searchGroups();
  }

  function onSelectionChange(selection: GroupListRow[]): void {
    selectedRows.value = selection;
  }

  async function confirmDelete(rowsToDelete: GroupListRow[]): Promise<boolean> {
    const hasAvailable = rowsToDelete.some(row => row.status === "AVAILABLE");
    const names = rowsToDelete
      .slice(0, 3)
      .map(row => `「${groupName(row)}」`)
      .join("、");
    const suffix = rowsToDelete.length > 3 ? "等" : "";
    const message = hasAvailable
      ? `当前所选数据中存在可用群组，确认删除 ${names}${suffix} ${rowsToDelete.length} 条群组吗？`
      : `确认删除 ${names}${suffix} ${rowsToDelete.length} 条群组吗？`;
    try {
      await ElMessageBox.confirm(message, "删除群组确认", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
      return true;
    } catch {
      return false;
    }
  }

  async function deleteRows(rowsToDelete: GroupListRow[]): Promise<void> {
    if (rowsToDelete.length === 0) return;
    const confirmed = await confirmDelete(rowsToDelete);
    if (!confirmed) return;
    try {
      await batchDeleteGroups(rowsToDelete.map(row => row.id));
      ElMessage.success("群组已删除");
      await refreshGroups();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "群组删除失败，请稍后重试"));
    }
  }

  async function deleteSelectedGroups(): Promise<void> {
    await deleteRows(selectedRows.value);
  }

  async function deleteGroup(row: GroupListRow): Promise<void> {
    await deleteRows([row]);
  }

  function openMemberDrawer(row: GroupListRow): void {
    drawerGroup.value = row;
    drawerOpen.value = true;
  }

  function closeMemberDrawer(): void {
    drawerOpen.value = false;
    drawerGroup.value = null;
  }

  function openJoinTask(row: GroupListRow): void {
    void router.push({
      path: "/task/join",
      query: {
        from: "group-list",
        groupId: String(row.id),
        groupName: groupName(row),
        link: row.url || ""
      }
    });
  }

  async function onDrawerRefresh(): Promise<void> {
    await refreshGroups();
  }

  onMounted(() => {
    void refreshGroups();
  });

  return {
    closeMemberDrawer,
    deleteGroup,
    deleteSelectedGroups,
    drawerGroup,
    drawerOpen,
    loading,
    onDrawerRefresh,
    onSelectionChange,
    openJoinTask,
    openMemberDrawer,
    page,
    pageSize,
    refreshGroups,
    resetSearchForm,
    rows,
    searchForm,
    searchGroups,
    selectedCount,
    total
  };
}

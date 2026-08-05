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
  batchAssignGroupFolder,
  batchDeleteGroups,
  listGroups,
  type GroupListRow
} from "@/api/group";
import {
  listGroupFolderOptions,
  type GroupFolderOption
} from "@/api/group-folder";
import {
  listGroupCountryOptions,
  type IpCountryOption
} from "@/api/resource-ip";
import { apiErrorMessage } from "@/utils/api-error";
import {
  emptyHistoricalFilter,
  toGroupListQuery,
  type GroupType,
  type HistoricalFilterValue
} from "../group-list-filters";

export interface GroupSearchForm {
  keyword: string;
  status: string;
  folderFilter: "" | "UNASSIGNED" | number;
  groupType: GroupType;
  availableAdmin: "" | "YES" | "NO";
}

export interface GroupListPageState {
  assignFolderDialogOpen: Ref<boolean>;
  assigningFolder: Ref<boolean>;
  assignSelectedFolder: (folderId: number | null) => Promise<void>;
  closeMemberDrawer: () => void;
  deleteGroup: (row: GroupListRow) => Promise<void>;
  deleteSelectedGroups: () => Promise<void>;
  drawerGroup: Ref<GroupListRow | null>;
  drawerOpen: Ref<boolean>;
  folderOptions: Ref<GroupFolderOption[]>;
  folderOptionsLoading: Ref<boolean>;
  countryOptions: Ref<IpCountryOption[]>;
  countryOptionsLoading: Ref<boolean>;
  groupFolderManageOpen: Ref<boolean>;
  historicalApplied: HistoricalFilterValue;
  historicalAppliedCount: ComputedRef<number>;
  historicalDraft: HistoricalFilterValue;
  historicalDrawerOpen: Ref<boolean>;
  applyHistoricalFilter: () => void;
  clearHistoricalDraft: () => void;
  closeHistoricalFilter: () => void;
  openHistoricalFilter: () => void;
  queryHistoricalFilter: () => Promise<void>;
  loading: Ref<boolean>;
  onGroupFoldersChanged: (deletedFolderIds: number[]) => Promise<void>;
  onDrawerRefresh: () => Promise<void>;
  onSelectionChange: (selection: GroupListRow[]) => void;
  openAssignFolder: () => void;
  openGroupFolderManage: () => void;
  openJoinTask: (row: GroupListRow) => void;
  openMemberDrawer: (row: GroupListRow) => void;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshGroups: () => Promise<void>;
  reloadFolderOptions: () => Promise<void>;
  resetSearchForm: () => void;
  rows: Ref<GroupListRow[]>;
  searchForm: GroupSearchForm;
  searchGroups: () => void;
  selectedCount: ComputedRef<number>;
  total: Ref<number>;
}

function groupName(row: GroupListRow): string {
  return row.groupName || row.waSubject || `群组 ${row.id}`;
}

export function useGroupListPage(): GroupListPageState {
  const router = useRouter();
  const searchForm = reactive<GroupSearchForm>({
    keyword: "",
    status: "",
    folderFilter: "",
    groupType: "",
    availableAdmin: ""
  });
  const historicalApplied = reactive<HistoricalFilterValue>(
    emptyHistoricalFilter()
  );
  const historicalDraft = reactive<HistoricalFilterValue>(
    emptyHistoricalFilter()
  );
  const rows = ref<GroupListRow[]>([]);
  const folderOptions = ref<GroupFolderOption[]>([]);
  const countryOptions = ref<IpCountryOption[]>([]);
  const selectedRows = ref<GroupListRow[]>([]);
  const drawerGroup = ref<GroupListRow | null>(null);
  const drawerOpen = ref(false);
  const assignFolderDialogOpen = ref(false);
  const groupFolderManageOpen = ref(false);
  const assigningFolder = ref(false);
  const folderOptionsLoading = ref(false);
  const countryOptionsLoading = ref(false);
  const historicalDrawerOpen = ref(false);
  const loading = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const selectedCount = computed(() => selectedRows.value.length);
  const historicalAppliedCount = computed(
    () =>
      Object.values(historicalApplied).filter(
        value => value !== "" && value !== undefined
      ).length
  );

  async function refreshGroups(): Promise<void> {
    selectedRows.value = [];
    loading.value = true;
    try {
      const response = await listGroups(
        toGroupListQuery(
          searchForm,
          historicalApplied,
          page.value,
          pageSize.value
        )
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
    searchForm.folderFilter = "";
    searchForm.groupType = "";
    searchForm.availableAdmin = "";
    Object.assign(historicalApplied, emptyHistoricalFilter());
    Object.assign(historicalDraft, emptyHistoricalFilter());
    searchGroups();
  }

  function openHistoricalFilter(): void {
    Object.assign(historicalDraft, historicalApplied);
    historicalDrawerOpen.value = true;
    if (countryOptions.value.length === 0) void loadCountryOptions();
  }

  function closeHistoricalFilter(): void {
    historicalDrawerOpen.value = false;
    Object.assign(historicalDraft, historicalApplied);
  }

  function clearHistoricalDraft(): void {
    Object.assign(historicalDraft, emptyHistoricalFilter());
  }

  function applyHistoricalFilter(): void {
    Object.assign(historicalApplied, historicalDraft);
    historicalDrawerOpen.value = false;
  }

  async function queryHistoricalFilter(): Promise<void> {
    Object.assign(historicalApplied, historicalDraft);
    searchForm.groupType = "HISTORICAL";
    page.value = 1;
    await refreshGroups();
    historicalDrawerOpen.value = false;
  }

  async function loadCountryOptions(): Promise<void> {
    countryOptionsLoading.value = true;
    try {
      countryOptions.value = await listGroupCountryOptions();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "国家选项加载失败，请稍后重试"));
    } finally {
      countryOptionsLoading.value = false;
    }
  }

  async function loadFolderOptions(showError = true): Promise<void> {
    folderOptionsLoading.value = true;
    try {
      folderOptions.value = await listGroupFolderOptions();
    } catch (error) {
      if (showError) {
        ElMessage.error(
          apiErrorMessage(error, "群组分组选项加载失败，请稍后重试")
        );
      }
    } finally {
      folderOptionsLoading.value = false;
    }
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

  function openAssignFolder(): void {
    if (selectedRows.value.length === 0) {
      ElMessage.warning("请先选择群组");
      return;
    }
    assignFolderDialogOpen.value = true;
    void reloadFolderOptions();
  }

  function openGroupFolderManage(): void {
    groupFolderManageOpen.value = true;
  }

  async function assignSelectedFolder(folderId: number | null): Promise<void> {
    const ids = selectedRows.value.map(row => row.id);
    if (ids.length === 0) return;
    assigningFolder.value = true;
    try {
      await batchAssignGroupFolder(ids, folderId);
      ElMessage.success(
        folderId == null ? "群组已转入未分组" : "群组分组已更新"
      );
      assignFolderDialogOpen.value = false;
      await refreshGroups();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量分组失败，请稍后重试"));
      await loadFolderOptions(false);
    } finally {
      assigningFolder.value = false;
    }
  }

  async function onGroupFoldersChanged(
    deletedFolderIds: number[]
  ): Promise<void> {
    await loadFolderOptions();
    if (
      typeof searchForm.folderFilter === "number" &&
      deletedFolderIds.includes(searchForm.folderFilter)
    ) {
      searchForm.folderFilter = "";
      page.value = 1;
    }
    await refreshGroups();
  }

  async function reloadFolderOptions(): Promise<void> {
    await loadFolderOptions();
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
    void loadFolderOptions();
    void loadCountryOptions();
  });

  return {
    assignFolderDialogOpen,
    assigningFolder,
    assignSelectedFolder,
    applyHistoricalFilter,
    clearHistoricalDraft,
    closeHistoricalFilter,
    closeMemberDrawer,
    deleteGroup,
    deleteSelectedGroups,
    drawerGroup,
    drawerOpen,
    countryOptions,
    countryOptionsLoading,
    folderOptions,
    folderOptionsLoading,
    groupFolderManageOpen,
    historicalApplied,
    historicalAppliedCount,
    historicalDraft,
    historicalDrawerOpen,
    loading,
    onGroupFoldersChanged,
    onDrawerRefresh,
    onSelectionChange,
    openAssignFolder,
    openGroupFolderManage,
    openHistoricalFilter,
    openJoinTask,
    openMemberDrawer,
    page,
    pageSize,
    queryHistoricalFilter,
    refreshGroups,
    reloadFolderOptions,
    resetSearchForm,
    rows,
    searchForm,
    searchGroups,
    selectedCount,
    total
  };
}

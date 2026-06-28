import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  type ComputedRef,
  type Ref
} from "vue";
import { ElMessage } from "element-plus";
import {
  createAccountImportTask,
  exportAccountImportTask,
  getAccountImportTask,
  listAccountImportTasks,
  uploadAccountImportZip,
  type AccountImportDetailRow,
  type AccountImportFailReason,
  type AccountImportTask,
  type ListAccountImportTasksParams
} from "@/api/account-import";
import {
  createAccountGroup,
  listAccountGroups,
  type AccountGroupApiRow,
  type AccountGroupWriteRequest
} from "@/api/account-group";
import { listTenantIpRegions } from "@/api/resource-ip";
import { AUTO_IP_MODE, importKindLabelMap } from "../constants";
import type {
  AccountImportDetailStatus,
  AccountImportExportKind,
  AccountImportSearchForm,
  AccountImportSubmitPayload
} from "../types";

export interface AccountImportPageState {
  accountGroups: Ref<AccountGroupApiRow[]>;
  changeDetailStatus: (value: AccountImportDetailStatus) => void;
  createImportAccountGroup: (
    data: AccountGroupWriteRequest
  ) => Promise<AccountGroupApiRow | null>;
  detailFailReasons: Ref<AccountImportFailReason[]>;
  detailFilter: Ref<AccountImportDetailStatus>;
  detailLoading: Ref<boolean>;
  detailPage: Ref<number>;
  detailPageSize: Ref<number>;
  detailRows: Ref<AccountImportDetailRow[]>;
  detailTask: Ref<AccountImportTask | null>;
  detailTotal: Ref<number>;
  exportTask: (
    row: AccountImportTask,
    kind: AccountImportExportKind
  ) => Promise<void>;
  exportingTaskId: Ref<number | null>;
  groupLoading: Ref<boolean>;
  ipRegionOptions: ComputedRef<string[]>;
  loadDetail: () => Promise<void>;
  loading: Ref<boolean>;
  openDetailDrawer: (row: AccountImportTask) => Promise<void>;
  page: Ref<number>;
  pageSize: Ref<number>;
  refreshAccountImportList: () => Promise<void>;
  resetSearchForm: () => void;
  rows: Ref<AccountImportTask[]>;
  searchAccountImports: () => void;
  searchForm: AccountImportSearchForm;
  showAdvancedSearch: Ref<boolean>;
  showDetailDrawer: Ref<boolean>;
  showImportDrawer: Ref<boolean>;
  submitImport: (payload: AccountImportSubmitPayload) => Promise<boolean>;
  submittingImport: Ref<boolean>;
  total: Ref<number>;
}

const POLL_MS = 4000;
const BOM = String.fromCharCode(0xfeff);

export function useAccountImportPage(): AccountImportPageState {
  const searchForm = reactive<AccountImportSearchForm>({
    keyword: "",
    importType: "",
    group: "",
    device: "",
    accountType: "",
    login: "",
    status: ""
  });
  const rows = ref<AccountImportTask[]>([]);
  const accountGroups = ref<AccountGroupApiRow[]>([]);
  const ipRegions = ref<string[]>([]);
  const loading = ref(false);
  const groupLoading = ref(false);
  const submittingImport = ref(false);
  const exportingTaskId = ref<number | null>(null);
  const showAdvancedSearch = ref(false);
  const showImportDrawer = ref(false);
  const showDetailDrawer = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const detailTask = ref<AccountImportTask | null>(null);
  const detailRows = ref<AccountImportDetailRow[]>([]);
  const detailFailReasons = ref<AccountImportFailReason[]>([]);
  const detailLoading = ref(false);
  const detailFilter = ref<AccountImportDetailStatus>("");
  const detailPage = ref(1);
  const detailPageSize = ref(10);
  const detailTotal = ref(0);
  let pollTimer: ReturnType<typeof setTimeout> | null = null;

  const ipRegionOptions = computed(() => [AUTO_IP_MODE, ...ipRegions.value]);

  function apiErrorMessage(error: unknown, fallback: string): string {
    const data = (
      error as { response?: { data?: { msg?: unknown; message?: unknown } } }
    )?.response?.data;
    const message = data?.msg ?? data?.message;
    return typeof message === "string" && message.trim()
      ? message.trim()
      : fallback;
  }

  function buildQuery(): ListAccountImportTasksParams {
    const query: ListAccountImportTasksParams = {
      page: page.value,
      pageSize: pageSize.value
    };
    if (searchForm.keyword.trim()) query.keyword = searchForm.keyword.trim();
    if (searchForm.importType) query.import_type = searchForm.importType;
    if (searchForm.group) query.group = searchForm.group;
    if (searchForm.device) query.device = searchForm.device;
    if (searchForm.accountType) query.account_type = searchForm.accountType;
    if (searchForm.login) query.login = searchForm.login;
    if (searchForm.status) query.status = searchForm.status;
    return query;
  }

  function clearPoll(): void {
    if (!pollTimer) return;
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  function schedulePollIfNeeded(): void {
    clearPoll();
    if (!rows.value.some(row => ["导入中", "进行中"].includes(row.status))) {
      return;
    }
    pollTimer = setTimeout(() => {
      void refreshAccountImportList();
    }, POLL_MS);
  }

  async function refreshAccountImportList(): Promise<void> {
    loading.value = true;
    try {
      const response = await listAccountImportTasks(buildQuery());
      rows.value = response.list ?? [];
      total.value = response.total ?? 0;
      schedulePollIfNeeded();
    } catch (error) {
      rows.value = [];
      total.value = 0;
      clearPoll();
      ElMessage.error(apiErrorMessage(error, "账号导入任务加载失败"));
    } finally {
      loading.value = false;
    }
  }

  async function loadAccountGroups(): Promise<void> {
    groupLoading.value = true;
    try {
      const response = await listAccountGroups({ page: 1, pageSize: 500 });
      accountGroups.value = response.list ?? [];
    } catch (error) {
      accountGroups.value = [];
      ElMessage.warning(apiErrorMessage(error, "账号分组加载失败"));
    } finally {
      groupLoading.value = false;
    }
  }

  async function loadIpRegionOptions(): Promise<void> {
    try {
      ipRegions.value = await listTenantIpRegions();
    } catch (error) {
      ipRegions.value = [];
      ElMessage.warning(apiErrorMessage(error, "IP 区域加载失败"));
    }
  }

  function searchAccountImports(): void {
    page.value = 1;
    void refreshAccountImportList();
  }

  function resetSearchForm(): void {
    searchForm.keyword = "";
    searchForm.importType = "";
    searchForm.group = "";
    searchForm.device = "";
    searchForm.accountType = "";
    searchForm.login = "";
    searchForm.status = "";
    searchAccountImports();
  }

  function selectedGroupName(groupId: number): string {
    return accountGroups.value.find(group => group.id === groupId)?.name ?? "";
  }

  function summarizeFailReasons(
    details: AccountImportDetailRow[]
  ): AccountImportFailReason[] {
    const counts = new Map<string, number>();
    details
      .filter(row => row.status !== "成功")
      .forEach(row => {
        const reason = row.reason || "导入失败";
        counts.set(reason, (counts.get(reason) ?? 0) + 1);
      });
    return Array.from(counts, ([reason, count]) => ({ reason, count }));
  }

  function appendAccountGroup(group: AccountGroupApiRow): void {
    if (accountGroups.value.some(item => item.id === group.id)) return;
    accountGroups.value = [...accountGroups.value, group];
  }

  async function createImportAccountGroup(
    data: AccountGroupWriteRequest
  ): Promise<AccountGroupApiRow | null> {
    try {
      const response = await createAccountGroup(data);
      appendAccountGroup(response);
      ElMessage.success("分组已新增");
      return response;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "新增分组失败"));
      return null;
    }
  }

  async function submitImport(
    payload: AccountImportSubmitPayload
  ): Promise<boolean> {
    const groupName = selectedGroupName(payload.groupId);
    if (!groupName) {
      ElMessage.warning("请选择账号分组");
      return false;
    }
    submittingImport.value = true;
    try {
      if (payload.importKind === "json") {
        if (!payload.file) {
          ElMessage.warning("请上传 JSON号 ZIP 包");
          return false;
        }
        await uploadAccountImportZip({
          import_type: importKindLabelMap[payload.importKind],
          group: groupName,
          group_id: payload.groupId,
          device: payload.device,
          account_type: payload.accountType,
          ip_mode: payload.ipMode,
          remark: payload.remark || null,
          file: payload.file
        });
      } else {
        await createAccountImportTask({
          import_type: importKindLabelMap[payload.importKind],
          filename:
            payload.filename ||
            `粘贴${importKindLabelMap[payload.importKind]}_${Date.now()}.txt`,
          group: groupName,
          group_id: payload.groupId,
          device: payload.device,
          account_type: payload.accountType,
          service: null,
          ip_mode: payload.ipMode,
          remark: payload.remark || null,
          text: payload.text ?? ""
        });
      }
      ElMessage.success("已创建账号导入任务");
      await refreshAccountImportList();
      return true;
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "账号导入任务创建失败"));
      return false;
    } finally {
      submittingImport.value = false;
    }
  }

  async function openDetailDrawer(row: AccountImportTask): Promise<void> {
    detailTask.value = row;
    detailRows.value = [];
    detailFailReasons.value = [];
    detailFilter.value = "";
    detailPage.value = 1;
    detailTotal.value = 0;
    showDetailDrawer.value = true;
    await loadDetail();
  }

  async function loadDetail(): Promise<void> {
    if (!detailTask.value?.id) return;
    detailLoading.value = true;
    try {
      const params = {
        page: detailPage.value,
        page_size: detailPageSize.value,
        ...(detailFilter.value ? { status: detailFilter.value } : {})
      };
      const response = await getAccountImportTask(detailTask.value.id, params);
      detailRows.value = response.list ?? [];
      detailTotal.value = response.total ?? 0;
      detailFailReasons.value = summarizeFailReasons(detailRows.value);
    } catch (error) {
      detailRows.value = [];
      detailTotal.value = 0;
      detailFailReasons.value = [];
      ElMessage.error(apiErrorMessage(error, "导入明细加载失败"));
    } finally {
      detailLoading.value = false;
    }
  }

  function changeDetailStatus(value: AccountImportDetailStatus): void {
    detailFilter.value = value;
    detailPage.value = 1;
    void loadDetail();
  }

  function downloadCsv(filename: string, content: string): void {
    // 浏览器侧文件下载只在这里触碰 DOM，并在点击后立即清理节点和 URL。
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function exportTask(
    row: AccountImportTask,
    kind: AccountImportExportKind
  ): Promise<void> {
    exportingTaskId.value = row.id;
    try {
      const response = await exportAccountImportTask(row.id, kind);
      if (!response.content) {
        ElMessage.warning("当前任务暂无可导出的内容");
        return;
      }
      downloadCsv(
        response.filename || `account-import-${row.id}-${kind}.csv`,
        response.content
      );
      ElMessage.success("导出文件已生成");
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "导出失败"));
    } finally {
      exportingTaskId.value = null;
    }
  }

  onMounted(() => {
    void loadAccountGroups();
    void loadIpRegionOptions();
    void refreshAccountImportList();
  });

  onBeforeUnmount(() => {
    clearPoll();
  });

  return {
    accountGroups,
    changeDetailStatus,
    createImportAccountGroup,
    detailFailReasons,
    detailFilter,
    detailLoading,
    detailPage,
    detailPageSize,
    detailRows,
    detailTask,
    detailTotal,
    exportTask,
    exportingTaskId,
    groupLoading,
    ipRegionOptions,
    loadDetail,
    loading,
    openDetailDrawer,
    page,
    pageSize,
    refreshAccountImportList,
    resetSearchForm,
    rows,
    searchAccountImports,
    searchForm,
    showAdvancedSearch,
    showDetailDrawer,
    showImportDrawer,
    submitImport,
    submittingImport,
    total
  };
}

import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createDataPackage,
  deleteDataPackage,
  importDataPackagePhones,
  listDataPackageCountries,
  listDataPackagePhones,
  listDataPackages,
  updateDataPackage,
  type DataPackageCountryOption,
  type DataPackageCreateInput,
  type DataPackageImportInput,
  type DataPackageImportMode,
  type DataPackageImportResult,
  type DataPackageListItem,
  type DataPackagePhoneItem,
  type DataPackagePoolStatus
} from "@/api/hyperlink-data-package";
import { apiErrorMessage } from "@/utils/api-error";

export interface DataPackageSearchForm {
  name: string;
  createdRange: [Date, Date] | null;
  countryIso2s: string[];
}

export interface DataPackagePhoneFilters {
  phone: string;
  poolStatus: DataPackagePoolStatus | "";
  countryIso2: string;
}

export interface DataPackageTableColumn {
  label: string;
  prop: string;
  minWidth?: number;
  width?: number;
  fixed?: "left" | "right";
}

export const dataPackagePoolStatusOptions: Array<{
  label: string;
  value: DataPackagePoolStatus;
}> = [
  { label: "未使用", value: "UNUSED" },
  { label: "已领取", value: "CLAIMED" },
  { label: "发送成功（单钩）", value: "SENT" },
  { label: "已送达", value: "DELIVERED" },
  { label: "可重试失败", value: "RETRYABLE_FAILED" },
  { label: "未注册", value: "UNREGISTERED" }
];

export function createDataPackageTableColumns(): DataPackageTableColumn[] {
  return [
    { label: "数据包名称", prop: "name", minWidth: 180, fixed: "left" },
    { label: "国家", prop: "countries", minWidth: 150 },
    { label: "总数", prop: "metrics.totalCount", width: 105 },
    { label: "未使用", prop: "metrics.unusedCount", width: 105 },
    { label: "已使用", prop: "metrics.usedCount", width: 105 },
    { label: "发送成功", prop: "metrics.sentCount", width: 105 },
    { label: "已送达", prop: "metrics.deliveredCount", width: 105 },
    { label: "失败", prop: "metrics.failedCount", width: 95 },
    { label: "未注册", prop: "metrics.unregisteredCount", width: 95 },
    { label: "点击 UV", prop: "metrics.clickUvCount", width: 100 },
    { label: "创建时间", prop: "createdAt", width: 180 }
  ];
}

export function dataPackageCountryLabel(
  countryIso2: string | null,
  options: DataPackageCountryOption[]
): string {
  const option = options.find(item =>
    countryIso2 === null
      ? item.value === "UNKNOWN" || item.countryIso2 === null
      : item.countryIso2 === countryIso2
  );
  if (option) {
    return option.countryIso2
      ? `${option.nameZh} (${option.countryIso2})`
      : option.nameZh;
  }
  return countryIso2 ?? "未识别";
}

export function dataPackagePoolStatusLabel(
  status: DataPackagePoolStatus
): string {
  return (
    dataPackagePoolStatusOptions.find(option => option.value === status)
      ?.label ?? status
  );
}

export function dataPackagePoolStatusTagType(
  status: DataPackagePoolStatus
): "success" | "warning" | "danger" | "info" | "primary" {
  if (status === "UNUSED") return "success";
  if (status === "CLAIMED" || status === "SENT") return "warning";
  if (status === "DELIVERED") return "primary";
  if (status === "RETRYABLE_FAILED" || status === "UNREGISTERED") {
    return "danger";
  }
  return "info";
}

export function useDataPackagePage() {
  const columns = createDataPackageTableColumns();
  const rows = ref<DataPackageListItem[]>([]);
  const countries = ref<DataPackageCountryOption[]>([]);
  const loading = ref(false);
  const countryLoading = ref(false);
  const errorMessage = ref("");
  const countryErrorMessage = ref("");
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const searchForm = ref<DataPackageSearchForm>({
    name: "",
    createdRange: null,
    countryIso2s: []
  });

  const formVisible = ref(false);
  const editingPackage = ref<DataPackageListItem | null>(null);
  const saving = ref(false);

  const importVisible = ref(false);
  const importTarget = ref<DataPackageListItem | null>(null);
  const importMode = ref<DataPackageImportMode>("APPEND");
  const importResult = ref<DataPackageImportResult | null>(null);
  const importing = ref(false);

  const phoneDrawerVisible = ref(false);
  const phoneTarget = ref<DataPackageListItem | null>(null);
  const phoneRows = ref<DataPackagePhoneItem[]>([]);
  const phoneLoading = ref(false);
  const phoneErrorMessage = ref("");
  const phonePage = ref(1);
  const phonePageSize = ref(50);
  const phoneTotal = ref(0);
  const phoneFilters = ref<DataPackagePhoneFilters>({
    phone: "",
    poolStatus: "",
    countryIso2: ""
  });

  async function refreshDataPackages(): Promise<void> {
    loading.value = true;
    try {
      const range = searchForm.value.createdRange;
      const result = await listDataPackages({
        page: page.value,
        pageSize: pageSize.value,
        name: searchForm.value.name,
        createdFrom: range?.[0].getTime(),
        createdTo: range?.[1].getTime(),
        countryIso2s: searchForm.value.countryIso2s,
        forTask: false
      });
      rows.value = result.list;
      page.value = result.page;
      pageSize.value = result.pageSize;
      total.value = result.total;
      errorMessage.value = "";
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "数据包列表加载失败");
      ElMessage.error(errorMessage.value);
    } finally {
      loading.value = false;
    }
  }

  async function refreshCountryOptions(): Promise<void> {
    countryLoading.value = true;
    try {
      countries.value = await listDataPackageCountries();
      countryErrorMessage.value = "";
    } catch (error) {
      countries.value = [];
      countryErrorMessage.value = apiErrorMessage(
        error,
        "国家筛选候选加载失败"
      );
      ElMessage.error(countryErrorMessage.value);
    } finally {
      countryLoading.value = false;
    }
  }

  async function initialize(): Promise<void> {
    await Promise.all([refreshDataPackages(), refreshCountryOptions()]);
  }

  async function searchDataPackages(): Promise<void> {
    page.value = 1;
    await refreshDataPackages();
  }

  async function resetSearchForm(): Promise<void> {
    searchForm.value = { name: "", createdRange: null, countryIso2s: [] };
    page.value = 1;
    await refreshDataPackages();
  }

  function openCreateForm(): void {
    editingPackage.value = null;
    formVisible.value = true;
  }

  function openEditForm(row: DataPackageListItem): void {
    editingPackage.value = row;
    formVisible.value = true;
  }

  async function saveMetadata(input: DataPackageCreateInput): Promise<void> {
    saving.value = true;
    try {
      if (editingPackage.value) {
        await updateDataPackage(editingPackage.value.id, {
          ...input,
          version: editingPackage.value.version
        });
      } else {
        await createDataPackage(input);
      }
      ElMessage.success(editingPackage.value ? "数据包已更新" : "数据包已创建");
      formVisible.value = false;
      await refreshDataPackages();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "数据包保存失败"));
    } finally {
      saving.value = false;
    }
  }

  function openImport(
    row: DataPackageListItem,
    mode: DataPackageImportMode
  ): void {
    importTarget.value = row;
    importMode.value = mode;
    importResult.value = null;
    importVisible.value = true;
  }

  async function submitImport(input: DataPackageImportInput): Promise<void> {
    if (!importTarget.value) return;
    importing.value = true;
    try {
      importResult.value = await importDataPackagePhones(
        importTarget.value.id,
        input
      );
      ElMessage.success("号码导入完成");
      await refreshDataPackages();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "号码导入失败"));
    } finally {
      importing.value = false;
    }
  }

  async function refreshPhoneRows(): Promise<void> {
    if (!phoneTarget.value) return;
    phoneLoading.value = true;
    try {
      const result = await listDataPackagePhones(phoneTarget.value.id, {
        page: phonePage.value,
        pageSize: phonePageSize.value,
        phone: phoneFilters.value.phone,
        poolStatus: phoneFilters.value.poolStatus || undefined,
        countryIso2: phoneFilters.value.countryIso2
      });
      phoneRows.value = result.list;
      phonePage.value = result.page;
      phonePageSize.value = result.pageSize;
      phoneTotal.value = result.total;
      phoneErrorMessage.value = "";
    } catch (error) {
      phoneRows.value = [];
      phoneTotal.value = 0;
      phoneErrorMessage.value = apiErrorMessage(error, "号码明细加载失败");
      ElMessage.error(phoneErrorMessage.value);
    } finally {
      phoneLoading.value = false;
    }
  }

  async function openPhoneDrawer(row: DataPackageListItem): Promise<void> {
    phoneTarget.value = row;
    phonePage.value = 1;
    phonePageSize.value = 50;
    phoneFilters.value = { phone: "", poolStatus: "", countryIso2: "" };
    phoneDrawerVisible.value = true;
    await refreshPhoneRows();
  }

  async function searchPhoneRows(): Promise<void> {
    const phone = phoneFilters.value.phone.trim();
    if (phone && !/^\d{1,20}$/.test(phone)) {
      ElMessage.warning("手机号筛选只能输入最多 20 位数字");
      return;
    }
    phonePage.value = 1;
    await refreshPhoneRows();
  }

  async function resetPhoneFilters(): Promise<void> {
    phoneFilters.value = { phone: "", poolStatus: "", countryIso2: "" };
    phonePage.value = 1;
    await refreshPhoneRows();
  }

  async function removeDataPackage(row: DataPackageListItem): Promise<void> {
    try {
      await ElMessageBox.confirm(
        `确认删除数据包“${row.name}”吗？删除后不可用于新任务。`,
        "删除确认",
        { type: "warning" }
      );
      await deleteDataPackage(row.id);
      ElMessage.success("数据包已删除");
      await refreshDataPackages();
    } catch (error) {
      if (error === "cancel" || error === "close") return;
      ElMessage.error(apiErrorMessage(error, "数据包删除失败"));
    }
  }

  return {
    columns,
    countries,
    countryErrorMessage,
    countryLoading,
    editingPackage,
    errorMessage,
    formVisible,
    importMode,
    importResult,
    importTarget,
    importVisible,
    importing,
    loading,
    page,
    pageSize,
    phoneDrawerVisible,
    phoneErrorMessage,
    phoneFilters,
    phoneLoading,
    phonePage,
    phonePageSize,
    phoneRows,
    phoneTarget,
    phoneTotal,
    rows,
    saving,
    searchForm,
    total,
    initialize,
    openCreateForm,
    openEditForm,
    openImport,
    openPhoneDrawer,
    refreshCountryOptions,
    refreshDataPackages,
    refreshPhoneRows,
    removeDataPackage,
    resetPhoneFilters,
    resetSearchForm,
    saveMetadata,
    searchDataPackages,
    searchPhoneRows,
    submitImport
  };
}

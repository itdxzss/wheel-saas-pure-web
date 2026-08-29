import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createDataPackage,
  deleteDataPackage,
  exportDataPackagePhones,
  exportDataPackagePhonesBatch,
  exportDataPackageClickRecords,
  importDataPackagePhones,
  listDataPackageCountries,
  listDataPackagePhones,
  listDataPackages,
  resetDataPackageFailed,
  updateDataPackage,
  type DataPackageCountryOption,
  type DataPackageCreateInput,
  type DataPackageImportInput,
  type DataPackageImportMode,
  type DataPackageClickExportFormat,
  type DataPackageListItem,
  type DataPackagePhoneItem,
  type DataPackageUsageStatus
} from "@/api/hyperlink-data-package";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";

export interface DataPackageSearchForm {
  name: string;
  createdRange: [Date, Date] | null;
  minUvPercent: number | undefined;
  maxUvPercent: number | undefined;
  countryIso2s: string[];
}

export interface DataPackagePhoneFilters {
  phone: string;
}

export interface DataPackageTableColumn {
  label: string;
  prop: string;
  hide?: boolean;
  minWidth?: number;
  width?: number;
  fixed?: "left" | "right";
}

export interface DataPackageExportOption {
  label: string;
  value: DataPackageUsageStatus;
}

export const dataPackageExportOptions: DataPackageExportOption[] = [
  { label: "全部号码", value: "all" },
  { label: "未使用号码", value: "unused" },
  { label: "发送成功号码", value: "success" },
  { label: "单钩号码", value: "single" },
  { label: "双钩号码", value: "double" },
  { label: "失败号码", value: "failed" },
  { label: "404 号码", value: "fail_404" }
];

const restrictedImportIso2s = new Set(["MY", "SG", "CN", "HK", "MO", "TW"]);

export function createDataPackageTableColumns(): DataPackageTableColumn[] {
  return [
    { label: "ID", prop: "id", width: 80, fixed: "left" },
    { label: "数据包", prop: "dataPackage", minWidth: 340, fixed: "left" },
    { label: "号码使用", prop: "phoneUsage", minWidth: 280 },
    { label: "投递漏斗", prop: "deliveryFunnel", minWidth: 250 },
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

export function dataPackageCountryFlag(countryIso2: string | null): string {
  const normalized = countryIso2?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return "🌐";
  return String.fromCodePoint(
    ...[...normalized].map(letter => 127397 + letter.charCodeAt(0))
  );
}

export function retryableFailureCount(row: DataPackageListItem): number {
  return Math.max(0, row.metrics.failedCount - row.metrics.unregisteredCount);
}

export function dataPackageImportBlocked(row: DataPackageListItem): boolean {
  return row.countries.some(
    countryIso2 => countryIso2 && restrictedImportIso2s.has(countryIso2)
  );
}

export function percentage(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0.00%";
  return `${((numerator * 100) / denominator).toFixed(2)}%`;
}

export function useDataPackagePage() {
  const columns = createDataPackageTableColumns();
  const rows = ref<DataPackageListItem[]>([]);
  const selectedRows = ref<DataPackageListItem[]>([]);
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
    minUvPercent: undefined,
    maxUvPercent: undefined,
    countryIso2s: []
  });

  const formVisible = ref(false);
  const editingPackage = ref<DataPackageListItem | null>(null);
  const saving = ref(false);

  const importVisible = ref(false);
  const importTarget = ref<DataPackageListItem | null>(null);
  const importMode = ref<DataPackageImportMode>("APPEND");
  const importing = ref(false);

  const phoneDrawerVisible = ref(false);
  const phoneTarget = ref<DataPackageListItem | null>(null);
  const phoneRows = ref<DataPackagePhoneItem[]>([]);
  const phoneLoading = ref(false);
  const phoneErrorMessage = ref("");
  const phonePage = ref(1);
  const phonePageSize = ref(50);
  const phoneTotal = ref(0);
  const phoneFilters = ref<DataPackagePhoneFilters>({ phone: "" });

  const visitTrendVisible = ref(false);
  const visitTarget = ref<DataPackageListItem | null>(null);
  const clickAnalysisVisible = ref(false);

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
        minUvPercent: searchForm.value.minUvPercent,
        maxUvPercent: searchForm.value.maxUvPercent,
        countryIso2s: searchForm.value.countryIso2s,
        forTask: false
      });
      rows.value = result.list;
      selectedRows.value = [];
      page.value = result.page;
      pageSize.value = result.pageSize;
      total.value = result.total;
      errorMessage.value = "";
    } catch (error) {
      rows.value = [];
      selectedRows.value = [];
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
    const { minUvPercent, maxUvPercent } = searchForm.value;
    if (
      minUvPercent !== undefined &&
      maxUvPercent !== undefined &&
      minUvPercent > maxUvPercent
    ) {
      ElMessage.warning("UV 占比最小值不能大于最大值");
      return;
    }
    page.value = 1;
    await refreshDataPackages();
  }

  async function resetSearchForm(): Promise<void> {
    searchForm.value = {
      name: "",
      createdRange: null,
      minUvPercent: undefined,
      maxUvPercent: undefined,
      countryIso2s: []
    };
    page.value = 1;
    await refreshDataPackages();
  }

  function setSelectedRows(selection: DataPackageListItem[]): void {
    selectedRows.value = selection;
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
    mode: DataPackageImportMode = "APPEND"
  ): void {
    if (dataPackageImportBlocked(row)) {
      ElMessage.warning("该数据包主要国家禁止上传（导入）号码");
      return;
    }
    importTarget.value = row;
    importMode.value = mode;
    importVisible.value = true;
  }

  async function submitImport(input: DataPackageImportInput): Promise<void> {
    if (!importTarget.value) return;
    importing.value = true;
    try {
      await importDataPackagePhones(importTarget.value.id, input);
      importVisible.value = false;
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
        phone: phoneFilters.value.phone
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
    phoneFilters.value = { phone: "" };
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
    phoneFilters.value = { phone: "" };
    phonePage.value = 1;
    await refreshPhoneRows();
  }

  async function exportOne(
    row: DataPackageListItem,
    usageStatus: DataPackageUsageStatus
  ): Promise<void> {
    try {
      const result = await exportDataPackagePhones(row.id, usageStatus);
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(`已导出 ${result.exportedCount} 个号码`);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "号码导出失败"));
    }
  }

  async function exportSelected(
    usageStatus: DataPackageUsageStatus
  ): Promise<void> {
    if (selectedRows.value.length === 0) {
      ElMessage.warning("请先选择要导出的数据包");
      return;
    }
    try {
      const result = await exportDataPackagePhonesBatch(
        selectedRows.value.map(row => row.id),
        usageStatus
      );
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(`已导出 ${result.exportedCount} 个号码`);
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量导出失败"));
    }
  }

  async function resetFailed(row: DataPackageListItem): Promise<void> {
    const retryable = retryableFailureCount(row);
    if (retryable <= 0) {
      ElMessage.info("当前数据包没有可重置的失败号码");
      return;
    }
    try {
      await ElMessageBox.confirm(
        `确认将“${row.name}”中的 ${retryable} 个可重试失败号码恢复为未使用吗？`,
        "重置失败号码",
        { type: "warning" }
      );
      const resetCount = await resetDataPackageFailed(row.id);
      ElMessage.success(`已重置 ${resetCount} 个失败号码`);
      await refreshDataPackages();
    } catch (error) {
      if (error === "cancel" || error === "close") return;
      ElMessage.error(apiErrorMessage(error, "失败号码重置失败"));
    }
  }

  function openVisitTrend(row: DataPackageListItem): void {
    visitTarget.value = row;
    visitTrendVisible.value = true;
  }

  function openClickAnalysis(): void {
    clickAnalysisVisible.value = true;
  }

  async function exportClickRecords(
    format: DataPackageClickExportFormat
  ): Promise<void> {
    if (selectedRows.value.length === 0) {
      ElMessage.warning("请先选择要导出点击记录的数据包");
      return;
    }
    try {
      const result = await exportDataPackageClickRecords(
        selectedRows.value.map(row => row.id),
        format
      );
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(
        `已批量导出 ${selectedRows.value.length} 个数据包的点击记录（${format.toUpperCase()}）`
      );
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "点击记录导出失败"));
    }
  }

  function exportCurrentPageCsv(): void {
    const values = rows.value.map(row => [
      row.id,
      row.name,
      row.primaryCountryIso2 ?? "UNKNOWN",
      row.metrics.totalCount,
      row.metrics.unusedCount,
      row.metrics.usedCount,
      row.metrics.sentCount + row.metrics.deliveredCount,
      row.metrics.deliveredCount,
      row.metrics.clickUvCount,
      row.metrics.failedCount,
      row.metrics.unregisteredCount,
      new Date(row.createdAt).toISOString()
    ]);
    const csvRows = [
      [
        "ID",
        "数据包",
        "主要国家",
        "总数",
        "未使用",
        "已使用",
        "发送成功",
        "双钩",
        "点击UV",
        "发送失败",
        "未开通WS",
        "创建时间"
      ],
      ...values
    ];
    const csv = csvRows
      .map(row => row.map(value => csvCell(String(value))).join(","))
      .join("\r\n");
    downloadBlobFile(
      `超链数据包_第${page.value}页.csv`,
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=UTF-8" })
    );
    ElMessage.success(`已导出本页 ${values.length} 个数据包`);
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
    clickAnalysisVisible,
    columns,
    countries,
    countryErrorMessage,
    countryLoading,
    editingPackage,
    errorMessage,
    formVisible,
    importMode,
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
    selectedRows,
    total,
    visitTarget,
    visitTrendVisible,
    exportClickRecords,
    exportCurrentPageCsv,
    exportOne,
    exportSelected,
    initialize,
    openClickAnalysis,
    openCreateForm,
    openEditForm,
    openImport,
    openPhoneDrawer,
    openVisitTrend,
    refreshCountryOptions,
    refreshDataPackages,
    refreshPhoneRows,
    removeDataPackage,
    resetFailed,
    resetPhoneFilters,
    resetSearchForm,
    saveMetadata,
    searchDataPackages,
    searchPhoneRows,
    setSelectedRows,
    submitImport
  };
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

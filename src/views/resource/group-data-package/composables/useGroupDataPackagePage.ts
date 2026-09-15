import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createGroupDataPackage,
  updateGroupDataPackage,
  importGroupDataPackage,
  deleteGroupDataPackage,
  listGroupDataPackages,
  listGroupDataPackageCountries,
  resetGroupDataPackageFailed,
  exportGroupDataPackage,
  exportGroupDataPackages,
  type GroupDataPackage,
  type GroupDataPackageCountry,
  type GroupDataPackageMetadata,
  type GroupDataPackageImportInput,
  type GroupDataPackageImportResult,
  type GroupDataPackageExportStatus,
  type GroupDataPackageExportFormat
} from "@/api/group-data-package";
import { apiErrorMessage, isRequestTimeout } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import { formatEpochMillis } from "@/utils/time";
import {
  businessLabel,
  continentLabel,
  packageCsvCell,
  retryableCount,
  sumPackageMetrics,
  type GroupPackageSearch,
  type PackageAction
} from "../domain/package-display";

function emptySearch(): GroupPackageSearch {
  return {
    name: "",
    countryIso2: "",
    continent: "",
    usageBusiness: "",
    createdRange: null
  };
}

export function useGroupDataPackagePage() {
  const rows = ref<GroupDataPackage[]>([]);
  const selected = ref<GroupDataPackage[]>([]);
  const countries = ref<GroupDataPackageCountry[]>([]);
  const searchForm = ref(emptySearch());
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const loading = ref(false);
  const countryLoading = ref(false);
  const errorMessage = ref("");
  const countryError = ref("");
  const busyId = ref<number | null>(null);
  const batchExporting = ref(false);
  const formVisible = ref(false);
  const editing = ref<GroupDataPackage | null>(null);
  const saving = ref(false);
  const importVisible = ref(false);
  const importTarget = ref<GroupDataPackage | null>(null);
  const importing = ref(false);
  const importError = ref("");
  const importResult = ref<GroupDataPackageImportResult | null>(null);
  const resultVisible = ref(false);
  const detailVisible = ref(false);
  const detailTarget = ref<GroupDataPackage | null>(null);
  const detailTab = ref<"phones" | "imports">("phones");
  const selectedMetrics = computed(() => sumPackageMetrics(selected.value));
  const pageMetrics = computed(() => sumPackageMetrics(rows.value));
  const emptyCount = computed(
    () => rows.value.filter(row => row.metrics.totalCount === 0).length
  );
  let requestVersion = 0;

  async function refresh(): Promise<void> {
    const version = ++requestVersion;
    loading.value = true;
    errorMessage.value = "";
    selected.value = [];
    try {
      const form = searchForm.value;
      const result = await listGroupDataPackages({
        page: page.value,
        pageSize: pageSize.value,
        name: form.name,
        countryIso2: form.countryIso2,
        continent: form.continent,
        usageBusiness: form.usageBusiness,
        createdFrom: form.createdRange?.[0].getTime(),
        createdTo: form.createdRange?.[1].getTime()
      });
      if (version !== requestVersion) return;
      rows.value = result.list;
      total.value = result.total;
      if (!rows.value.length && total.value > 0 && page.value > 1) {
        page.value = Math.max(1, Math.ceil(total.value / pageSize.value));
        await refresh();
      }
    } catch (error) {
      if (version !== requestVersion) return;
      errorMessage.value = apiErrorMessage(error, "拉群数据包加载失败");
      rows.value = [];
      total.value = 0;
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  async function refreshCountries(): Promise<void> {
    countryLoading.value = true;
    countryError.value = "";
    try {
      countries.value = await listGroupDataPackageCountries();
    } catch (error) {
      countryError.value = apiErrorMessage(error, "国家选项加载失败");
    } finally {
      countryLoading.value = false;
    }
  }

  async function initialize(): Promise<void> {
    await Promise.allSettled([refresh(), refreshCountries()]);
  }
  function search(): void {
    page.value = 1;
    void refresh();
  }
  function reset(): void {
    searchForm.value = emptySearch();
    search();
  }
  function create(): void {
    editing.value = null;
    formVisible.value = true;
  }
  function select(value: GroupDataPackage[]): void {
    selected.value = value;
  }

  async function save(input: GroupDataPackageMetadata): Promise<void> {
    if (saving.value) return;
    saving.value = true;
    try {
      if (editing.value)
        await updateGroupDataPackage(editing.value.id, {
          ...input,
          version: editing.value.version
        });
      else await createGroupDataPackage(input);
      formVisible.value = false;
      ElMessage.success(editing.value ? "数据包已更新" : "数据包已创建");
      await refresh();
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "数据包保存失败，请重试"));
    } finally {
      saving.value = false;
    }
  }

  async function submitImport(
    input: GroupDataPackageImportInput
  ): Promise<void> {
    if (!importTarget.value || importing.value) return;
    importing.value = true;
    importError.value = "";
    try {
      importResult.value = await importGroupDataPackage(
        importTarget.value.id,
        input
      );
      importVisible.value = false;
      resultVisible.value = true;
      await initialize();
    } catch (error) {
      importError.value = isRequestTimeout(error)
        ? "导入请求超时，结果尚未确认。请查看导入记录，确认结果后再操作。"
        : apiErrorMessage(error, "号码导入失败，请查看导入记录后重试");
      ElMessage.error(importError.value);
    } finally {
      importing.value = false;
    }
  }

  async function resetFailed(row: GroupDataPackage): Promise<void> {
    if (busyId.value !== null || retryableCount(row.metrics) <= 0) return;
    try {
      await ElMessageBox.confirm(
        `确认将「${row.name}」中 ${retryableCount(row.metrics).toLocaleString()} 个可重试失败号码恢复为未使用？隐私拒绝、未注册、待确认号码不会重置；如存在活动任务占用，操作将被拒绝。`,
        "重置失败号码",
        {
          type: "warning",
          confirmButtonText: "确认重置",
          cancelButtonText: "取消"
        }
      );
      busyId.value = row.id;
      const count = await resetGroupDataPackageFailed(row.id);
      ElMessage.success(`已重置 ${count.toLocaleString()} 个失败号码`);
      await refresh();
    } catch (error) {
      if (error !== "cancel" && error !== "close")
        ElMessage.error(apiErrorMessage(error, "重置失败"));
    } finally {
      busyId.value = null;
    }
  }

  async function remove(row: GroupDataPackage): Promise<void> {
    if (busyId.value !== null) return;
    try {
      await ElMessageBox.confirm(
        `确认删除数据包「${row.name}」（${row.metrics.totalCount.toLocaleString()} 个号码）？删除后不能再用于新任务。已创建任务的号码和历史记录保留，活动任务占用时不能删除。`,
        "删除数据包",
        {
          type: "warning",
          confirmButtonText: "确认删除",
          cancelButtonText: "取消"
        }
      );
      busyId.value = row.id;
      await deleteGroupDataPackage(row.id);
      ElMessage.success("数据包已删除");
      await refresh();
    } catch (error) {
      if (error !== "cancel" && error !== "close")
        ElMessage.error(apiErrorMessage(error, "数据包删除失败"));
    } finally {
      busyId.value = null;
    }
  }

  function action(value: PackageAction, row: GroupDataPackage): void {
    if (value === "edit") {
      editing.value = row;
      formVisible.value = true;
    }
    if (value === "import") {
      importTarget.value = row;
      importError.value = "";
      importVisible.value = true;
    }
    if (value === "reset") void resetFailed(row);
    if (value === "delete") void remove(row);
    if (value === "phones" || value === "imports") {
      detailTarget.value = row;
      detailTab.value = value;
      detailVisible.value = true;
    }
  }

  async function exportOne(
    row: GroupDataPackage,
    status: GroupDataPackageExportStatus,
    format: GroupDataPackageExportFormat
  ): Promise<void> {
    if (busyId.value !== null || batchExporting.value) return;
    busyId.value = row.id;
    try {
      const result = await exportGroupDataPackage(row.id, status, format);
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(
        `已导出 ${result.exportedCount.toLocaleString()} 个号码`
      );
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "号码导出失败"));
    } finally {
      busyId.value = null;
    }
  }

  async function exportSelected(
    status: GroupDataPackageExportStatus,
    format: GroupDataPackageExportFormat
  ): Promise<void> {
    if (!selected.value.length || batchExporting.value || busyId.value !== null)
      return;
    if (selected.value.length > 100) {
      ElMessage.warning("单次最多导出 100 个数据包");
      return;
    }
    batchExporting.value = true;
    try {
      const result = await exportGroupDataPackages(
        selected.value.map(row => row.id),
        status,
        format
      );
      downloadBlobFile(result.filename, result.blob);
      ElMessage.success(
        `已导出 ${result.exportedCount.toLocaleString()} 个号码`
      );
    } catch (error) {
      ElMessage.error(apiErrorMessage(error, "批量导出失败"));
    } finally {
      batchExporting.value = false;
    }
  }

  function exportList(): void {
    const values: unknown[][] = [
      [
        "ID",
        "数据包",
        "备注",
        "国家",
        "大洲",
        "消费业务",
        "总量",
        "未使用",
        "已领取",
        "入群成功",
        "失败",
        "隐私拒绝",
        "未注册",
        "待确认",
        "创建时间"
      ]
    ];
    rows.value.forEach(row =>
      values.push([
        row.id,
        row.name,
        row.remark,
        row.primaryCountryIso2,
        continentLabel(row.continent),
        row.usageBusinesses.map(businessLabel).join("、"),
        row.metrics.totalCount,
        row.metrics.unusedCount,
        row.metrics.claimedCount,
        row.metrics.successCount,
        row.metrics.failedCount,
        row.metrics.privacyRejectedCount,
        row.metrics.unregisteredCount,
        row.metrics.unknownCount,
        formatEpochMillis(row.createdAt)
      ])
    );
    downloadBlobFile(
      `拉群数据包列表_第${page.value}页.csv`,
      new Blob(
        [
          "\uFEFF",
          values.map(row => row.map(packageCsvCell).join(",")).join("\r\n")
        ],
        { type: "text/csv;charset=utf-8" }
      )
    );
    ElMessage.success(`已导出本页 ${rows.value.length} 个数据包的列表`);
  }

  return {
    rows,
    selected,
    countries,
    searchForm,
    page,
    pageSize,
    total,
    loading,
    countryLoading,
    errorMessage,
    countryError,
    busyId,
    batchExporting,
    formVisible,
    editing,
    saving,
    importVisible,
    importTarget,
    importing,
    importError,
    importResult,
    resultVisible,
    detailVisible,
    detailTarget,
    detailTab,
    selectedMetrics,
    pageMetrics,
    emptyCount,
    initialize,
    refresh,
    refreshCountries,
    search,
    reset,
    create,
    select,
    save,
    submitImport,
    action,
    exportOne,
    exportSelected,
    exportList
  };
}

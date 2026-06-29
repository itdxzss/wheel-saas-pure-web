import { onMounted, ref } from "vue";
import { ElMessageBox, type UploadUserFile } from "element-plus";
import {
  batchDeleteIpProxies,
  importIpProxies,
  listIpProxies,
  listTenantIpRegions
} from "@/api/resource-ip";
import { apiErrorMessage } from "@/utils/api-error";
import { message } from "@/utils/message";
import type { IpManageRow, ProxyTypeLabel } from "@/api/resource-ip-mapping";

interface IpSearchForm {
  country: string;
  proxyType: string;
  source: string;
}

export interface IpImportForm {
  country: string;
  proxyType: ProxyTypeLabel;
  source: string;
}

const defaultCountryOptions = [
  "混合（不限国家）",
  "巴基斯坦",
  "印度",
  "马来西亚",
  "印度尼西亚"
];

export function useResourceIpPage() {
  const countryOptions = ref<string[]>([...defaultCountryOptions]);
  const proxyTypeOptions: ProxyTypeLabel[] = ["HTTP", "SOCKS5"];
  const searchForm = ref<IpSearchForm>({
    country: "",
    proxyType: "",
    source: ""
  });
  const loading = ref(false);
  const deleting = ref(false);
  const importing = ref(false);
  const errorMessage = ref("");
  const guideCollapsed = ref(false);
  const rows = ref<IpManageRow[]>([]);
  const selectedRows = ref<IpManageRow[]>([]);
  const showImportDialog = ref(false);
  const importForm = ref<IpImportForm>({
    country: "",
    proxyType: "HTTP",
    source: ""
  });
  const uploadFiles = ref<UploadUserFile[]>([]);
  const importErrors = ref<string[]>([]);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  const columns: TableColumnList = [
    { label: "国家", prop: "country", width: 130 },
    { label: "类型", prop: "proxyType", width: 110 },
    { label: "代理地址", prop: "proxyAddress", minWidth: 220 },
    { label: "用户名", prop: "username", minWidth: 140 },
    { label: "密码", prop: "password", minWidth: 140 },
    { label: "有效账号", prop: "validAccountCount", width: 110 },
    { label: "来源", prop: "source", minWidth: 140 },
    { label: "创建时间", prop: "createdAt", width: 180 }
  ];

  function mergeCountryOptions(regions: string[]): void {
    const seen = new Set<string>();
    countryOptions.value = [...defaultCountryOptions, ...regions]
      .map(region => region.trim())
      .filter(region => {
        if (!region || seen.has(region)) return false;
        seen.add(region);
        return true;
      });
  }

  async function loadCountryOptions(): Promise<void> {
    try {
      mergeCountryOptions(await listTenantIpRegions());
    } catch (error) {
      message(apiErrorMessage(error, "IP 国家加载失败"), { type: "warning" });
    }
  }

  async function refreshIpList(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await listIpProxies({
        ...searchForm.value,
        page: page.value,
        pageSize: pageSize.value
      });
      rows.value = result.list ?? [];
      total.value = result.total ?? 0;
      selectedRows.value = [];
      mergeCountryOptions(rows.value.map(row => row.country));
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "IP 列表加载失败");
      message(errorMessage.value, { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function openImportDialog(): void {
    importForm.value = {
      country: "",
      proxyType: "HTTP",
      source: ""
    };
    uploadFiles.value = [];
    importErrors.value = [];
    showImportDialog.value = true;
  }

  async function deleteSelectedIps(): Promise<void> {
    if (selectedRows.value.length === 0) return;
    const ids = selectedRows.value.map(row => row.id);
    const hasValidAccount = selectedRows.value.some(
      row => row.validAccountCount > 0
    );
    const confirmText = hasValidAccount
      ? "当前选中的 IP 中存在可用账号，请确认是否删除？"
      : `确认删除选中的 ${ids.length} 个 IP？`;
    try {
      await ElMessageBox.confirm(confirmText, "批量删除 IP", {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消"
      });
    } catch {
      return;
    }

    deleting.value = true;
    try {
      await batchDeleteIpProxies(ids);
      message("IP 删除成功", { type: "success" });
      await refreshIpList();
      void loadCountryOptions();
    } catch (error) {
      message(apiErrorMessage(error, "IP 删除失败"), { type: "error" });
    } finally {
      deleting.value = false;
    }
  }

  function onSelectionChange(selection: IpManageRow[]): void {
    selectedRows.value = selection;
  }

  function searchIpList(): void {
    page.value = 1;
    void refreshIpList();
  }

  function resetSearchForm(): void {
    searchForm.value.country = "";
    searchForm.value.proxyType = "";
    searchForm.value.source = "";
    searchIpList();
  }

  async function readSelectedFileText(): Promise<string | null> {
    const rawFile = uploadFiles.value[0]?.raw;
    if (!rawFile) {
      message("请上传 TXT 文件", { type: "warning" });
      return null;
    }
    if (!rawFile.name.toLowerCase().endsWith(".txt")) {
      message("仅支持 .txt 文件", { type: "warning" });
      return null;
    }
    const text = await rawFile.text();
    if (!text.trim()) {
      message("TXT 文件内容不能为空", { type: "warning" });
      return null;
    }
    return text;
  }

  async function submitImport(): Promise<void> {
    if (!importForm.value.country) {
      message("请选择国家", { type: "warning" });
      return;
    }
    if (!importForm.value.source.trim()) {
      message("请输入来源", { type: "warning" });
      return;
    }
    const text = await readSelectedFileText();
    if (text == null) return;

    importing.value = true;
    importErrors.value = [];
    try {
      const result = await importIpProxies({
        country: importForm.value.country,
        proxyType: importForm.value.proxyType,
        source: importForm.value.source.trim(),
        text
      });
      importErrors.value = result.errors ?? [];
      const summary = `导入完成：新增 ${result.insertedRows}，跳过 ${result.skippedRows}，失败 ${result.failedRows}`;
      message(summary, { type: result.failedRows > 0 ? "warning" : "success" });
      if (result.failedRows === 0) {
        showImportDialog.value = false;
      }
      await refreshIpList();
      void loadCountryOptions();
    } catch (error) {
      message(apiErrorMessage(error, "IP 导入失败"), { type: "error" });
    } finally {
      importing.value = false;
    }
  }

  onMounted(() => {
    void refreshIpList();
    void loadCountryOptions();
  });

  return {
    columns,
    countryOptions,
    deleting,
    errorMessage,
    guideCollapsed,
    importErrors,
    importForm,
    importing,
    loading,
    page,
    pageSize,
    proxyTypeOptions,
    rows,
    searchForm,
    selectedRows,
    showImportDialog,
    total,
    uploadFiles,
    deleteSelectedIps,
    onSelectionChange,
    openImportDialog,
    refreshIpList,
    resetSearchForm,
    searchIpList,
    submitImport
  };
}

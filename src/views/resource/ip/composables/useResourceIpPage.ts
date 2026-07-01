import { onMounted, ref } from "vue";
import { ElMessageBox, type UploadUserFile } from "element-plus";
import {
  batchCheckIpProxies,
  batchDeleteIpProxies,
  checkIpProxy,
  importIpProxies,
  listIpCountryOptions,
  listIpProxies,
  type IpCountryOption,
  type IpProxyCheckResult
} from "@/api/resource-ip";
import { apiErrorMessage } from "@/utils/api-error";
import { message } from "@/utils/message";
import type {
  IpAllocationMode,
  IpManageRow,
  ProxyTypeLabel
} from "@/api/resource-ip-mapping";

interface IpSearchForm {
  country: string;
  proxyType: string;
  source: string;
}

export interface IpImportForm {
  allocationMode: IpAllocationMode;
  proxyType: ProxyTypeLabel;
  source: string;
}

/** IP 管理主列表按 PRD/原型展示,状态类字段只在检测弹窗和统计模块出现。 */
export function createIpManageTableColumns(): TableColumnList {
  return [
    { label: "国家", prop: "country", width: 130 },
    { label: "类型", prop: "proxyType", width: 110 },
    { label: "代理地址", prop: "proxyAddress", minWidth: 220 },
    { label: "用户名", prop: "username", minWidth: 140 },
    { label: "密码", prop: "password", minWidth: 140 },
    { label: "IP来源（二期）", prop: "source", minWidth: 140 },
    { label: "有效账号", prop: "validAccountCount", width: 110 },
    { label: "创建时间", prop: "createdAt", width: 180 }
  ];
}

/**
 * IP 管理页的状态与动作集中在这里。
 *
 * 组件只负责渲染,API 契约和导入/检测流程统一由 composable 维护,避免页面模板继续膨胀。
 */
export function useResourceIpPage() {
  // 国家选项仅用于列表筛选;TXT 导入国家由后端智能检测决定。
  const countryOptions = ref<IpCountryOption[]>([]);
  const allocationModeOptions: Array<{
    label: string;
    value: IpAllocationMode;
  }> = [
    { label: "智能分配(smart)", value: "smart" },
    { label: "混合分组(mixed)", value: "mixed" }
  ];
  const proxyTypeOptions: ProxyTypeLabel[] = ["HTTP", "SOCKETS"];
  const searchForm = ref<IpSearchForm>({
    country: "",
    proxyType: "",
    source: ""
  });
  const loading = ref(false);
  const deleting = ref(false);
  const importing = ref(false);
  const batchChecking = ref(false);
  const checkingRowIds = ref<Set<number>>(new Set());
  const errorMessage = ref("");
  const guideCollapsed = ref(false);
  const rows = ref<IpManageRow[]>([]);
  const selectedRows = ref<IpManageRow[]>([]);
  const showCheckResultDialog = ref(false);
  const checkResults = ref<IpProxyCheckResult[]>([]);
  const showImportDialog = ref(false);
  const importForm = ref<IpImportForm>({
    allocationMode: "smart",
    proxyType: "HTTP",
    source: ""
  });
  const uploadFiles = ref<UploadUserFile[]>([]);
  const importErrors = ref<string[]>([]);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);

  // 必须和 index.vue 中 dynamicColumns 的渲染顺序保持一致。
  const columns = createIpManageTableColumns();

  function countryOptionLabel(option: IpCountryOption): string {
    const flag = option.flag ? `${option.flag} ` : "";
    const prefix = option.phonePrefix ? ` ${option.phonePrefix}` : "";
    return `${flag}${option.nameZh}${prefix}`;
  }

  /** 加载国家主数据供筛选框使用,失败时不阻断列表加载。 */
  async function loadCountryOptions(): Promise<void> {
    try {
      countryOptions.value = await listIpCountryOptions();
    } catch (error) {
      message(apiErrorMessage(error, "IP 国家加载失败"), { type: "warning" });
    }
  }

  /** 刷新列表并清空已选行,避免批量操作拿到过期选择。 */
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
    } catch (error) {
      rows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "IP 列表加载失败");
      message(errorMessage.value, { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  /** 打开导入弹窗时重置表单和上次导入错误。 */
  function openImportDialog(): void {
    importForm.value = {
      allocationMode: "smart",
      proxyType: "HTTP",
      source: ""
    };
    uploadFiles.value = [];
    importErrors.value = [];
    showImportDialog.value = true;
  }

  /** 批量删除会根据是否绑定账号调整确认文案。 */
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
    } catch (error) {
      message(apiErrorMessage(error, "IP 删除失败"), { type: "error" });
    } finally {
      deleting.value = false;
    }
  }

  function onSelectionChange(selection: IpManageRow[]): void {
    selectedRows.value = selection;
  }

  /** 用 Set 管理行内检测 loading,避免某一行检测时锁住整张表。 */
  function setRowChecking(id: number, checking: boolean): void {
    const nextIds = new Set(checkingRowIds.value);
    if (checking) {
      nextIds.add(id);
    } else {
      nextIds.delete(id);
    }
    checkingRowIds.value = nextIds;
  }

  /** 单条检测调用后端真实检测接口,完成后刷新列表以同步检测字段。 */
  async function checkSingleIp(id: number): Promise<void> {
    if (checkingRowIds.value.has(id)) return;
    setRowChecking(id, true);
    try {
      const result = await checkIpProxy(id);
      checkResults.value = [result];
      showCheckResultDialog.value = true;
      await refreshIpList();
    } catch (error) {
      message(apiErrorMessage(error, "IP 检测失败"), { type: "error" });
    } finally {
      setRowChecking(id, false);
    }
  }

  /** 批量检测前端先做 20 条限制,和后端同步,避免发起过长的真实检测请求。 */
  async function checkSelectedIps(): Promise<void> {
    if (batchChecking.value) return;
    if (selectedRows.value.length === 0) {
      message("请选择要检测的 IP", { type: "warning" });
      return;
    }
    if (selectedRows.value.length > 20) {
      message("批量检测最多选择 20 个 IP", { type: "warning" });
      return;
    }

    batchChecking.value = true;
    try {
      const results = await batchCheckIpProxies(
        selectedRows.value.map(row => row.id)
      );
      checkResults.value = results;
      showCheckResultDialog.value = true;
      await refreshIpList();
    } catch (error) {
      message(apiErrorMessage(error, "批量检测失败"), { type: "error" });
    } finally {
      batchChecking.value = false;
    }
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

  /** 读取用户选择的 TXT 文件;文件内容由后端逐行解析和去重。 */
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

  /** 提交导入时不带国家字段,只提交分配方式/协议/来源/文本。 */
  async function submitImport(): Promise<void> {
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
        allocationMode: importForm.value.allocationMode,
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
    allocationModeOptions,
    batchChecking,
    checkResults,
    checkingRowIds,
    columns,
    countryOptions,
    countryOptionLabel,
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
    showCheckResultDialog,
    showImportDialog,
    total,
    uploadFiles,
    checkSelectedIps,
    checkSingleIp,
    deleteSelectedIps,
    onSelectionChange,
    openImportDialog,
    refreshIpList,
    resetSearchForm,
    searchIpList,
    submitImport
  };
}

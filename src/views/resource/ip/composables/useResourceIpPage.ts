import { computed, onMounted, ref, watch } from "vue";
import { ElMessageBox, type UploadRawFile, type UploadUserFile } from "element-plus";
import {
  batchCheckIpProxies,
  batchDeleteIpProxies,
  checkIpProxy,
  importIpProxies,
  listIpCountryOptions,
  listIpProxies,
  sampleCheckIpProxyImport,
  type IpCountryOption,
  type IpProxyCheckResult,
  type IpProxyImportSampleCheckResult
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
  countryValue: string;
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
  // 国家选项同时服务列表筛选和 TXT 导入手动选择国家。
  const countryOptions = ref<IpCountryOption[]>([]);
  const proxyTypeOptions: ProxyTypeLabel[] = ["HTTP", "SOCKS5"];
  const searchForm = ref<IpSearchForm>({
    country: "",
    proxyType: "",
    source: ""
  });
  const loading = ref(false);
  const deleting = ref(false);
  const importing = ref(false);
  const importChecking = ref(false);
  const importCheckPassed = ref(false);
  const importCheckErrors = ref<string[]>([]);
  const importCheckResult = ref<IpProxyImportSampleCheckResult | null>(null);
  const showImportSampleCheckDialog = ref(false);
  const batchChecking = ref(false);
  // 单条检测期间用 Set 锁住所有检测入口:当前行显示 loading,其它行和批量按钮禁用。
  const checkingRowIds = ref<Set<number>>(new Set());
  // 弹框先打开再等接口返回,这两个状态驱动弹框里的“检测中”和异常提示。
  const checkDialogLoading = ref(false);
  const checkDialogErrorMessage = ref("");
  const errorMessage = ref("");
  const guideCollapsed = ref(false);
  const rows = ref<IpManageRow[]>([]);
  const selectedRows = ref<IpManageRow[]>([]);
  // 只要 activeCheckRow 有值,检测弹框就按“单条代理检测”卡片展示;为空则展示批量结果表。
  const activeCheckRow = ref<IpManageRow | null>(null);
  const showCheckResultDialog = ref(false);
  const checkResults = ref<IpProxyCheckResult[]>([]);
  const showImportDialog = ref(false);
  const importForm = ref<IpImportForm>({
    allocationMode: "smart",
    countryValue: "",
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
  const canSubmitImport = computed(
    () => importCheckPassed.value && !importing.value && !importChecking.value
  );

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

  function clearImportCheckState(): void {
    importCheckPassed.value = false;
    importCheckErrors.value = [];
    importCheckResult.value = null;
  }

  function importCheckFormSnapshot() {
    const file = uploadFiles.value[0];
    return {
      allocationMode: importForm.value.allocationMode,
      countryValue: importForm.value.countryValue,
      fileName: file?.name ?? "",
      fileSize: file?.size ?? file?.raw?.size ?? 0,
      fileUid: file?.uid ?? "",
      proxyType: importForm.value.proxyType,
      source: importForm.value.source.trim()
    };
  }

  function importCheckFormFingerprint(): string {
    return JSON.stringify(importCheckFormSnapshot());
  }

  function importCheckFingerprint(text: string): string {
    return JSON.stringify({
      ...importCheckFormSnapshot(),
      text
    });
  }

  /** 打开导入弹窗时重置表单和上次导入错误。 */
  function openImportDialog(): void {
    importForm.value = {
      allocationMode: "smart",
      countryValue: "",
      proxyType: "HTTP",
      source: ""
    };
    uploadFiles.value = [];
    importErrors.value = [];
    clearImportCheckState();
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

  /** 兼容旧调用传 id 和页面新调用传整行;整行能让弹框立即展示代理地址/来源。 */
  function resolveCheckRow(target: IpManageRow | number): IpManageRow | null {
    if (typeof target !== "number") return target;
    return rows.value.find(row => row.id === target) ?? null;
  }

  function resolveCheckId(target: IpManageRow | number): number {
    return typeof target === "number" ? target : target.id;
  }

  /** 单条检测点击后立即打开弹框,检测期间锁住其它检测入口。 */
  async function checkSingleIp(target: IpManageRow | number): Promise<void> {
    if (checkingRowIds.value.size > 0 || batchChecking.value) return;
    const id = resolveCheckId(target);
    const row = resolveCheckRow(target);
    // 先落 UI pending 态,再发起网络请求;这样慢代理也能立即给用户明确反馈。
    setRowChecking(id, true);
    activeCheckRow.value = row;
    checkResults.value = [];
    checkDialogErrorMessage.value = "";
    checkDialogLoading.value = true;
    showCheckResultDialog.value = true;
    try {
      const result = await checkIpProxy(id);
      checkResults.value = [result];
      // 检测结果会回写代理状态/出口信息,刷新列表让表格与弹框结果保持一致。
      await refreshIpList();
    } catch (error) {
      const errorText = apiErrorMessage(error, "IP 检测失败");
      checkDialogErrorMessage.value = errorText;
      message(errorText, { type: "error" });
    } finally {
      checkDialogLoading.value = false;
      setRowChecking(id, false);
    }
  }

  /** 批量检测前端先做 20 条限制,和后端同步,避免发起过长的真实检测请求。 */
  async function checkSelectedIps(): Promise<void> {
    if (batchChecking.value || checkingRowIds.value.size > 0) return;
    if (selectedRows.value.length === 0) {
      message("请选择要检测的 IP", { type: "warning" });
      return;
    }
    if (selectedRows.value.length > 20) {
      message("批量检测最多选择 20 个 IP", { type: "warning" });
      return;
    }

    batchChecking.value = true;
    // 批量检测复用同一个弹框组件,必须清空单条上下文,否则会误渲染成单条检测卡片。
    activeCheckRow.value = null;
    checkDialogErrorMessage.value = "";
    checkDialogLoading.value = false;
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

  function rerunActiveCheck(): void {
    // 重新检测只服务单条弹框;批量弹框没有 activeCheckRow,这里自然不触发。
    if (!activeCheckRow.value) return;
    void checkSingleIp(activeCheckRow.value);
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

  function selectedImportRawFile(): UploadRawFile | null {
    const rawFile = uploadFiles.value[0]?.raw;
    if (!rawFile) {
      message("请上传 TXT 文件", { type: "warning" });
      return null;
    }
    if (!rawFile.name.toLowerCase().endsWith(".txt")) {
      message("仅支持 .txt 文件", { type: "warning" });
      return null;
    }
    return rawFile;
  }

  async function readImportFileText(rawFile: UploadRawFile): Promise<string | null> {
    const text = await rawFile.text();
    if (!text.trim()) {
      message("TXT 文件内容不能为空", { type: "warning" });
      return null;
    }
    return text;
  }

  /** 读取用户选择的 TXT 文件;文件内容由后端逐行解析和去重。 */
  async function readSelectedFileText(): Promise<string | null> {
    const rawFile = selectedImportRawFile();
    return rawFile ? readImportFileText(rawFile) : null;
  }

  async function sampleCheckImport(): Promise<void> {
    if (!importForm.value.countryValue) {
      message("请选择国家", { type: "warning" });
      return;
    }
    if (!importForm.value.source.trim()) {
      message("请输入来源", { type: "warning" });
      return;
    }
    const rawFile = selectedImportRawFile();
    if (!rawFile) return;
    const requestFormFingerprint = importCheckFormFingerprint();

    importChecking.value = true;
    importCheckPassed.value = false;
    importCheckErrors.value = [];
    importCheckResult.value = null;
    showImportSampleCheckDialog.value = true;
    try {
      const text = await readImportFileText(rawFile);
      if (text == null) return;
      if (requestFormFingerprint !== importCheckFormFingerprint()) {
        return;
      }
      const requestFingerprint = importCheckFingerprint(text);
      const result = await sampleCheckIpProxyImport({
        allocationMode: importForm.value.allocationMode,
        countryValue: importForm.value.countryValue,
        proxyType: importForm.value.proxyType,
        source: importForm.value.source.trim(),
        text
      });
      if (requestFingerprint !== importCheckFingerprint(text)) {
        return;
      }
      importCheckResult.value = result;
      importCheckPassed.value = result.passed;
      importCheckErrors.value = result.errors ?? [];
      if (!result.passed) {
        message("抽样检测未通过", { type: "warning" });
      }
    } catch (error) {
      clearImportCheckState();
      message(apiErrorMessage(error, "抽样检测失败"), { type: "error" });
    } finally {
      importChecking.value = false;
    }
  }

  /** 提交导入时带业务人员手选国家;检测结果不会回填国家字段。 */
  async function submitImport(): Promise<void> {
    if (!importForm.value.countryValue) {
      message("请选择国家", { type: "warning" });
      return;
    }
    if (!importForm.value.source.trim()) {
      message("请输入来源", { type: "warning" });
      return;
    }
    if (!importCheckPassed.value) {
      message("请先完成抽样检测", { type: "warning" });
      return;
    }
    const text = await readSelectedFileText();
    if (text == null) return;

    importing.value = true;
    importErrors.value = [];
    try {
      const result = await importIpProxies({
        allocationMode: importForm.value.allocationMode,
        countryValue: importForm.value.countryValue,
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

  watch(importForm, clearImportCheckState, { deep: true });
  watch(uploadFiles, clearImportCheckState, { deep: true });

  return {
    activeCheckRow,
    batchChecking,
    canSubmitImport,
    checkDialogErrorMessage,
    checkDialogLoading,
    checkResults,
    checkingRowIds,
    columns,
    countryOptions,
    countryOptionLabel,
    deleting,
    errorMessage,
    guideCollapsed,
    importErrors,
    importCheckErrors,
    importCheckPassed,
    importCheckResult,
    importChecking,
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
    showImportSampleCheckDialog,
    total,
    uploadFiles,
    checkSelectedIps,
    checkSingleIp,
    deleteSelectedIps,
    onSelectionChange,
    openImportDialog,
    refreshIpList,
    rerunActiveCheck,
    resetSearchForm,
    sampleCheckImport,
    searchIpList,
    submitImport
  };
}

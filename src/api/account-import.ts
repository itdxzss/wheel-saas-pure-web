import { http } from "@/utils/http";
import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import { formatEpochMillis } from "@/utils/time";
import type { PureHttpResponse } from "@/utils/http/types.d";

export type AccountImportType = "六段号" | "JSON号" | "全参账号" | string;
export type AccountImportStatus = "导入中" | "已完成" | string;
export type AccountImportProgress = string;
export type AccountImportIpAllocationMode = "smart" | "mixed";

export interface AccountImportTask {
  id: number;
  filename: string;
  import_type: AccountImportType;
  group: string;
  tag?: string | null;
  device: string;
  account_type: string;
  service?: string | null;
  ip_mode?: string | null;
  ip_allocation_mode?: AccountImportIpAllocationMode | string | null;
  total: number;
  imported: number;
  success: number;
  fail: number;
  login_success: number;
  login_failed: number;
  login_fail: number;
  abnormal: number;
  abnormal_key: number;
  abnormal_ban: number;
  created_at: string;
  progress: AccountImportProgress;
  status: AccountImportStatus;
  remark?: string | null;
}

export interface AccountImportDetailRow {
  line: number | string;
  account: string;
  status: "成功" | "失败" | "异常" | string;
  reason: string;
  group?: string | null;
  tag?: string | null;
  created_at: string;
}

export interface AccountImportFailReason {
  reason: string;
  count: number;
}

export interface AccountImportTaskDetail {
  task: AccountImportTask;
  details: string[];
  detail_rows: AccountImportDetailRow[];
  detail_total: number;
  detail_page: number;
  detail_page_size: number;
  fail_reasons: AccountImportFailReason[];
}

export interface AccountImportDetailParams {
  status?: string;
  page?: number;
  page_size?: number;
}

export interface CreateAccountImportTaskRequest {
  import_type: AccountImportType;
  filename?: string | null;
  group: string;
  group_id?: number | null;
  device?: string | null;
  account_type?: string | null;
  service?: string | null;
  ip_mode?: string | null;
  ip_allocation_mode?: AccountImportIpAllocationMode | string | null;
  remark?: string | null;
  text?: string | null;
  total?: number | null;
}

export interface AccountImportExport {
  filename: string;
  blob: Blob;
}

export type AccountImportExportFilenameHint = Partial<
  Pick<
    AccountImportTask,
    | "import_type"
    | "total"
    | "imported"
    | "success"
    | "fail"
    | "login_success"
    | "login_failed"
    | "login_fail"
    | "abnormal"
  >
>;

export interface ListAccountImportTasksParams {
  page?: number;
  page_size?: number;
  pageSize?: number;
  keyword?: string;
  import_type?: string;
  importFormat?: number;
  group?: string;
  accountGroupId?: number;
  device?: string;
  deviceOs?: number;
  account_type?: string;
  accountType?: number;
  login?: string;
  status?: string;
}

interface ArmadaAccountImportBatch {
  id: number;
  sourceFileName?: string | null;
  importFormat?: number | null;
  deviceOs?: number | null;
  accountType?: number | null;
  ipRegion?: string | null;
  ipAllocationMode?: string | null;
  totalRows?: number | null;
  importedRows?: number | null;
  duplicateRows?: number | null;
  formatErrorRows?: number | null;
  loginSuccess?: number | null;
  loginFailed?: number | null;
  loginAbnormal?: number | null;
  status?: number | null;
  groupName?: string | null;
  createdAt?: number | null;
}

interface ArmadaAccountImportDetail {
  id: number;
  lineNo?: number | null;
  wsPhone?: string | null;
  accountId?: number | null;
  parseResult?: number | null;
  parseResultLabel?: string | null;
  failReason?: string | null;
  loginResult?: number | null;
  createdAt?: number | null;
}

function importFormatCode(value?: string | number | null): number | undefined {
  if (typeof value === "number") return value;
  if (value === "六段号") return 1;
  if (value === "JSON号") return 2;
  if (value === "全参账号") return 3;
  return undefined;
}

function importFormatLabel(value?: number | null): string {
  if (value === 1) return "六段号";
  if (value === 2) return "JSON号";
  if (value === 3) return "全参账号";
  return "-";
}

function deviceOsCode(value?: string | number | null): number | undefined {
  if (typeof value === "number") return value;
  if (value === "安卓") return 1;
  if (value === "苹果") return 2;
  return undefined;
}

function deviceOsLabel(value?: number | null): string {
  if (value === 1) return "安卓";
  if (value === 2) return "苹果";
  return "-";
}

function accountTypeCode(value?: string | number | null): number | undefined {
  if (typeof value === "number") return value;
  if (value === "个人") return 1;
  if (value === "商业") return 2;
  return undefined;
}

function accountTypeLabel(value?: number | null): string {
  if (value === 1) return "个人";
  if (value === 2) return "商业";
  return "-";
}

function ipAllocationModeLabel(value?: string | null): string {
  if (value === "smart") return "智能分配";
  if (value === "mixed" || value === "mixed_country") return "混合国家";
  return value || "";
}

function normalizeAccountImportIpAllocationMode(
  value?: string | null
): AccountImportIpAllocationMode | undefined {
  if (value === "smart" || value === "mixed") return value;
  if (value === "mixed_country") return "mixed";
  return undefined;
}

function statusCode(value?: string | number | null): number | undefined {
  if (typeof value === "number") return value;
  if (value === "导入中" || value === "进行中") return 1;
  if (value === "已完成") return 2;
  return undefined;
}

function statusLabel(value?: number | null): AccountImportStatus {
  if (value === 1) return "导入中";
  if (value === 2) return "已完成";
  return "-";
}

function detailFilter(value?: string): string {
  if (value === "SUCCESS") return "success";
  if (value === "FAIL" || value === "ABNORMAL") return "fail";
  return "all";
}

function exportScope(value: string): string {
  if (value === "SUCCESS") return "success";
  if (value === "FAIL") return "fail";
  return "all";
}

function headerValue(
  headers: PureHttpResponse["headers"],
  name: string
): string | undefined {
  const getter = headers as { get?: (key: string) => unknown };
  const viaGetter = getter.get?.(name);
  if (typeof viaGetter === "string") return viaGetter;

  const record = headers as Record<string, unknown>;
  const direct = record[name] ?? record[name.toLowerCase()];
  return typeof direct === "string" ? direct : undefined;
}

function decodeFilename(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function filenameFromContentDisposition(value?: string): string | undefined {
  if (!value) return undefined;

  const encoded = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(value);
  if (encoded?.[2]) {
    return decodeFilename(encoded[2]);
  }

  const plain = /filename=("?)([^";]+)\1/i.exec(value);
  return plain?.[2];
}

function countValue(value?: number | null): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0;
}

function compactExportDate(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
}

function fallbackSuccessCount(hint: AccountImportExportFilenameHint): number {
  const loginFail = Math.max(
    countValue(hint.login_fail),
    countValue(hint.login_failed)
  );
  const loginTotal =
    countValue(hint.login_success) + loginFail + countValue(hint.abnormal);
  if (loginTotal > 0) return countValue(hint.login_success);
  return countValue(hint.success ?? hint.imported);
}

function fallbackFailCount(hint: AccountImportExportFilenameHint): number {
  const loginFail = Math.max(
    countValue(hint.login_fail),
    countValue(hint.login_failed)
  );
  return countValue(hint.fail) + loginFail + countValue(hint.abnormal);
}

function fallbackExtension(
  blob: Blob,
  hint?: AccountImportExportFilenameHint
): string {
  const extension = blob.type.includes("zip") ? "zip" : "txt";
  if (extension === "zip") return extension;
  return hint?.import_type === "JSON号" ? "zip" : "txt";
}

function fallbackExportFilename(
  id: number,
  scope: string,
  blob: Blob,
  hint?: AccountImportExportFilenameHint
): string {
  const extension = fallbackExtension(blob, hint);
  if (!hint) return `account-import-${id}-${scope}.${extension}`;

  // 跨域环境可能读不到 Content-Disposition，fallback 仍要保持后端统一命名口径。
  const date = compactExportDate();
  const successCount = fallbackSuccessCount(hint);
  const failCount = fallbackFailCount(hint);
  if (scope === "success") {
    return `账号导入_${date}_成功_${successCount}个.${extension}`;
  }
  if (scope === "fail") {
    return `账号导入_${date}_失败_${failCount}个.${extension}`;
  }
  const totalCount =
    hint.total == null ? successCount + failCount : countValue(hint.total);
  return `账号导入_${date}_全部_共${totalCount}个_成功${successCount}个_失败${failCount}个.${extension}`;
}

function toListQuery(params: ListAccountImportTasksParams) {
  return {
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    sourceFileName: params.keyword,
    importFormat: params.importFormat ?? importFormatCode(params.import_type),
    accountGroupId: params.accountGroupId,
    deviceOs: params.deviceOs ?? deviceOsCode(params.device),
    accountType: params.accountType ?? accountTypeCode(params.account_type),
    login: params.login,
    status: statusCode(params.status)
  };
}

function toTask(row: ArmadaAccountImportBatch): AccountImportTask {
  const total = row.totalRows ?? 0;
  const imported = row.importedRows ?? 0;
  const failed = (row.duplicateRows ?? 0) + (row.formatErrorRows ?? 0);
  const loginFailed = row.loginFailed ?? 0;
  const loginAbnormal = row.loginAbnormal ?? 0;
  return {
    id: row.id,
    filename: row.sourceFileName || "导入",
    import_type: importFormatLabel(row.importFormat),
    group: row.groupName || "-",
    tag: null,
    device: deviceOsLabel(row.deviceOs),
    account_type: accountTypeLabel(row.accountType),
    service: null,
    ip_mode: ipAllocationModeLabel(row.ipAllocationMode) || row.ipRegion || null,
    ip_allocation_mode: row.ipAllocationMode ?? null,
    total,
    imported,
    success: imported,
    fail: failed,
    login_success: row.loginSuccess ?? 0,
    login_failed: loginFailed,
    login_fail: loginFailed,
    abnormal: loginAbnormal,
    abnormal_key: 0,
    abnormal_ban: 0,
    created_at: formatEpochMillis(row.createdAt),
    progress: `${imported} / ${total}`,
    status: statusLabel(row.status),
    remark: null
  };
}

function toDetailRow(row: ArmadaAccountImportDetail): AccountImportDetailRow {
  const success = row.parseResult === 1;
  return {
    line: row.lineNo ?? "-",
    account: row.wsPhone ?? "-",
    status: success ? "成功" : "失败",
    reason: success ? "" : row.failReason || row.parseResultLabel || "导入失败",
    group: null,
    tag: null,
    created_at: formatEpochMillis(row.createdAt)
  };
}

function toFormData(data: CreateAccountImportTaskRequest): FormData {
  const form = new FormData();
  if (data.group_id) form.append("accountGroupId", String(data.group_id));
  const importFormat = importFormatCode(data.import_type);
  if (importFormat) form.append("importFormat", String(importFormat));
  const deviceOs = deviceOsCode(data.device);
  if (deviceOs) form.append("deviceOs", String(deviceOs));
  const accountType = accountTypeCode(data.account_type);
  if (accountType) form.append("accountType", String(accountType));
  const ipAllocationMode = normalizeAccountImportIpAllocationMode(
    data.ip_allocation_mode
  );
  if (ipAllocationMode) form.append("ipAllocationMode", ipAllocationMode);
  if (!ipAllocationMode && data.ip_mode && !data.ip_mode.startsWith("系统自动")) {
    form.append("ipRegion", data.ip_mode);
  }
  if (data.remark) form.append("remark", data.remark);
  if (data.text) form.append("text", data.text);
  return form;
}

export function listAccountImportTasks(
  params: ListAccountImportTasksParams = {}
): Promise<PageResponse<AccountImportTask>> {
  return armadaRequest<PageResponse<ArmadaAccountImportBatch>>(
    "get",
    "/api/account-imports",
    { params: toListQuery(params) }
  ).then(result => ({
    ...result,
    list: result.list?.map(toTask) ?? []
  }));
}

export function createAccountImportTask(
  data: CreateAccountImportTaskRequest
): Promise<AccountImportTask> {
  return armadaRequest<ArmadaAccountImportBatch>(
    "post",
    "/api/account-imports",
    { data: toFormData(data) },
    {
      beforeRequestCallback: config => {
        delete config.headers["Content-Type"];
      }
    }
  ).then(toTask);
}

export function uploadAccountImportZip(
  data: CreateAccountImportTaskRequest & {
    file: File;
  }
): Promise<AccountImportTask> {
  const form = toFormData(data);
  form.append("file", data.file);
  return armadaRequest<ArmadaAccountImportBatch>(
    "post",
    "/api/account-imports",
    { data: form },
    {
      beforeRequestCallback: config => {
        // FormData 必须让浏览器生成带 boundary 的 Content-Type。
        delete config.headers["Content-Type"];
      }
    }
  ).then(toTask);
}

export function getAccountImportTask(
  id: number,
  params?: AccountImportDetailParams
): Promise<PageResponse<AccountImportDetailRow>> {
  return armadaRequest<PageResponse<ArmadaAccountImportDetail>>(
    "get",
    `/api/account-imports/${id}/details`,
    {
      params: {
        page: params?.page,
        pageSize: params?.page_size,
        filter: detailFilter(params?.status)
      }
    }
  ).then(result => ({
    ...result,
    list: result.list?.map(toDetailRow) ?? []
  }));
}

export function exportAccountImportTask(
  id: number,
  kind: string,
  filenameHint?: AccountImportExportFilenameHint
): Promise<AccountImportExport> {
  const scope = exportScope(kind);
  let filename: string | undefined;
  return http
    .request<Blob>(
      "get",
      `/api/account-imports/${id}/export`,
      {
        params: { scope },
        responseType: "blob"
      },
      {
        beforeResponseCallback: response => {
          filename = filenameFromContentDisposition(
            headerValue(response.headers, "Content-Disposition")
          );
        }
      }
    )
    .then(blob => ({
      filename:
        filename || fallbackExportFilename(id, scope, blob, filenameHint),
      blob
    }));
}

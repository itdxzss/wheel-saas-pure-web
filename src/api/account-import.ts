import { http } from "@/utils/http";
import type { ApiResponse, PageResponse } from "@/api/account";

export type AccountImportType = "六段号" | "JSON号" | "全参账号" | string;
export type AccountImportStatus = "导入中" | "已完成" | string;
export type AccountImportProgress = string;

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
  remark?: string | null;
  text?: string | null;
  total?: number | null;
}

export interface AccountImportExport {
  filename: string;
  content: string;
}

export interface ListAccountImportTasksParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  import_type?: string;
  group?: string;
  device?: string;
  account_type?: string;
  login?: string;
  status?: string;
}

export function listAccountImportTasks(
  params: ListAccountImportTasksParams = {}
): Promise<ApiResponse<PageResponse<AccountImportTask>>> {
  return http.request<ApiResponse<PageResponse<AccountImportTask>>>(
    "get",
    "/api/tenant/account-imports",
    { params }
  );
}

export function createAccountImportTask(
  data: CreateAccountImportTaskRequest
): Promise<ApiResponse<AccountImportTask>> {
  return http.request<ApiResponse<AccountImportTask>>(
    "post",
    "/api/tenant/account-imports",
    { data }
  );
}

export function uploadAccountImportZip(
  form: FormData
): Promise<ApiResponse<AccountImportTask>> {
  return http.request<ApiResponse<AccountImportTask>>(
    "post",
    "/api/tenant/account-imports/zip",
    { data: form },
    {
      beforeRequestCallback: config => {
        // FormData 必须让浏览器生成带 boundary 的 Content-Type。
        delete config.headers["Content-Type"];
      }
    }
  );
}

export function getAccountImportTask(
  id: number,
  params?: AccountImportDetailParams
): Promise<ApiResponse<AccountImportTaskDetail>> {
  return http.request<ApiResponse<AccountImportTaskDetail>>(
    "get",
    `/api/tenant/account-imports/${id}`,
    params ? { params } : undefined
  );
}

export function exportAccountImportTask(
  id: number,
  kind: string
): Promise<ApiResponse<AccountImportExport>> {
  return http.request<ApiResponse<AccountImportExport>>(
    "get",
    `/api/tenant/account-imports/${id}/export`,
    { params: { kind } }
  );
}

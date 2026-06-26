import { http } from "@/utils/http";

export interface AccountGroupApiRow {
  id: number;
  name: string;
  total_accounts: number;
  online_accounts: number;
  abnormal_accounts: number;
  banned_accounts: number;
  account_count_summary?: string | null;
  updated_at: string;
  remark?: string | null;
  system_builtin: boolean;
}

export interface AccountGroupWriteRequest {
  name: string;
  remark?: string | null;
}

export interface AccountGroupBatchDeleteResponse {
  deleted_count: number;
}

export interface AccountGroupListQuery {
  page?: number;
  page_size?: number;
  keyword?: string;
}

export interface PageResponse<T> {
  list?: T[];
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function listAccountGroups(
  params: AccountGroupListQuery = {}
): Promise<ApiResponse<PageResponse<AccountGroupApiRow>>> {
  return http.request<ApiResponse<PageResponse<AccountGroupApiRow>>>(
    "get",
    "/api/tenant/account-groups",
    { params }
  );
}

export function createAccountGroup(
  data: AccountGroupWriteRequest
): Promise<ApiResponse<AccountGroupApiRow>> {
  return http.request<ApiResponse<AccountGroupApiRow>>(
    "post",
    "/api/tenant/account-groups",
    { data }
  );
}

export function batchDeleteAccountGroups(
  ids: number[]
): Promise<ApiResponse<AccountGroupBatchDeleteResponse>> {
  return http.request<ApiResponse<AccountGroupBatchDeleteResponse>>(
    "post",
    "/api/tenant/account-groups/batch-delete",
    { data: { ids } }
  );
}

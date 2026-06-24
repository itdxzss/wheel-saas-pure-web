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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function createAccountGroup(data: AccountGroupWriteRequest) {
  return http.request<ApiResponse<AccountGroupApiRow>>(
    "post",
    "/api/tenant/account-groups",
    { data }
  );
}

export function batchDeleteAccountGroups(ids: number[]) {
  return http.request<ApiResponse<AccountGroupBatchDeleteResponse>>(
    "post",
    "/api/tenant/account-groups/batch-delete",
    { data: { ids } }
  );
}

import { http } from "@/utils/http";

export type AccountState = 1 | 2 | 3 | 4 | 5;
export type LoginState = 1 | 2;
export type RiskStatus = 1 | 2 | 3;

export interface TenantAccount {
  id?: number;
  ws_phone?: string | null;
  protocol_address?: string | null;
  truth_ip?: string | null;
  account_type?: string | null;
  number_source?: string | null;
  channel_name?: string | null;
  account_state?: AccountState | null;
  login_state?: LoginState | null;
  risk_status?: RiskStatus | null;
  group_id?: number | null;
  group_name?: string | null;
  assigned_service?: string | null;
  service_name?: string | null;
  friends_num?: number | null;
  groups_num?: number | null;
  avatar_url?: string | null;
  nickname?: string | null;
  remark?: string | null;
  country?: string | null;
  mute_status?: string | null;
  ip_region?: string | null;
  ip_source?: string | null;
  ip_group_name?: string | null;
  first_login_time?: string | null;
  risk_end_time?: string | null;
  pull_into_group_count?: number | null;
  hyperlink_sent_count?: number | null;
  block_reason?: string | null;
  invalidated_at?: string | null;
}

export interface TenantAccountListQuery {
  page?: number;
  page_size?: number;
  keyword?: string;
  phone?: string;
  account_state?: AccountState | "";
  login_state?: LoginState | "";
  risk_status?: RiskStatus | "";
  group_id?: number | "";
  assigned_service?: string;
  country?: string;
  mute_status?: string;
  ip_group_name?: string;
}

export interface TenantAccountSummary {
  total: number;
  banned: number;
  online: number;
  offline: number;
  risk: number;
  assigned: number;
  unassigned: number;
}

export interface PageResponse<T> {
  list?: T[];
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  msg?: string;
}

export function listTenantAccounts(
  params: TenantAccountListQuery = {}
): Promise<ApiResponse<PageResponse<TenantAccount>>> {
  return http.request<ApiResponse<PageResponse<TenantAccount>>>(
    "get",
    "/api/tenant/accounts/list",
    { params }
  );
}

export function getTenantAccountSummary(): Promise<
  ApiResponse<TenantAccountSummary>
> {
  return http.request<ApiResponse<TenantAccountSummary>>(
    "get",
    "/api/tenant/accounts/summary"
  );
}

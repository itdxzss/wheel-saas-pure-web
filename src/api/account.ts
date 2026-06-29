import { armadaRequest } from "@/api/armada";
import { formatEpochMillis } from "@/utils/time";

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
  pageSize?: number;
  keyword?: string;
  phone?: string;
  account_state?: AccountState | "";
  accountState?: AccountState | "";
  login_state?: LoginState | "";
  risk_status?: RiskStatus | "";
  riskStatus?: RiskStatus | "";
  group_id?: number | "";
  accountGroupId?: number | "";
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

export interface TenantAccountOnlineResult {
  accountId: number;
  protocolAccountId: string;
  accepted: boolean;
  stateSource: string;
  syncedAt: number | null;
  ownerWorkerId: string | null;
  ownerEndpoint: string | null;
  currentWorkerId: string | null;
  local: boolean;
}

export interface PageResponse<T> {
  list?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

interface ArmadaTenantAccount {
  id?: number;
  wsPhone?: string | null;
  accountType?: number | null;
  deviceOs?: number | null;
  numberSource?: number | null;
  channelName?: string | null;
  protocolId?: string | null;
  accountGroupId?: number | null;
  groupName?: string | null;
  ownership?: number | null;
  leaseUntil?: number | null;
  dispatchedAt?: number | null;
  createdAt?: number | null;
  accountState?: AccountState | null;
  loginState?: LoginState | null;
  riskStatus?: RiskStatus | null;
  riskEndTime?: number | null;
  muteStatus?: number | null;
  blockErrorCode?: string | null;
  blockReason?: string | null;
  truthIp?: string | null;
  pullIntoGroupCount?: number | null;
  invalidatedAt?: number | null;
  avatarUrl?: string | null;
  friendsNum?: number | null;
  groupsNum?: number | null;
  hyperlinkSentCount?: number | null;
  country?: string | null;
  ipSource?: string | null;
}

function accountTypeLabel(value?: number | null): string | null {
  if (value === 1) return "个人号";
  if (value === 2) return "商业号";
  return null;
}

function numberSourceLabel(value?: number | null): string | null {
  if (value === 1) return "买量";
  if (value === 2) return "裂变";
  if (value === 3) return "自购";
  return null;
}

function muteStatusLabel(value?: number | null): string | null {
  if (value === 1) return "6h";
  if (value === 2) return "24h";
  return null;
}

function toQuery(params: TenantAccountListQuery) {
  return {
    page: params.page,
    pageSize: params.pageSize ?? params.page_size,
    phone: params.phone || params.keyword,
    accountState: params.accountState ?? params.account_state,
    riskStatus: params.riskStatus ?? params.risk_status,
    accountGroupId: params.accountGroupId ?? params.group_id
  };
}

function toTenantAccount(row: ArmadaTenantAccount): TenantAccount {
  return {
    id: row.id,
    ws_phone: row.wsPhone ?? null,
    protocol_address: row.protocolId ?? null,
    truth_ip: row.truthIp ?? null,
    account_type: accountTypeLabel(row.accountType),
    number_source: numberSourceLabel(row.numberSource),
    channel_name: row.channelName ?? null,
    account_state: row.accountState ?? null,
    login_state: row.loginState ?? null,
    risk_status: row.riskStatus ?? null,
    group_id: row.accountGroupId ?? null,
    group_name: row.groupName ?? null,
    assigned_service: null,
    service_name: null,
    friends_num: row.friendsNum ?? 0,
    groups_num: row.groupsNum ?? 0,
    avatar_url: row.avatarUrl ?? null,
    nickname: null,
    remark: null,
    country: row.country ?? null,
    mute_status: muteStatusLabel(row.muteStatus),
    ip_region: row.country ?? null,
    ip_source: row.ipSource ?? null,
    ip_group_name: null,
    first_login_time: formatEpochMillis(row.createdAt, null),
    risk_end_time: formatEpochMillis(row.riskEndTime, null),
    pull_into_group_count: row.pullIntoGroupCount ?? 0,
    hyperlink_sent_count: row.hyperlinkSentCount ?? 0,
    block_reason: row.blockReason ?? row.blockErrorCode ?? null,
    invalidated_at: formatEpochMillis(row.invalidatedAt, null)
  };
}

export function listTenantAccounts(
  params: TenantAccountListQuery = {}
): Promise<PageResponse<TenantAccount>> {
  return armadaRequest<PageResponse<ArmadaTenantAccount>>(
    "get",
    "/api/accounts",
    { params: toQuery(params) }
  ).then(result => ({
    ...result,
    list: result.list?.map(toTenantAccount) ?? []
  }));
}

export function getTenantAccountSummary(): Promise<TenantAccountSummary> {
  return armadaRequest<TenantAccountSummary>("get", "/api/accounts/stats");
}

export function onlineTenantAccount(
  id: number
): Promise<TenantAccountOnlineResult> {
  return armadaRequest<TenantAccountOnlineResult>(
    "post",
    `/api/accounts/${id}/online`
  );
}

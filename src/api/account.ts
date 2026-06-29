import { armadaRequest } from "@/api/armada";
import { formatEpochMillis } from "@/utils/time";
import { toTenantAccountListParams } from "./account-mapping";

export type AccountState = 1 | 2 | 3 | 4 | 5;
export type LoginState = 1 | 2;
export type RiskStatus = 1 | 2 | 3;
export type AccountType = 1 | 2;
export type NumberSource = 1 | 2 | 3;
export type MuteStatus = 1 | 2;

export interface TenantAccount {
  id?: number;
  ws_phone?: string | null;
  protocol_address?: string | null;
  truth_ip?: string | null;
  account_type?: string | null;
  device_os?: string | null;
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
  dispatched_at?: string | null;
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
  account_type?: AccountType | "";
  accountType?: AccountType | "";
  protocol_id?: string;
  protocolId?: string;
  number_source?: NumberSource | "";
  numberSource?: NumberSource | "";
  channel_name?: string;
  channelName?: string;
  account_state?: AccountState | "";
  accountState?: AccountState | "";
  login_state?: LoginState | "";
  loginState?: LoginState | "";
  risk_status?: RiskStatus | "";
  riskStatus?: RiskStatus | "";
  mute_status?: MuteStatus | "6h" | "24h" | "";
  muteStatus?: MuteStatus | "6h" | "24h" | "";
  group_id?: number | "";
  accountGroupId?: number | "";
  assigned_service?: string;
  country?: string;
  ip_group_name?: string;
  truth_ip?: string;
  truthIp?: string;
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

export interface TenantAccountBatchCommandResult {
  requested: number;
  submitted: number;
  accepted: number;
  timeout: number;
  proxyRequired: number;
  error: number;
  remote: number;
  elapsedMs: number;
  results: unknown[];
  remoteRoutes: unknown[];
}

export interface BatchMigrateTenantAccountsInput {
  ids: number[];
  accountGroupId?: number | null;
  newGroupName?: string;
  newGroupRemark?: string;
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

function deviceOsLabel(value?: number | null): string | null {
  if (value === 1) return "安卓";
  if (value === 2) return "苹果";
  return null;
}

function muteStatusLabel(value?: number | null): string | null {
  if (value === 1) return "6h";
  if (value === 2) return "24h";
  return null;
}

function toTenantAccount(row: ArmadaTenantAccount): TenantAccount {
  return {
    id: row.id,
    ws_phone: row.wsPhone ?? null,
    protocol_address: row.protocolId ?? null,
    truth_ip: row.truthIp ?? null,
    account_type: accountTypeLabel(row.accountType),
    device_os: deviceOsLabel(row.deviceOs),
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
    dispatched_at: formatEpochMillis(row.dispatchedAt, null),
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
    { params: toTenantAccountListParams(params) }
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

export function batchOnlineTenantAccounts(
  ids: number[]
): Promise<TenantAccountBatchCommandResult> {
  return armadaRequest<TenantAccountBatchCommandResult>(
    "post",
    "/api/accounts/batch-online",
    { data: { ids } }
  );
}

export function batchOfflineTenantAccounts(
  ids: number[]
): Promise<TenantAccountBatchCommandResult> {
  return armadaRequest<TenantAccountBatchCommandResult>(
    "post",
    "/api/accounts/batch-offline",
    { data: { ids } }
  );
}

export function batchMigrateTenantAccountsToGroup(
  input: BatchMigrateTenantAccountsInput
): Promise<void> {
  const data: BatchMigrateTenantAccountsInput = {
    ids: input.ids,
    accountGroupId: input.accountGroupId ?? null
  };
  if (input.newGroupName) data.newGroupName = input.newGroupName;
  if (input.newGroupRemark) data.newGroupRemark = input.newGroupRemark;
  return armadaRequest<void>("post", "/api/accounts/batch-migrate-group", {
    data
  });
}

export function batchDeleteTenantAccounts(ids: number[]): Promise<void> {
  return armadaRequest<void>("post", "/api/accounts/batch-delete", {
    data: { ids }
  });
}

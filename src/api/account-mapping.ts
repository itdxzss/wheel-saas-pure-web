import type {
  AccountState,
  AccountType,
  LoginState,
  MuteStatus,
  NumberSource,
  RiskStatus,
  TenantAccountListQuery
} from "./account";

export interface BackendTenantAccountListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  phone?: string;
  accountType?: AccountType;
  protocolId?: string;
  numberSource?: NumberSource;
  channelName?: string;
  accountState?: AccountState;
  loginState?: LoginState;
  riskStatus?: RiskStatus;
  muteStatus?: MuteStatus;
  accountGroupId?: number;
  country?: string;
  truthIp?: string;
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function numberToUndefined<T extends number>(
  value?: T | "" | null
): T | undefined {
  return value === "" || value == null ? undefined : value;
}

function muteStatusToCode(
  value?: MuteStatus | "6h" | "24h" | "" | null
): MuteStatus | undefined {
  if (value === 1 || value === 2) return value;
  if (value === "6h") return 1;
  if (value === "24h") return 2;
  return undefined;
}

function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined)
  ) as Partial<T>;
}

export function toTenantAccountListParams(
  query: TenantAccountListQuery
): BackendTenantAccountListParams {
  return compact({
    page: query.page,
    pageSize: query.pageSize ?? query.page_size,
    keyword: trimToUndefined(query.keyword),
    phone: trimToUndefined(query.phone),
    accountType: numberToUndefined(query.accountType ?? query.account_type),
    protocolId: trimToUndefined(query.protocolId ?? query.protocol_id),
    numberSource: numberToUndefined(query.numberSource ?? query.number_source),
    channelName: trimToUndefined(query.channelName ?? query.channel_name),
    accountState: numberToUndefined(query.accountState ?? query.account_state),
    loginState: numberToUndefined(query.loginState ?? query.login_state),
    riskStatus: numberToUndefined(query.riskStatus ?? query.risk_status),
    muteStatus: muteStatusToCode(query.muteStatus ?? query.mute_status),
    accountGroupId: numberToUndefined(query.accountGroupId ?? query.group_id),
    country: trimToUndefined(query.country),
    truthIp: trimToUndefined(query.truthIp ?? query.truth_ip)
  });
}

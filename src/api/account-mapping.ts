import type {
  AccountState,
  AccountType,
  LoginState,
  MarketingOccupancyDisplayType,
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
  marketingOccupancyType?: MarketingOccupancyDisplayType;
  occupiedTaskKeyword?: string;
  occupiedBusinessType?: number;
  callable?: boolean;
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
  value?: MuteStatus | "" | null
): MuteStatus | undefined {
  if (value === 1 || value === 2 || value === 3) return value;
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
    truthIp: trimToUndefined(query.truthIp ?? query.truth_ip),
    marketingOccupancyType:
      (query.marketingOccupancyType ?? query.marketing_occupancy_type) ||
      undefined,
    occupiedTaskKeyword: trimToUndefined(
      query.occupiedTaskKeyword ?? query.occupied_task_keyword
    ),
    occupiedBusinessType: numberToUndefined(
      query.occupiedBusinessType ?? query.occupied_business_type
    ),
    callable: query.callable === "" ? undefined : query.callable
  });
}

/**
 * 将账号列表条件转换为批量操作筛选条件。
 *
 * 批量目标由后端扫描全部匹配账号，禁止携带当前页码和每页条数。
 */
export function toTenantAccountBatchQuery(
  query: TenantAccountListQuery
): Omit<BackendTenantAccountListParams, "page" | "pageSize"> {
  const {
    page: _page,
    pageSize: _pageSize,
    ...filters
  } = toTenantAccountListParams(query);
  return filters;
}

import { formatEpochMillis } from "@/utils/time";

export type ProxyTypeLabel = "HTTP" | "SOCKS5";

export interface BackendIpProxyRow {
  id: number;
  proxyAddress?: string | null;
  protocol?: number | null;
  protocolLabel?: string | null;
  region?: string | null;
  username?: string | null;
  password?: string | null;
  validAccountCount?: number | null;
  source?: string | null;
  createdAt?: number | null;
}

export interface IpManageRow {
  id: number;
  country: string;
  proxyType: string;
  proxyAddress: string;
  username: string;
  password: string;
  validAccountCount: number;
  source: string;
  createdAt: string;
}

export interface IpProxyListQuery {
  country?: string;
  proxyType?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}

export interface BackendIpProxyListParams {
  region?: string;
  protocol?: number;
  source?: string;
  page?: number;
  pageSize?: number;
}

const proxyProtocolCodes: Record<ProxyTypeLabel, number> = {
  HTTP: 1,
  SOCKS5: 2
};

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function proxyTypeToProtocol(value?: string): number | undefined {
  if (value === "HTTP" || value === "SOCKS5") {
    return proxyProtocolCodes[value];
  }
  return undefined;
}

function protocolLabelOf(code?: number | null): string {
  if (code === proxyProtocolCodes.HTTP) return "HTTP";
  if (code === proxyProtocolCodes.SOCKS5) return "SOCKS5";
  return code == null ? "" : String(code);
}

export function normalizeIpProxyRow(row: BackendIpProxyRow): IpManageRow {
  return {
    id: row.id,
    country: row.region ?? "",
    proxyType: row.protocolLabel || protocolLabelOf(row.protocol),
    proxyAddress: row.proxyAddress ?? "",
    username: row.username ?? "",
    password: row.password ?? "",
    validAccountCount: row.validAccountCount ?? 0,
    source: row.source ?? "",
    createdAt: formatEpochMillis(row.createdAt)
  };
}

export function toIpProxyListParams(
  query: IpProxyListQuery
): BackendIpProxyListParams {
  return {
    region: trimToUndefined(query.country),
    protocol: proxyTypeToProtocol(query.proxyType),
    source: trimToUndefined(query.source),
    page: query.page,
    pageSize: query.pageSize
  };
}

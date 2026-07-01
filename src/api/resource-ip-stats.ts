import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import {
  normalizeIpAllocationMode,
  normalizeProtocolLabel,
  proxyTypeToProtocol,
  type IpAllocationMode,
  type ProxyTypeLabel
} from "@/api/resource-ip-mapping";

export type IpStatsRisk =
  | "no_ip"
  | "normal"
  | "no_idle"
  | "low_available"
  | "high_unavailable";

export type IpStatsSortField =
  | "totalIpCount"
  | "inUseIpCount"
  | "idleIpCount"
  | "unavailableIpCount"
  | "availableRate"
  | "unavailableRate";

export type IpStatsSortOrder = "asc" | "desc";

export interface IpStatsSummary {
  totalIpCount: number;
  inUseIpCount: number;
  idleIpCount: number;
  unavailableIpCount: number;
  coveredRegionCount: number;
  supportedCountryCount: number;
  noIpCountryCount: number;
}

export interface IpCountryStatsRow {
  region: string;
  totalIpCount: number;
  inUseIpCount: number;
  idleIpCount: number;
  unavailableIpCount: number;
  availableRate: number;
  unavailableRate: number;
  resourceRisk: IpStatsRisk;
  resourceRiskLabel: string;
}

export interface IpStatsDetailRow {
  id: number;
  proxyHost: string;
  proxyPort: number | null;
  proxyAddress: string;
  protocol: number | null;
  protocolLabel: string;
  region: string;
  status: number | null;
  statusLabel: string;
  boundAccountId: number | null;
  source: string;
  allocationMode: IpAllocationMode | string | null;
  allocationModeLabel: string;
  ownership: number | null;
  ownershipLabel: string;
  lastSampleCheckAt: number | null;
  createdAt: number | null;
  boundAt: number | null;
}

export interface IpStatsCountryQuery {
  keyword?: string;
  proxyType?: ProxyTypeLabel | "";
  allocationMode?: IpAllocationMode | "";
  source?: string;
  risk?: IpStatsRisk | "";
  sortField?: IpStatsSortField;
  sortOrder?: IpStatsSortOrder;
  page?: number;
  pageSize?: number;
}

export interface IpStatsRegionProxyQuery {
  status?: number | "";
  proxyType?: ProxyTypeLabel | "";
  allocationMode?: IpAllocationMode | "";
  source?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

interface IpStatsCountryParams {
  keyword?: string;
  protocol?: number;
  allocationMode?: IpAllocationMode;
  source?: string;
  risk?: IpStatsRisk;
  sortField?: IpStatsSortField;
  sortOrder?: IpStatsSortOrder;
  page?: number;
  pageSize?: number;
}

interface IpStatsRegionProxyParams {
  status?: number;
  protocol?: number;
  allocationMode?: IpAllocationMode;
  source?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toCountryStatsParams(
  query: IpStatsCountryQuery
): IpStatsCountryParams {
  return {
    keyword: trimToUndefined(query.keyword),
    protocol: proxyTypeToProtocol(query.proxyType),
    allocationMode: normalizeIpAllocationMode(query.allocationMode),
    source: trimToUndefined(query.source),
    risk: query.risk || undefined,
    sortField: query.sortField,
    sortOrder: query.sortOrder,
    page: query.page,
    pageSize: query.pageSize
  };
}

function toRegionProxyParams(
  query: IpStatsRegionProxyQuery
): IpStatsRegionProxyParams {
  return {
    status: typeof query.status === "number" ? query.status : undefined,
    protocol: proxyTypeToProtocol(query.proxyType),
    allocationMode: normalizeIpAllocationMode(query.allocationMode),
    source: trimToUndefined(query.source),
    keyword: trimToUndefined(query.keyword),
    page: query.page,
    pageSize: query.pageSize
  };
}

export function getIpStatsSummary(): Promise<IpStatsSummary> {
  return armadaRequest<IpStatsSummary>("get", "/api/ip-proxies/stats/summary");
}

export function listIpStatsCountries(
  query: IpStatsCountryQuery = {}
): Promise<PageResponse<IpCountryStatsRow>> {
  return armadaRequest<PageResponse<IpCountryStatsRow>>(
    "get",
    "/api/ip-proxies/stats/countries",
    { params: toCountryStatsParams(query) }
  );
}

export function listIpStatsRegionProxies(
  region: string,
  query: IpStatsRegionProxyQuery = {}
): Promise<PageResponse<IpStatsDetailRow>> {
  return armadaRequest<PageResponse<IpStatsDetailRow>>(
    "get",
    `/api/ip-proxies/stats/countries/${encodeURIComponent(region)}/proxies`,
    { params: toRegionProxyParams(query) }
  ).then(result => ({
    ...result,
    list: (result.list ?? []).map(row => ({
      ...row,
      protocolLabel: normalizeProtocolLabel(row.protocolLabel) ?? row.protocolLabel
    }))
  }));
}

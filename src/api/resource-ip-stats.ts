import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import type { IpProxyCheckResult } from "@/api/resource-ip";
import { http } from "@/utils/http";
import type { PureHttpResponse } from "@/utils/http/types.d";
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
  lastSampleCheckAt: number | null;
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
  failCount: number | null;
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
  ipKeyword?: string;
  accountKeyword?: string;
  page?: number;
  pageSize?: number;
}

export interface IpStatsCountrySampleCheckResult {
  region: string;
  sampleCount: number;
  lastSampleCheckAt: number;
  results: IpProxyCheckResult[];
}

export interface IpStatsCountrySampleStats {
  region: string;
  totalIpCount: number;
  availableIpCount: number;
  inUseIpCount: number;
  unavailableIpCount: number;
}

export interface IpStatsCountryExport {
  filename: string;
  blob: Blob;
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
  ipKeyword?: string;
  accountKeyword?: string;
  page?: number;
  pageSize?: number;
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function headerValue(
  headers: PureHttpResponse["headers"],
  name: string
): string | undefined {
  const getter = headers as { get?: (key: string) => unknown };
  const viaGetter = getter.get?.(name);
  if (typeof viaGetter === "string") return viaGetter;

  const record = headers as Record<string, unknown>;
  const direct = record[name] ?? record[name.toLowerCase()];
  return typeof direct === "string" ? direct : undefined;
}

function decodeFilename(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function filenameFromContentDisposition(value?: string): string | undefined {
  if (!value) return undefined;

  const encoded = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(value);
  if (encoded?.[2]) {
    return decodeFilename(encoded[2]);
  }

  const plain = /filename=("?)([^";]+)\1/i.exec(value);
  return plain?.[2];
}

function fallbackCountryExportFilename(region: string): string {
  const safeRegion = region.trim().replace(/[\\/:*?"<>|\x00-\x1f\x7f]+/g, "_");
  return `ip-proxies-${safeRegion || "country"}.txt`;
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
    ipKeyword: trimToUndefined(query.ipKeyword),
    accountKeyword: trimToUndefined(query.accountKeyword),
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

export function sampleCheckIpStatsCountry(
  region: string,
  sampleCount: number
): Promise<IpStatsCountrySampleCheckResult> {
  // 国家级抽检会真实访问外部代理,需要给真实代理探测留足时间。
  return armadaRequest<IpStatsCountrySampleCheckResult>(
    "post",
    `/api/ip-proxies/stats/countries/${encodeURIComponent(region)}/sample-check`,
    { data: { sampleCount } },
    { timeout: 120000 }
  );
}

export function getIpStatsCountrySampleStats(
  region: string
): Promise<IpStatsCountrySampleStats> {
  return armadaRequest<IpStatsCountrySampleStats>(
    "get",
    `/api/ip-proxies/stats/countries/${encodeURIComponent(region)}/sample-check/stats`
  );
}

export function exportIpStatsCountryProxies(
  region: string
): Promise<IpStatsCountryExport> {
  let filename: string | undefined;
  return http
    .request<Blob>(
      "get",
      `/api/ip-proxies/stats/countries/${encodeURIComponent(region)}/export`,
      { responseType: "blob" },
      {
        beforeResponseCallback: response => {
          filename = filenameFromContentDisposition(
            headerValue(response.headers, "Content-Disposition")
          );
        }
      }
    )
    .then(blob => ({
      filename: filename || fallbackCountryExportFilename(region),
      blob
    }));
}

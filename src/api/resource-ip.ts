import { armadaRequest } from "@/api/armada";
import type { PageResponse } from "@/api/account";
import {
  normalizeIpProxyRow,
  proxyTypeToProtocol,
  toIpProxyListParams,
  type BackendIpProxyRow,
  type IpAllocationMode,
  type IpManageRow,
  type IpProxyListQuery,
  type ProxyTypeLabel
} from "@/api/resource-ip-mapping";

export interface IpCountryOption {
  value: string;
  iso2: string | null;
  nameZh: string;
  phonePrefix: string;
  flag: string;
  virtual: boolean;
}

interface IpCountryOptionsResponse {
  rows?: IpCountryOption[] | null;
}

/**
 * TXT 导入不再携带国家字段。
 *
 * 后端根据 allocationMode 决定落库策略:smart 会检测出口国家,mixed 会进入混合分组。
 */
export interface IpProxyImportInput {
  allocationMode: IpAllocationMode;
  proxyType: ProxyTypeLabel;
  source: string;
  text: string;
}

export interface IpProxyImportResult {
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: string[];
}

export interface IpProxyCheckResult {
  id: number;
  checkStatus: "success" | "failed";
  connectionStatus?: string | null;
  whatsappStatus?: string | null;
  outboundIp?: string | null;
  countryCode?: string | null;
  region?: string | null;
  location?: string | null;
  isp?: string | null;
  detectedLatitude?: number | null;
  detectedLongitude?: number | null;
  checkedAt?: number | null;
  errorMessage?: string | null;
}

/** 查询 IP 管理列表,并把后端 nullable 字段规整成页面行模型。 */
export function listIpProxies(
  query: IpProxyListQuery = {}
): Promise<PageResponse<IpManageRow>> {
  return armadaRequest<PageResponse<BackendIpProxyRow>>(
    "get",
    "/api/ip-proxies",
    { params: toIpProxyListParams(query) }
  ).then(result => ({
    ...result,
    list: result.list?.map(normalizeIpProxyRow) ?? []
  }));
}

export function importIpProxies(
  input: IpProxyImportInput
): Promise<IpProxyImportResult> {
  // 不发送 countryValue:导入国家由后端真实检测结果决定。
  return armadaRequest<IpProxyImportResult>("post", "/api/ip-proxies/import", {
    data: {
      allocationMode: input.allocationMode,
      protocol: proxyTypeToProtocol(input.proxyType),
      source: input.source,
      text: input.text
    }
  });
}

/** 对单条代理做真实出口检测,无 request body。 */
export function checkIpProxy(id: number): Promise<IpProxyCheckResult> {
  return armadaRequest<IpProxyCheckResult>(
    "post",
    `/api/ip-proxies/${id}/check`,
    undefined,
    { timeout: 30000 }
  );
}

/** 批量检测由后端限制最多 20 条;前端调用方也会提前拦截超量。 */
export function batchCheckIpProxies(
  ids: number[]
): Promise<IpProxyCheckResult[]> {
  return armadaRequest<IpProxyCheckResult[]>(
    "post",
    "/api/ip-proxies/check",
    {
      data: { ids }
    },
    { timeout: 120000 }
  );
}

export function batchDeleteIpProxies(ids: number[]): Promise<void> {
  return armadaRequest<void>("post", "/api/ip-proxies/batch-delete", {
    data: { ids }
  });
}

export async function listTenantIpRegions(): Promise<string[]> {
  return armadaRequest<string[]>("get", "/api/ip-proxies/regions");
}

/** 国家主数据仍用于列表筛选,不用于导入弹窗。 */
export async function listIpCountryOptions(): Promise<IpCountryOption[]> {
  const result = await armadaRequest<IpCountryOptionsResponse>(
    "get",
    "/api/admin/countries/options",
    { params: { scope: "ip" } }
  );
  return result.rows ?? [];
}

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
  continentCode?: string | null;
}

interface IpCountryOptionsResponse {
  rows?: IpCountryOption[] | null;
}

function normalizeCountryFlag(
  flag: string | null | undefined,
  iso2: string | null
): string {
  const rawFlag = flag?.trim() ?? "";
  const code = rawFlag || iso2?.trim() || "";
  if (!/^[a-z]{2}$/i.test(code)) return rawFlag;
  return String.fromCodePoint(
    ...Array.from(code.toUpperCase(), letter => letter.charCodeAt(0) + 127397)
  );
}

export interface IpProxyImportInput {
  countryValue: string;
  allocationMode?: IpAllocationMode;
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

export interface IpProxyImportSampleRow {
  lineNo: number;
  host: string;
  port: number;
  passed: boolean;
  connectionStatus?: "success" | "failed" | string | null;
  whatsappStatus?: string | null;
  outboundIp?: string | null;
  countryCode?: string | null;
  location?: string | null;
  isp?: string | null;
  checkedAt?: number | null;
  detectedLatitude?: number | null;
  detectedLongitude?: number | null;
  errorMessage?: string | null;
}

export interface IpProxyImportSampleCheckResult {
  passed: boolean;
  sampleSize: number;
  samples: IpProxyImportSampleRow[];
  errors: string[];
}

export interface IpProxyCheckResult {
  id: number;
  checkStatus: "success" | "failed";
  connectionStatus?: string | null;
  whatsappStatus?: string | null;
  outboundIp?: string | null;
  countryCode?: string | null;
  detectedRegion?: string | null;
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

function importAllocationModeOf(input: IpProxyImportInput): IpAllocationMode {
  return input.countryValue === "MIXED"
    ? "mixed"
    : (input.allocationMode ?? "smart");
}

export function sampleCheckIpProxyImport(
  input: IpProxyImportInput
): Promise<IpProxyImportSampleCheckResult> {
  return armadaRequest<IpProxyImportSampleCheckResult>(
    "post",
    "/api/ip-proxies/import/sample-check",
    {
      data: {
        allocationMode: importAllocationModeOf(input),
        countryValue: input.countryValue,
        protocol: proxyTypeToProtocol(input.proxyType),
        source: input.source,
        text: input.text
      }
    },
    { timeout: 120000 }
  );
}

export function importIpProxies(
  input: IpProxyImportInput
): Promise<IpProxyImportResult> {
  return armadaRequest<IpProxyImportResult>(
    "post",
    "/api/ip-proxies/import",
    {
      data: {
        allocationMode: importAllocationModeOf(input),
        countryValue: input.countryValue,
        protocol: proxyTypeToProtocol(input.proxyType),
        source: input.source,
        text: input.text
      }
    },
    { timeout: 120000 }
  );
}

/** 对单条代理做真实出口检测,无 request body。 */
export function checkIpProxy(id: number): Promise<IpProxyCheckResult> {
  // 单条检测由用户盯着弹框等待,产品要求给真实代理探测留足 20 秒。
  return armadaRequest<IpProxyCheckResult>(
    "post",
    `/api/ip-proxies/${id}/check`,
    undefined,
    { timeout: 20000 }
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

async function listCountryOptions(
  scope: "ip" | "marketing-export"
): Promise<IpCountryOption[]> {
  const result = await armadaRequest<IpCountryOptionsResponse>(
    "get",
    "/api/admin/countries/options",
    { params: { scope } }
  );
  return (result.rows ?? []).map(country => ({
    ...country,
    flag: normalizeCountryFlag(country.flag, country.iso2)
  }));
}

/** IP 页面只展示支持代理资源的国家以及混合选项。 */
export function listIpCountryOptions(): Promise<IpCountryOption[]> {
  return listCountryOptions("ip");
}

/** 群所属国家筛选使用全部真实国家,不受 IP 资源支持范围限制。 */
export function listGroupCountryOptions(): Promise<IpCountryOption[]> {
  return listCountryOptions("marketing-export").then(rows =>
    rows.filter(row => !row.virtual && row.iso2)
  );
}

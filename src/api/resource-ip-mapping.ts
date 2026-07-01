import { formatEpochMillis } from "@/utils/time";

export type ProxyTypeLabel = "HTTP" | "SOCKS5";
export type IpAllocationMode = "smart" | "mixed";

/** 后端 IpProxyVO 的前端镜像;字段保持后端 camelCase,只在 mapping 层做页面规整。 */
export interface BackendIpProxyRow {
  id: number;
  proxyAddress?: string | null;
  protocol?: number | null;
  protocolLabel?: string | null;
  region?: string | null;
  status?: number | null;
  statusLabel?: string | null;
  ownership?: number | null;
  ownershipLabel?: string | null;
  username?: string | null;
  password?: string | null;
  validAccountCount?: number | null;
  source?: string | null;
  remark?: string | null;
  allocationMode?: string | null;
  allocationModeLabel?: string | null;
  lastSampleCheckAt?: number | null;
  detectedCountryCode?: string | null;
  outboundIp?: string | null;
  detectedLocation?: string | null;
  detectedIsp?: string | null;
  detectedLatitude?: number | null;
  detectedLongitude?: number | null;
  checkFailCount?: number | null;
  lastCheckError?: string | null;
  createdAt?: number | null;
}

/** IP 管理表格使用的非 nullable 行模型,避免模板里到处处理 null。 */
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

/** 页面筛选表单模型。country 是国家下拉 value,source 是供应商/批次模糊搜索。 */
export interface IpProxyListQuery {
  country?: string;
  region?: string;
  proxyType?: string;
  source?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface BackendIpProxyListParams {
  countryValue?: string;
  region?: string;
  protocol?: number;
  source?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

const proxyProtocolCodes: Record<ProxyTypeLabel, number> = {
  HTTP: 1,
  SOCKS5: 2
};

const ipAllocationModes: Record<IpAllocationMode, string> = {
  smart: "智能分配",
  mixed: "混合国家"
};

/** 空字符串不传给后端,让后端使用默认筛选语义。 */
function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** 列表筛选和导入弹框都使用 countryValue,后端统一映射为当前 region 快照。 */
function toCountryValue(value?: string | null): string | undefined {
  const trimmed = trimToUndefined(value);
  if (!trimmed) return undefined;
  return trimmed === "混合（不限国家）" ? "MIXED" : trimmed;
}

/** UI 固定展示 SOCKS5,后端协议码仍是历史的 2。 */
export function proxyTypeToProtocol(value?: string): number | undefined {
  if (value === "HTTP" || value === "SOCKS5") {
    return proxyProtocolCodes[value];
  }
  if (value === "SOCKETS") {
    return proxyProtocolCodes.SOCKS5;
  }
  return undefined;
}

function protocolLabelOf(code?: number | null): string {
  if (code === proxyProtocolCodes.HTTP) return "HTTP";
  if (code === proxyProtocolCodes.SOCKS5) return "SOCKS5";
  return code == null ? "" : String(code);
}

/** 兼容后端或历史数据中可能出现的 SOCKETS 文案,页面统一显示 SOCKS5。 */
export function normalizeProtocolLabel(
  label?: string | null
): string | undefined {
  if (!label) return undefined;
  return label === "SOCKETS" ? "SOCKS5" : label;
}

/** 兼容原型/历史接口中的 mixed_country,页面统一使用 mixed。 */
export function normalizeIpAllocationMode(
  value?: string | null
): IpAllocationMode | undefined {
  if (!value) return undefined;
  if (value === "smart" || value === "mixed") return value;
  return value === "mixed_country" ? "mixed" : undefined;
}

export function ipAllocationModeLabelOf(value?: string | null): string {
  const mode = normalizeIpAllocationMode(value);
  return mode ? ipAllocationModes[mode] : value || "";
}

/** 后端密码按产品要求明文返回,这里只透传不脱敏。 */
export function normalizeIpProxyRow(row: BackendIpProxyRow): IpManageRow {
  return {
    id: row.id,
    country: row.region ?? "",
    proxyType:
      normalizeProtocolLabel(row.protocolLabel) ||
      protocolLabelOf(row.protocol),
    proxyAddress: row.proxyAddress ?? "",
    username: row.username ?? "",
    password: row.password ?? "",
    validAccountCount: row.validAccountCount ?? 0,
    source: row.source ?? "",
    createdAt: formatEpochMillis(row.createdAt)
  };
}

/** 后端列表接口同时兼容 region/countryValue;新筛选优先走 countryValue。 */
export function toIpProxyListParams(
  query: IpProxyListQuery
): BackendIpProxyListParams {
  return {
    countryValue: toCountryValue(query.country),
    region: trimToUndefined(query.region),
    protocol: proxyTypeToProtocol(query.proxyType),
    source: trimToUndefined(query.source),
    keyword: trimToUndefined(query.keyword),
    page: query.page,
    pageSize: query.pageSize
  };
}

import type { IpStatsRisk } from "@/api/resource-ip-stats";
import type {
  IpAllocationMode,
  ProxyTypeLabel
} from "@/api/resource-ip-mapping";

export const proxyTypeOptions: ProxyTypeLabel[] = ["HTTP", "SOCKS5"];

export const allocationModeOptions: Array<{
  label: string;
  value: IpAllocationMode | "";
}> = [
  { label: "全部", value: "" },
  { label: "智能分配", value: "smart" },
  { label: "混合分组", value: "mixed" }
];

export const riskOptions: Array<{
  label: string;
  value: IpStatsRisk | "";
}> = [
  { label: "全部", value: "" },
  { label: "正常", value: "normal" },
  { label: "无 IP", value: "no_ip" },
  { label: "无空闲 IP", value: "no_idle" },
  { label: "可用不足", value: "low_available" },
  { label: "不可用偏高", value: "high_unavailable" }
];

export const detailStatusOptions: Array<{
  label: string;
  value: number | "";
}> = [
  { label: "全部", value: "" },
  { label: "空闲", value: 1 },
  { label: "使用中", value: 2 },
  { label: "不可用", value: 3 }
];

export const ipStatsCountryColumns: TableColumnList = [
  { label: "国家", prop: "region", minWidth: 160 },
  { label: "IP 总数", prop: "totalIpCount", width: 120 },
  { label: "使用中 IP 数", prop: "inUseIpCount", width: 130 },
  { label: "空闲 IP 数", prop: "idleIpCount", width: 120 },
  { label: "不可用 IP 数", prop: "unavailableIpCount", width: 130 },
  { label: "可用率", prop: "availableRate", width: 120 },
  { label: "不可用率", prop: "unavailableRate", width: 120 },
  { label: "最近抽检时间", prop: "lastSampleCheckAt", width: 180 },
  { label: "资源状态", prop: "resourceRisk", width: 140 },
  { label: "操作", prop: "operation", fixed: "right", width: 250 }
];

export const ipStatsDetailColumns: TableColumnList = [
  { label: "IP 地址", prop: "proxyHost", minWidth: 160 },
  { label: "端口", prop: "proxyPort", width: 100 },
  { label: "协议类型", prop: "protocolLabel", width: 110 },
  { label: "分配方式", prop: "allocationModeLabel", width: 120 },
  { label: "来源", prop: "source", minWidth: 140 },
  { label: "状态", prop: "statusLabel", width: 110 },
  { label: "当前使用账号", prop: "boundAccountId", minWidth: 130 },
  { label: "最近抽检时间", prop: "lastSampleCheckAt", width: 180 },
  { label: "失败次数", prop: "failCount", width: 100 },
  { label: "操作", prop: "operation", fixed: "right", width: 90 }
];

export function riskTagType(
  risk: IpStatsRisk
): "success" | "warning" | "danger" | "info" {
  if (risk === "normal") return "success";
  if (risk === "no_ip" || risk === "high_unavailable") return "danger";
  return risk === "no_idle" || risk === "low_available" ? "warning" : "info";
}

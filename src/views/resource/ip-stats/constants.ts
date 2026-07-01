import type { IpStatsRisk } from "@/api/resource-ip-stats";
import type { ProxyTypeLabel } from "@/api/resource-ip-mapping";

export const proxyTypeOptions: ProxyTypeLabel[] = ["HTTP", "SOCKETS"];

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
  { label: "资源状态", prop: "resourceRisk", width: 140 },
  { label: "操作", prop: "operation", fixed: "right", width: 120 }
];

export const ipStatsDetailColumns: TableColumnList = [
  { label: "IP 地址", prop: "proxyAddress", minWidth: 180 },
  { label: "协议类型", prop: "protocolLabel", width: 110 },
  { label: "来源", prop: "source", minWidth: 140 },
  { label: "状态", prop: "statusLabel", width: 110 },
  { label: "当前使用账号", prop: "boundAccountId", minWidth: 130 },
  { label: "归属", prop: "ownershipLabel", width: 120 },
  { label: "最近抽检时间", prop: "lastSampleCheckAt", width: 180 },
  { label: "创建时间", prop: "createdAt", width: 180 },
  { label: "绑定时间", prop: "boundAt", width: 180 }
];

export function riskTagType(risk: IpStatsRisk): "success" | "warning" | "danger" | "info" {
  if (risk === "normal") return "success";
  if (risk === "no_ip" || risk === "high_unavailable") return "danger";
  return risk === "no_idle" || risk === "low_available" ? "warning" : "info";
}

import type {
  PullTaskGroupSource,
  PullTaskResourceShortage,
  PullTaskResourceShortageType,
  PullTaskType
} from "@/api/pull-task";

const metricFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

const shortageNames: Record<PullTaskResourceShortageType, string> = {
  TARGET_DATA: "目标数据",
  PULLER: "拉手",
  WATER_ARMY: "水军",
  ADMIN: "管理员",
  STATION: "站台",
  MARKETING_ADMIN: "营销管理员"
};

export function displayMetric(value?: number | null): string {
  return value == null ? "--" : metricFormatter.format(value);
}

export function displayRate(value?: number | null): string {
  return value == null ? "--" : `${value.toFixed(1)}%`;
}

export function progressPercentage(
  completed?: number | null,
  total?: number | null
): number | null {
  if (completed == null || total == null || total <= 0) return null;
  return Math.min(100, Math.max(0, (completed / total) * 100));
}

export function taskTypeLabel(type?: PullTaskType | null): string {
  if (type === "STANDARD") return "普通拉群";
  return type === "GROUP_MARKETING" ? "拉群营销" : "--";
}

export function groupSourceLabel(source?: PullTaskGroupSource | null): string {
  if (source === "HISTORICAL") return "历史老群";
  if (source === "SELF_COLLECTED") return "自收群";
  if (source === "MIXED") return "混合来源";
  return "--";
}

export function resourceShortageLabel(
  shortage: PullTaskResourceShortage
): string {
  const name = shortageNames[shortage.type];
  return `${name}不足`;
}

export function shouldShowUnknownMessage(value?: number | null): boolean {
  return value != null && value > 0;
}

import type {
  GroupPullMarketingGroupSource,
  GroupPullMarketingResourceShortage,
  GroupPullMarketingResourceShortageType,
  GroupPullMarketingTaskType
} from "@/api/group-pull-marketing";

const metricFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

const shortageNames: Record<GroupPullMarketingResourceShortageType, string> = {
  TARGET_DATA: "目标数据",
  PULLER: "拉手",
  WATER_ARMY: "水军",
  ADMIN: "潜水管理员",
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

export function taskTypeLabel(
  type?: GroupPullMarketingTaskType | null
): string {
  return type === "GROUP_MARKETING" ? "拉群营销" : "--";
}

export function groupSourceLabel(
  source?: GroupPullMarketingGroupSource | null
): string {
  if (source === "HISTORICAL") return "历史老群";
  if (source === "SELF_COLLECTED") return "自收群";
  if (source === "MIXED") return "混合来源";
  return "--";
}

export function resourceShortageLabel(
  shortage: GroupPullMarketingResourceShortage
): string {
  const name = shortageNames[shortage.type];
  return shortage.shortageCount == null
    ? `${name}不足`
    : `缺${name}${displayMetric(shortage.shortageCount)}个`;
}

import type {
  MarketingTaskAccountTargetRow,
  MarketingTaskGroupStatRow
} from "@/api/marketing-task";

export function firstGroup(
  row: MarketingTaskAccountTargetRow
): MarketingTaskGroupStatRow | null {
  return row.groups[0] ?? null;
}

export function groupDisplayName(group: MarketingTaskGroupStatRow): string {
  return group.groupName || group.groupJid || "未命名群组";
}

export function firstGroupDisplayName(
  row: MarketingTaskAccountTargetRow
): string {
  const group = firstGroup(row);
  return group ? groupDisplayName(group) : "-";
}

export function hasGroupRows(row: MarketingTaskAccountTargetRow): boolean {
  return row.groups.length > 0;
}

export function firstGroupSummary(
  row: MarketingTaskAccountTargetRow
): string {
  const group = firstGroup(row);
  if (!group) return "暂无发送记录";
  return `${groupDisplayName(group)} · ${group.sentMessageCount}条`;
}

export function groupCountLabel(row: MarketingTaskAccountTargetRow): string {
  return row.groups.length > 1 ? `共 ${row.groups.length} 个群` : "";
}

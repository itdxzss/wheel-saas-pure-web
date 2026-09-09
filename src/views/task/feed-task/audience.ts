import type { FeedStatusAudience } from "@/api/feed-task";

export function audienceLabel(audience?: FeedStatusAudience | null): string {
  if (!audience) return "待获取状态";
  return (
    {
      PENDING: "待准备",
      SYNCING: "准备中",
      READY: "已就绪",
      EMPTY: "无候选受众",
      FAILED: "准备失败",
      UNAVAILABLE: "不可准备"
    }[audience.status] ?? "未知状态"
  );
}
export function audienceSource(audience?: FeedStatusAudience | null): string {
  return audience?.source === "CLOUD_LID"
    ? "云端 LID"
    : audience?.source === "ADDRESS_BOOK"
      ? "具名通讯录"
      : "暂无来源";
}
export function canPrepareAudience(
  audience?: FeedStatusAudience | null
): boolean {
  return (
    audience?.source === "CLOUD_LID" &&
    ["PENDING", "FAILED", "EMPTY", "READY"].includes(audience.status)
  );
}

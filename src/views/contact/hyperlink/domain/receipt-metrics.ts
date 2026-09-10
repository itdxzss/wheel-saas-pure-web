import type {
  ContactRecipientQuery,
  ContactTaskMetrics,
  ContactTaskRecipient,
  ContactTaskStats
} from "@/api/contact-task";

export const receiptFilters = [
  { value: "ALL", label: "全部" },
  { value: "PENDING", label: "待处理" },
  { value: "SENDING", label: "处理中" },
  { value: "CONFIRMED", label: "至少发送确认" },
  { value: "SINGLE_ONLY", label: "仅单勾" },
  { value: "DELIVERED", label: "至少送达" },
  { value: "DELIVERED_UNREAD", label: "已送达未读" },
  { value: "READ", label: "已读" },
  { value: "FAILED", label: "明确失败" },
  { value: "UNKNOWN", label: "结果未知" },
  { value: "SKIPPED", label: "已跳过" }
] as const;
export type ReceiptFilter = (typeof receiptFilters)[number]["value"];

export const sendStatusLabels: Record<string, string> = {
  PENDING: "待处理",
  SENDING: "处理中",
  SUCCESS: "已发送",
  FAILED: "明确失败",
  UNKNOWN: "结果未知",
  SKIPPED: "已跳过（未执行）"
};
export const accountStateLabels: Record<string, string> = {
  PREPARING: "准备名单",
  PENDING: "待发送",
  RUNNING: "发送中",
  DONE: "已结束",
  FAILED: "执行异常",
  SKIPPED: "已跳过"
};

/** 分母为零或尚未获得数据时不编造比率；矛盾数据不截成 100%。 */
export function metricRate(numerator?: number, denominator?: number): string {
  if (numerator == null || denominator == null || denominator <= 0) return "—";
  if (numerator < 0 || numerator > denominator) return "数据待核对";
  return `${((numerator / denominator) * 100).toFixed(2)}%`;
}

/** 仅计算处理进度；未知结果属于自动处理终态，不代表发送成功。 */
export function processedPercent(metrics?: ContactTaskMetrics): number | null {
  if (
    !metrics ||
    metrics.plannedNum <= 0 ||
    metrics.inconsistentNum > 0 ||
    metrics.processedNum > metrics.plannedNum
  )
    return null;
  return Math.round((metrics.processedNum / metrics.plannedNum) * 100);
}

/** 统计卡与明细筛选共用定义，区分累计和互斥回执状态。 */
export function receiptQuery(filter: ReceiptFilter): ContactRecipientQuery {
  if (filter === "ALL") return {};
  if (["PENDING", "SENDING", "FAILED", "UNKNOWN", "SKIPPED"].includes(filter))
    return { sendStatus: filter };
  return { receiptStatus: filter as ContactRecipientQuery["receiptStatus"] };
}

/** 回执状态只依赖已确认事实，未知不能画单勾。 */
export function receiptLabel(
  row: Pick<ContactTaskRecipient, "sendStatus" | "deliveredAt" | "readAt">
): string {
  if (row.readAt != null) return "✓✓ 已读";
  if (row.deliveredAt != null) return "✓✓ 已送达";
  if (row.sendStatus === "SUCCESS") return "✓ 已发送";
  return "尚无确认回执";
}

/** 即使发送结束，也允许在当前可见页面等待未知、送达和已读回执。 */
export function needsReceiptRefresh(stats?: ContactTaskStats): boolean {
  if (!stats) return false;
  return (
    stats.runStatus === 1 ||
    stats.metrics.unknownNum > 0 ||
    stats.metrics.confirmedNum > stats.metrics.readNum
  );
}

/** 列表 CSV 使用相同事实，不把旧账号失败数标成封号。 */
export function receiptCsv(
  stats?: ContactTaskStats
): Record<string, number | string> {
  const m = stats?.metrics;
  return {
    计划条数: m?.plannedNum ?? "",
    已处理条数: m?.processedNum ?? "",
    已尝试条数: m?.attemptedNum ?? "",
    累计发送确认: m?.confirmedNum ?? "",
    累计送达: m?.deliveredNum ?? "",
    已读: m?.readNum ?? "",
    明确失败: m?.failedNum ?? "",
    结果未知: m?.unknownNum ?? "",
    已跳过: m?.skippedNum ?? "",
    送达率: m?.inconsistentNum
      ? "数据待核对"
      : metricRate(m?.deliveredNum, m?.confirmedNum),
    送达后已读率: m?.inconsistentNum
      ? "数据待核对"
      : metricRate(m?.readNum, m?.deliveredNum),
    待处理条数: m?.pendingNum ?? "",
    处理中条数: m?.sendingNum ?? "",
    选中账号数: stats?.accounts.selectedAccountNum ?? "",
    有收件人账号数: stats?.accounts.readyAccountNum ?? "",
    执行异常账号数: stats?.accounts.failedAccountNum ?? ""
  };
}

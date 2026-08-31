import type {
  HyperlinkMarketingCountryPair,
  HyperlinkMarketingGranularity,
  HyperlinkMarketingMetric
} from "@/api/hyperlink-analysis";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export interface HyperlinkMarketingOverview {
  sendTotal: number;
  successNum: number;
  deliveredNum: number;
  usedAccountCount: number;
  bannedAccountCount: number;
  successRate: number;
  deliveryRate: number;
  clickUvNum: number;
  clickRate: number;
  avgSendPerAccount: number;
  banRate: number;
  buckets: number;
  sendPerBucket: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatMarketingDate(
  value: Date,
  granularity: HyperlinkMarketingGranularity
): string {
  const date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  if (granularity === "day") return date;
  return `${date} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

export function createMarketingDateRange(
  granularity: HyperlinkMarketingGranularity,
  span: number = granularity === "day" ? 7 : 24,
  now = new Date()
): [string, string] {
  const end = new Date(now);
  if (granularity === "day") {
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - Math.max(0, span - 1));
    return [formatMarketingDate(start, "day"), formatMarketingDate(end, "day")];
  }
  const start = new Date(
    end.getTime() - Math.max(0, Math.max(1, span) - 1) * HOUR_MS
  );
  return [formatMarketingDate(start, "hour"), formatMarketingDate(end, "hour")];
}

function parseMarketingDate(value: string): number {
  const normalized = value.includes(" ")
    ? value.replace(" ", "T")
    : `${value}T00:00:00`;
  return new Date(normalized).getTime();
}

function inclusiveCalendarDays(from: string, to: string): number {
  const start = from.slice(0, 10).split("-").map(Number);
  const end = to.slice(0, 10).split("-").map(Number);
  if (start.length !== 3 || end.length !== 3) return Number.NaN;
  return (
    Math.floor(
      (Date.UTC(end[0], end[1] - 1, end[2]) -
        Date.UTC(start[0], start[1] - 1, start[2])) /
        DAY_MS
    ) + 1
  );
}

export function validateMarketingDateRange(
  range: string[] | null | undefined,
  granularity: HyperlinkMarketingGranularity
): string {
  if (!range || range.length !== 2 || !range[0] || !range[1]) {
    return "请选择统计时间范围";
  }
  const from = parseMarketingDate(range[0]);
  const to = parseMarketingDate(range[1]);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return "统计时间格式无效";
  if (from > to) return "开始时间不能晚于结束时间";
  const exceedsWindow =
    granularity === "day"
      ? inclusiveCalendarDays(range[0], range[1]) > 90
      : Math.floor(to / HOUR_MS) - Math.floor(from / HOUR_MS) + 1 > 7 * 24;
  if (exceedsWindow) {
    return granularity === "day"
      ? "日维度最多查询 90 天"
      : "小时维度最多查询 7 天";
  }
  return "";
}

export const EMPTY_MARKETING_METRIC: HyperlinkMarketingMetric = {
  statTime: null,
  sendTotal: 0,
  successNum: 0,
  sendSuccessRate: 0,
  deliveredNum: 0,
  deliveryRate: 0,
  usedAccountCount: 0,
  bannedAccountCount: 0,
  marketingBanRate: 0,
  avgSendPerAccount: 0,
  clickUvNum: 0,
  updatedAt: null
};

function latestUpdatedAt(
  current: number | null,
  candidate: number | null
): number | null {
  if (candidate == null) return current;
  return current == null || candidate > current ? candidate : current;
}

export function aggregateMarketingMetrics(
  metrics: HyperlinkMarketingMetric[],
  statTime: string | null = null
): HyperlinkMarketingMetric {
  let sendTotal = 0;
  let successNum = 0;
  let deliveredNum = 0;
  let usedAccountCount = 0;
  let bannedAccountCount = 0;
  let clickUvNum = 0;
  let updatedAt: number | null = null;
  for (const metric of metrics) {
    sendTotal += metric.sendTotal ?? 0;
    successNum += metric.successNum ?? 0;
    deliveredNum += metric.deliveredNum ?? 0;
    usedAccountCount += metric.usedAccountCount ?? 0;
    bannedAccountCount += metric.bannedAccountCount ?? 0;
    clickUvNum += metric.clickUvNum ?? 0;
    updatedAt = latestUpdatedAt(updatedAt, metric.updatedAt);
  }
  return {
    statTime,
    sendTotal,
    successNum,
    sendSuccessRate: sendTotal > 0 ? successNum / sendTotal : 0,
    deliveredNum,
    deliveryRate: successNum > 0 ? deliveredNum / successNum : 0,
    usedAccountCount,
    bannedAccountCount,
    marketingBanRate:
      usedAccountCount > 0 ? bannedAccountCount / usedAccountCount : 0,
    avgSendPerAccount: usedAccountCount > 0 ? successNum / usedAccountCount : 0,
    clickUvNum,
    updatedAt
  };
}

export function aggregateMarketingSeries(
  items: HyperlinkMarketingCountryPair[]
): HyperlinkMarketingMetric[] {
  const buckets = new Map<string, HyperlinkMarketingMetric[]>();
  for (const item of items) {
    for (const metric of item.series ?? []) {
      if (!metric.statTime) continue;
      const rows = buckets.get(metric.statTime) ?? [];
      rows.push(metric);
      buckets.set(metric.statTime, rows);
    }
  }
  return [...buckets.entries()]
    .map(([statTime, metrics]) => aggregateMarketingMetrics(metrics, statTime))
    .sort((left, right) =>
      (left.statTime ?? "").localeCompare(right.statTime ?? "")
    );
}

export function marketingOverview(
  summary: HyperlinkMarketingMetric,
  series: HyperlinkMarketingMetric[]
): HyperlinkMarketingOverview {
  return {
    sendTotal: summary.sendTotal,
    successNum: summary.successNum,
    deliveredNum: summary.deliveredNum,
    usedAccountCount: summary.usedAccountCount,
    bannedAccountCount: summary.bannedAccountCount,
    successRate: summary.sendSuccessRate,
    deliveryRate: summary.deliveryRate,
    clickUvNum: summary.clickUvNum,
    clickRate:
      summary.successNum > 0 ? summary.clickUvNum / summary.successNum : 0,
    avgSendPerAccount: summary.avgSendPerAccount,
    banRate: summary.marketingBanRate,
    buckets: series.length,
    sendPerBucket: series.length > 0 ? summary.sendTotal / series.length : 0
  };
}

export function formatMarketingCount(value: number): string {
  return Math.max(0, value || 0).toLocaleString("en-US");
}

export function formatMarketingRate(value: number): string {
  return `${(Math.max(0, value || 0) * 100).toFixed(2)}%`;
}

export function formatMarketingAverage(value: number): string {
  return Math.max(0, value || 0).toFixed(2);
}

export function marketingCountryFlag(countryIso2: string): string {
  const normalized = countryIso2?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized) || normalized === "ZZ") {
    return "🌐";
  }
  return String.fromCodePoint(
    ...[...normalized].map(letter => 127397 + letter.charCodeAt(0))
  );
}

export function marketingCountryLabel(countryIso2: string): string {
  const normalized = countryIso2?.trim().toUpperCase();
  return normalized && normalized !== "ZZ" ? normalized : "未知国家";
}

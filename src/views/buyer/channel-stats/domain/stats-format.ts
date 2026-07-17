import type {
  BuyerChannelStatsDerivedMetrics,
  BuyerChannelStatsMetricSource
} from "@/api/buyer-channel-stats";

export type ShanghaiDateRange = [string, string];

function shanghaiDate(date: Date): string {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function defaultShanghaiDateRange(now = new Date()): ShanghaiDateRange {
  const end = shanghaiDate(now);
  const startDate = new Date(`${end}T00:00:00.000Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  return [startDate.toISOString().slice(0, 10), end];
}

export function normalizeShanghaiDateRange(
  value: unknown,
  now = new Date()
): ShanghaiDateRange {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      item => typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item)
    )
  ) {
    return [value[0], value[1]];
  }
  return defaultShanghaiDateRange(now);
}

function ratio(numerator: number, denominator: number): number | undefined {
  return denominator > 0 ? numerator / denominator : undefined;
}

export function deriveChannelStats(
  source: BuyerChannelStatsMetricSource
): BuyerChannelStatsDerivedMetrics {
  return {
    clickRate: ratio(source.clicks, source.impressions),
    serviceFee: source.spend * source.serviceRate,
    totalFee:
      source.spend + source.spend * source.serviceRate + source.otherFee,
    loginRequestRate: ratio(source.loginRequestUserCount, source.uv),
    loginSuccessRate: ratio(
      source.loginSuccessUserCount,
      source.loginRequestUserCount
    ),
    visitorConversionRate: ratio(source.loginSuccessUserCount, source.uv),
    unbindRate: ratio(source.unbindCount, source.loginSuccessUserCount),
    accountCost: ratio(source.spend, source.loginSuccessCount)
  };
}

export function summarizeChannelStats(
  sources: BuyerChannelStatsMetricSource[]
): BuyerChannelStatsMetricSource & BuyerChannelStatsDerivedMetrics {
  let serviceFee = 0;
  const summary = sources.reduce<BuyerChannelStatsMetricSource>(
    (total, source) => {
      total.spend += source.spend;
      total.impressions += source.impressions;
      total.clicks += source.clicks;
      total.otherFee += source.otherFee;
      total.uv += source.uv;
      total.visitDurationSeconds += source.visitDurationSeconds;
      total.loginRequestCount += source.loginRequestCount;
      total.loginRequestUserCount += source.loginRequestUserCount;
      total.loginSuccessCount += source.loginSuccessCount;
      total.loginSuccessUserCount += source.loginSuccessUserCount;
      total.unbindCount += source.unbindCount;
      serviceFee += source.spend * source.serviceRate;
      return total;
    },
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      serviceRate: 0,
      otherFee: 0,
      uv: 0,
      visitDurationSeconds: 0,
      loginRequestCount: 0,
      loginRequestUserCount: 0,
      loginSuccessCount: 0,
      loginSuccessUserCount: 0,
      unbindCount: 0
    }
  );
  summary.serviceRate = summary.spend > 0 ? serviceFee / summary.spend : 0;
  return {
    ...summary,
    ...deriveChannelStats(summary),
    serviceFee,
    totalFee: summary.spend + serviceFee + summary.otherFee
  };
}

export function formatRatio(
  numerator: number | null | undefined,
  denominator?: number
): string {
  const value =
    denominator === undefined ? numerator : ratio(numerator ?? 0, denominator);
  return value === undefined || !Number.isFinite(value)
    ? "-"
    : `${(value * 100).toFixed(2)}%`;
}

export function formatNumber(
  value: number | null | undefined,
  digits = 2
): string {
  return value === undefined || !Number.isFinite(value)
    ? "-"
    : value.toFixed(digits);
}

export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return "-";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}分${rest}秒` : `${rest}秒`;
}

export interface DailyStatsEditableInput {
  spend: number;
  impressions: number;
  clicks: number;
  serviceRate: number;
  otherFee: number;
}

export function validateDailyStatsInput(
  input: DailyStatsEditableInput
): string {
  const values = [
    input.spend,
    input.impressions,
    input.clicks,
    input.serviceRate,
    input.otherFee
  ];
  if (values.some(value => !Number.isFinite(value) || value < 0)) {
    return "投放数据必须是非负数";
  }
  if (!Number.isInteger(input.impressions) || !Number.isInteger(input.clicks)) {
    return "展示和点击必须是整数";
  }
  return "";
}

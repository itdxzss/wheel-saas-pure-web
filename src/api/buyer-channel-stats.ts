import { armadaRequest } from "@/api/armada";
import { http } from "@/utils/http";

export const buyerChannelStatsSortFields = [
  "spend",
  "impressions",
  "clicks",
  "totalFee",
  "uv",
  "loginSuccessUserCount",
  "unbindRate",
  "accountCost"
] as const;

export type BuyerChannelStatsSortField =
  (typeof buyerChannelStatsSortFields)[number];
export type BuyerChannelStatsSortOrder = "asc" | "desc";

export interface BuyerChannelStatsOptions {
  channels: Array<{ id: number; name: string }>;
  templates: Array<{ id: number; name: string }>;
  countries: Array<{ code: string; name: string }>;
  creators: Array<{ id: number; name: string }>;
  parentUsers: Array<{ id: number; name: string }>;
}

export interface BuyerChannelStatsQuery {
  startDate: string;
  endDate: string;
  channelId?: number;
  channelName?: string;
  templateId?: number;
  countryCode?: string;
  creatorId?: number;
  parentUserId?: number;
  sortBy?: BuyerChannelStatsSortField;
  sortOrder?: BuyerChannelStatsSortOrder;
}

export interface BuyerChannelStatsMetricSource {
  spend: number;
  impressions: number;
  clicks: number;
  serviceRate: number;
  otherFee: number;
  uv: number;
  visitDurationSeconds: number;
  loginRequestCount: number;
  loginRequestUserCount: number;
  loginSuccessCount: number;
  loginSuccessUserCount: number;
  unbindCount: number;
}

export interface BuyerChannelStatsDerivedMetrics {
  clickRate?: number;
  serviceFee?: number;
  totalFee?: number;
  loginRequestRate?: number;
  loginSuccessRate?: number;
  visitorConversionRate?: number;
  unbindRate?: number;
  accountCost?: number;
}

export interface BuyerChannelStatsRow
  extends BuyerChannelStatsMetricSource,
    BuyerChannelStatsDerivedMetrics {
  channelId: number;
  channelName?: string;
  channelCode?: string;
  countryCode?: string;
  countryName?: string;
  templateId?: number;
  templateName?: string;
}

export interface BuyerChannelStatsDailyRow
  extends BuyerChannelStatsMetricSource,
    BuyerChannelStatsDerivedMetrics {
  date: string;
  countryCode: string;
  version: number;
}

export interface BuyerChannelStatsDailyQuery {
  countryCode: string;
  startDate: string;
  endDate: string;
}

export interface BuyerChannelStatsDailyInput {
  countryCode: string;
  spend: number;
  impressions: number;
  clicks: number;
  serviceRate: number;
  otherFee: number;
  version: number;
}

export interface BuyerChannelStatsDailyUpdateResult {
  daily: BuyerChannelStatsDailyRow;
  summary: BuyerChannelStatsRow;
}

export interface BuyerChannelStatsExport {
  filename: string;
  blob: Blob;
}

function headerValue(
  headers: Record<string, unknown>,
  expected: string
): string | undefined {
  const key = Object.keys(headers).find(
    item => item.toLowerCase() === expected.toLowerCase()
  );
  const value = key ? headers[key] : undefined;
  return typeof value === "string" ? value : undefined;
}

function filenameFromContentDisposition(value?: string): string | undefined {
  if (!value) return undefined;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.replace(/^"|"$/g, ""));
    } catch {
      return encoded;
    }
  }
  return value.match(/filename="?([^";]+)"?/i)?.[1];
}

export function getBuyerChannelStatsOptions(): Promise<BuyerChannelStatsOptions> {
  return armadaRequest<BuyerChannelStatsOptions>(
    "get",
    "/api/buyer/channel-stats/options"
  );
}

export function listBuyerChannelStats(
  params: BuyerChannelStatsQuery
): Promise<BuyerChannelStatsRow[]> {
  return armadaRequest<BuyerChannelStatsRow[]>(
    "get",
    "/api/buyer/channel-stats",
    { params }
  );
}

export function getBuyerChannelStatsDaily(
  channelId: number,
  params: BuyerChannelStatsDailyQuery
): Promise<BuyerChannelStatsDailyRow[]> {
  return armadaRequest<BuyerChannelStatsDailyRow[]>(
    "get",
    `/api/buyer/channel-stats/${channelId}/daily`,
    { params }
  );
}

export function updateBuyerChannelStatsDaily(
  channelId: number,
  date: string,
  data: BuyerChannelStatsDailyInput
): Promise<BuyerChannelStatsDailyUpdateResult> {
  return armadaRequest<BuyerChannelStatsDailyUpdateResult>(
    "put",
    `/api/buyer/channel-stats/${channelId}/daily/${date}`,
    { data }
  );
}

export async function exportBuyerChannelStats(
  params: BuyerChannelStatsQuery
): Promise<BuyerChannelStatsExport> {
  let filename: string | undefined;
  const blob = await http.request<Blob>(
    "get",
    "/api/buyer/channel-stats/export",
    { params, responseType: "blob" },
    {
      beforeResponseCallback: response => {
        filename = filenameFromContentDisposition(
          headerValue(
            response.headers as Record<string, unknown>,
            "Content-Disposition"
          )
        );
      }
    }
  );
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("导出文件为空");
  }
  return {
    blob,
    filename: filename || `渠道统计_${params.startDate}_${params.endDate}.xlsx`
  };
}

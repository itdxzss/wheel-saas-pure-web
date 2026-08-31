import { armadaRequest } from "@/api/armada";

export type HyperlinkMarketingGranularity = "day" | "hour";
export type HyperlinkMarketingAccountType = 1 | 2;
export type HyperlinkMarketingDeviceOs = "android" | "iphone";
export type HyperlinkMarketingTaskType = 1 | 2 | 3;

export interface HyperlinkMarketingStatsQuery {
  dateFrom: string;
  dateTo: string;
  granularity: HyperlinkMarketingGranularity;
  taskType?: HyperlinkMarketingTaskType;
  senderCountryIso2?: string;
  recipientCountryIso2?: string;
  accountType?: HyperlinkMarketingAccountType;
  deviceOs?: HyperlinkMarketingDeviceOs;
  shortLinkEnabled?: boolean;
}

export interface HyperlinkMarketingMetric {
  statTime: string | null;
  sendTotal: number;
  successNum: number;
  sendSuccessRate: number;
  deliveredNum: number;
  deliveryRate: number;
  usedAccountCount: number;
  bannedAccountCount: number;
  marketingBanRate: number;
  avgSendPerAccount: number;
  clickUvNum: number;
  updatedAt: number | null;
}

export interface HyperlinkMarketingCountryPair {
  senderCountryIso2: string;
  recipientCountryIso2: string;
  summary: HyperlinkMarketingMetric;
  series: HyperlinkMarketingMetric[];
}

export interface HyperlinkMarketingStatsResult {
  granularity: HyperlinkMarketingGranularity;
  overview: HyperlinkMarketingMetric;
  items: HyperlinkMarketingCountryPair[];
}

export interface HyperlinkMarketingCountries {
  senderCountryIso2: string[];
  recipientCountryIso2: string[];
}

function normalizedIso2(value?: string): string | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized || undefined;
}

export function getHyperlinkMarketingStats(
  query: HyperlinkMarketingStatsQuery
): Promise<HyperlinkMarketingStatsResult> {
  return armadaRequest<HyperlinkMarketingStatsResult>(
    "get",
    "/api/hyperlink-tasks/marketing-stats",
    {
      params: {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        granularity: query.granularity,
        taskType: query.taskType,
        senderCountryIso2: normalizedIso2(query.senderCountryIso2),
        recipientCountryIso2: normalizedIso2(query.recipientCountryIso2),
        accountType: query.accountType,
        deviceOs: query.deviceOs,
        shortLinkEnabled: query.shortLinkEnabled
      }
    }
  );
}

export function getHyperlinkMarketingCountries(
  query: Pick<
    HyperlinkMarketingStatsQuery,
    "dateFrom" | "dateTo" | "granularity"
  >
): Promise<HyperlinkMarketingCountries> {
  return armadaRequest<HyperlinkMarketingCountries>(
    "get",
    "/api/hyperlink-tasks/marketing-stats/countries",
    {
      params: {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        granularity: query.granularity
      }
    }
  );
}

import { reactive } from "vue";
import {
  getBuyerChannelStatsDaily,
  updateBuyerChannelStatsDaily,
  type BuyerChannelStatsDailyInput,
  type BuyerChannelStatsDailyQuery,
  type BuyerChannelStatsDailyRow,
  type BuyerChannelStatsDailyUpdateResult,
  type BuyerChannelStatsRow
} from "@/api/buyer-channel-stats";
import { hasApiErrorCode } from "@/utils/api-error";
import {
  validateDailyStatsInput,
  type ShanghaiDateRange
} from "../domain/stats-format";

export interface DailyStatsPanel {
  rows: BuyerChannelStatsDailyRow[];
  loading: boolean;
  savingDate?: string;
  loadedRange?: string;
}

export interface DailyStatsPanelDependencies {
  load?: (
    channelId: number,
    query: BuyerChannelStatsDailyQuery
  ) => Promise<BuyerChannelStatsDailyRow[]>;
  update?: (
    channelId: number,
    date: string,
    payload: BuyerChannelStatsDailyInput
  ) => Promise<BuyerChannelStatsDailyUpdateResult>;
  replaceSummary?: (row: BuyerChannelStatsRow) => void;
  onVersionConflict?: () => void;
}

function panelKey(channelId: number, countryCode: string): string {
  return `${channelId}:${countryCode}`;
}

export function useDailyStatsPanels(
  dependencies: DailyStatsPanelDependencies = {}
) {
  const load = dependencies.load ?? getBuyerChannelStatsDaily;
  const update = dependencies.update ?? updateBuyerChannelStatsDaily;
  const panels = reactive<Record<string, DailyStatsPanel>>({});

  function panelFor(channelId: number, countryCode: string): DailyStatsPanel {
    const key = panelKey(channelId, countryCode);
    panels[key] ??= { rows: [], loading: false };
    return panels[key];
  }

  async function loadPanel(
    channelId: number,
    countryCode: string,
    range: ShanghaiDateRange,
    force = false
  ): Promise<void> {
    const panel = panelFor(channelId, countryCode);
    const loadedRange = range.join(":");
    if (!force && panel.loadedRange === loadedRange) return;
    panel.loading = true;
    try {
      panel.rows = await load(channelId, {
        countryCode,
        startDate: range[0],
        endDate: range[1]
      });
      panel.loadedRange = loadedRange;
    } finally {
      panel.loading = false;
    }
  }

  async function saveRow(
    channelId: number,
    countryCode: string,
    row: BuyerChannelStatsDailyRow,
    range: ShanghaiDateRange
  ): Promise<"saved" | "conflict"> {
    const validation = validateDailyStatsInput(row);
    if (validation) throw new Error(validation);
    const panel = panelFor(channelId, countryCode);
    panel.savingDate = row.date;
    try {
      const result = await update(channelId, row.date, {
        countryCode,
        startDate: range[0],
        endDate: range[1],
        spend: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
        serviceRate: row.serviceRate,
        otherFee: row.otherFee,
        version: row.version
      });
      panel.rows = panel.rows.map(item =>
        item.date === result.daily.date ? result.daily : item
      );
      dependencies.replaceSummary?.(result.summary);
      return "saved";
    } catch (error) {
      if (!hasApiErrorCode(error, "VERSION_CONFLICT")) throw error;
      await loadPanel(channelId, countryCode, range, true);
      dependencies.onVersionConflict?.();
      return "conflict";
    } finally {
      panel.savingDate = undefined;
    }
  }

  return { panels, panelFor, loadPanel, saveRow };
}

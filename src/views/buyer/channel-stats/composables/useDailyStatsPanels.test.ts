import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  BuyerChannelStatsDailyRow,
  BuyerChannelStatsRow
} from "@/api/buyer-channel-stats";
import { useDailyStatsPanels } from "./useDailyStatsPanels";

function daily(
  countryCode: string,
  version: number
): BuyerChannelStatsDailyRow {
  return {
    date: "2026-07-17",
    countryCode,
    spend: version,
    impressions: 100,
    clicks: 10,
    serviceRate: 0.05,
    otherFee: 0,
    uv: 20,
    visitDurationSeconds: 60,
    loginRequestCount: 10,
    loginRequestUserCount: 8,
    loginSuccessCount: 6,
    loginSuccessUserCount: 5,
    unbindCount: 1,
    version
  };
}

describe("daily channel stats panels", () => {
  it("isolates expanded rows by channel and country", async () => {
    const state = useDailyStatsPanels({
      load: async (_channelId, query) => [daily(query.countryCode, 1)],
      update: async () => ({
        daily: daily("US", 2),
        summary: {} as BuyerChannelStatsRow
      })
    });

    await state.loadPanel(1, "US", ["2026-07-11", "2026-07-17"]);
    await state.loadPanel(1, "GB", ["2026-07-11", "2026-07-17"]);

    assert.equal(state.panelFor(1, "US").rows[0].countryCode, "US");
    assert.equal(state.panelFor(1, "GB").rows[0].countryCode, "GB");
    assert.notEqual(state.panelFor(1, "US"), state.panelFor(1, "GB"));
  });

  it("replaces successful rows and reloads VERSION_CONFLICT before retry", async () => {
    let version = 1;
    let conflicts = 0;
    let summary: BuyerChannelStatsRow | undefined;
    const state = useDailyStatsPanels({
      load: async () => [daily("US", version)],
      update: async (_channelId, _date, payload) => {
        if (payload.version === 2) {
          version = 3;
          throw { code: "VERSION_CONFLICT" };
        }
        const updated = daily("US", 2);
        return {
          daily: updated,
          summary: { channelId: 1 } as BuyerChannelStatsRow
        };
      },
      replaceSummary: row => {
        summary = row;
      },
      onVersionConflict: () => {
        conflicts += 1;
      }
    });
    const range: [string, string] = ["2026-07-11", "2026-07-17"];
    await state.loadPanel(1, "US", range);
    await state.saveRow(1, "US", daily("US", 1), range);
    assert.equal(state.panelFor(1, "US").rows[0].version, 2);
    assert.equal(summary?.channelId, 1);

    await state.saveRow(1, "US", daily("US", 2), range);
    assert.equal(conflicts, 1);
    assert.equal(state.panelFor(1, "US").rows[0].version, 3);
  });
});

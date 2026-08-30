import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  getHyperlinkMarketingCountries,
  getHyperlinkMarketingStats
} from "./hyperlink-analysis";

describe("hyperlink marketing analysis API", () => {
  it("serializes the frozen camelCase filters", async () => {
    resetArmadaMock({ granularity: "hour", items: [] });

    await getHyperlinkMarketingStats({
      dateFrom: "2026-08-29 12:00:00",
      dateTo: "2026-08-30 12:00:00",
      granularity: "hour",
      taskType: 2,
      senderCountryIso2: " br ",
      recipientCountryIso2: "id",
      accountType: 1,
      deviceOs: "android",
      shortLinkEnabled: false
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/marketing-stats",
        opts: {
          params: {
            dateFrom: "2026-08-29 12:00:00",
            dateTo: "2026-08-30 12:00:00",
            granularity: "hour",
            taskType: 2,
            senderCountryIso2: "BR",
            recipientCountryIso2: "ID",
            accountType: 1,
            deviceOs: "android",
            shortLinkEnabled: false
          }
        }
      }
    ]);
  });

  it("loads country choices from the only supporting endpoint", async () => {
    resetArmadaMock({ senderCountryIso2: [], recipientCountryIso2: [] });

    await getHyperlinkMarketingCountries({
      dateFrom: "2026-08-29",
      dateTo: "2026-08-30",
      granularity: "day"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-tasks/marketing-stats/countries",
        opts: {
          params: {
            dateFrom: "2026-08-29",
            dateTo: "2026-08-30",
            granularity: "day"
          }
        }
      }
    ]);
  });
});

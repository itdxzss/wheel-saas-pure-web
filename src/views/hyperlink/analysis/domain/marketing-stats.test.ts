import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  HyperlinkMarketingCountryPair,
  HyperlinkMarketingMetric
} from "@/api/hyperlink-analysis";
import {
  aggregateMarketingMetrics,
  aggregateMarketingSeries,
  createMarketingDateRange,
  marketingOverview,
  validateMarketingDateRange
} from "./marketing-stats";

function metric(
  statTime: string,
  overrides: Partial<HyperlinkMarketingMetric> = {}
): HyperlinkMarketingMetric {
  return {
    statTime,
    sendTotal: 100,
    successNum: 80,
    sendSuccessRate: 0.8,
    deliveredNum: 60,
    deliveryRate: 0.75,
    usedAccountCount: 10,
    bannedAccountCount: 1,
    marketingBanRate: 0.1,
    avgSendPerAccount: 8,
    clickUvNum: 20,
    updatedAt: 1_777_550_400_000,
    ...overrides
  };
}

describe("hyperlink marketing statistics domain", () => {
  it("formats default day/hour ranges using the backend contract", () => {
    const now = new Date(2026, 7, 30, 12, 34, 56);
    assert.deepEqual(createMarketingDateRange("day", 7, now), [
      "2026-08-24",
      "2026-08-30"
    ]);
    assert.deepEqual(createMarketingDateRange("hour", 24, now), [
      "2026-08-29 13:34:56",
      "2026-08-30 12:34:56"
    ]);
  });

  it("enforces the 90-day and 7-day query windows", () => {
    assert.equal(
      validateMarketingDateRange(["2026-06-02", "2026-08-30"], "day"),
      ""
    );
    assert.equal(
      validateMarketingDateRange(["2026-06-01", "2026-08-30"], "day"),
      "日维度最多查询 90 天"
    );
    assert.equal(
      validateMarketingDateRange(["2026-05-01", "2026-08-30"], "day"),
      "日维度最多查询 90 天"
    );
    assert.equal(
      validateMarketingDateRange(
        ["2026-08-01 00:00:00", "2026-08-08 00:00:00"],
        "hour"
      ),
      "小时维度最多查询 7 天"
    );
    assert.equal(
      validateMarketingDateRange(
        ["2026-08-01 00:00:00", "2026-08-07 23:59:59"],
        "hour"
      ),
      ""
    );
    assert.equal(
      validateMarketingDateRange(["2026-08-01", "2026-08-30"], "day"),
      ""
    );
  });

  it("recomputes rates and rolls country pairs into one trend", () => {
    const first = metric("2026-08-29", { updatedAt: 100 });
    const second = metric("2026-08-29", {
      sendTotal: 50,
      successNum: 25,
      deliveredNum: 20,
      usedAccountCount: 5,
      bannedAccountCount: 0,
      clickUvNum: 5,
      updatedAt: 200
    });
    const aggregate = aggregateMarketingMetrics([first, second]);
    assert.equal(aggregate.sendTotal, 150);
    assert.equal(aggregate.sendSuccessRate, 105 / 150);
    assert.equal(aggregate.deliveryRate, 80 / 105);
    assert.equal(aggregate.marketingBanRate, 1 / 15);
    assert.equal(aggregate.avgSendPerAccount, 105 / 15);
    assert.equal(aggregate.updatedAt, 200);

    const items: HyperlinkMarketingCountryPair[] = [
      {
        senderCountryIso2: "BR",
        recipientCountryIso2: "ID",
        summary: first,
        series: [first]
      },
      {
        senderCountryIso2: "PH",
        recipientCountryIso2: "ID",
        summary: second,
        series: [second]
      }
    ];
    const series = aggregateMarketingSeries(items);
    assert.equal(series.length, 1);
    assert.equal(series[0].sendTotal, 150);
    const exact = aggregateMarketingMetrics([first, second]);
    exact.usedAccountCount = 12;
    exact.bannedAccountCount = 1;
    exact.avgSendPerAccount = exact.successNum / exact.usedAccountCount;
    exact.marketingBanRate = exact.bannedAccountCount / exact.usedAccountCount;
    const overview = marketingOverview(exact, series);
    assert.equal(overview.clickRate, 25 / 105);
    assert.equal(overview.usedAccountCount, 12);
    assert.equal(overview.buckets, 1);
  });
});

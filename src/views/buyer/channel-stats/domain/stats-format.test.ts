import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as statsFormat from "./stats-format";

const {
  defaultShanghaiDateRange,
  deriveChannelStats,
  formatRatio,
  validateDailyStatsInput
} = statsFormat;

describe("buyer channel stats format and validation", () => {
  it("uses the latest seven Shanghai natural days", () => {
    assert.deepEqual(
      defaultShanghaiDateRange(new Date("2026-07-16T16:30:00.000Z")),
      ["2026-07-11", "2026-07-17"]
    );
  });

  it("restores the Shanghai default when a cleared date range reaches query", () => {
    const normalize = (
      statsFormat as typeof statsFormat & {
        normalizeShanghaiDateRange?: (
          value: unknown,
          now: Date
        ) => [string, string];
      }
    ).normalizeShanghaiDateRange;
    assert.equal(typeof normalize, "function");
    assert.deepEqual(normalize?.(null, new Date("2026-07-16T16:30:00.000Z")), [
      "2026-07-11",
      "2026-07-17"
    ]);
  });

  it("derives formulas and formats zero denominators as dash", () => {
    assert.deepEqual(
      deriveChannelStats({
        spend: 100,
        impressions: 1000,
        clicks: 100,
        serviceRate: 0.05,
        otherFee: 3,
        uv: 200,
        visitDurationSeconds: 600,
        loginRequestCount: 160,
        loginRequestUserCount: 80,
        loginSuccessCount: 50,
        loginSuccessUserCount: 40,
        unbindCount: 8
      }),
      {
        clickRate: 0.1,
        serviceFee: 5,
        totalFee: 108,
        loginRequestRate: 0.4,
        loginSuccessRate: 0.5,
        visitorConversionRate: 0.2,
        unbindRate: 0.2,
        accountCost: 2
      }
    );
    assert.equal(formatRatio(1, 0), "-");
    assert.equal(formatRatio(1, 4), "25.00%");
  });

  it("allows non-negative daily amounts and requires integer counts", () => {
    assert.equal(
      validateDailyStatsInput({
        spend: 0,
        impressions: 10,
        clicks: 2,
        serviceRate: 0.1,
        otherFee: 0
      }),
      ""
    );
    assert.match(
      validateDailyStatsInput({
        spend: 1,
        impressions: 1.5,
        clicks: 2,
        serviceRate: 0.1,
        otherFee: 0
      }),
      /整数/
    );
  });

  it("adds each day's service fee before deriving a summary total", () => {
    const summarize = (
      statsFormat as typeof statsFormat & {
        summarizeChannelStats?: (
          rows: Parameters<typeof deriveChannelStats>[0][]
        ) => { serviceFee?: number | null; totalFee?: number | null };
      }
    ).summarizeChannelStats;
    assert.equal(typeof summarize, "function");
    const base = {
      impressions: 100,
      clicks: 10,
      uv: 50,
      visitDurationSeconds: 100,
      loginRequestCount: 20,
      loginRequestUserCount: 15,
      loginSuccessCount: 10,
      loginSuccessUserCount: 8,
      unbindCount: 1
    };
    const summary = summarize?.([
      { ...base, spend: 100, serviceRate: 0.1, otherFee: 2 },
      { ...base, spend: 200, serviceRate: 0.2, otherFee: 3 }
    ]);
    assert.equal(summary?.serviceFee, 50);
    assert.equal(summary?.totalFee, 355);
  });
});

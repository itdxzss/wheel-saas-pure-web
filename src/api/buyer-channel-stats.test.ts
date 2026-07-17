import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  exportBuyerChannelStats,
  getBuyerChannelStatsOptions,
  getBuyerChannelStatsDaily,
  listBuyerChannelStats,
  updateBuyerChannelStatsDaily
} from "./buyer-channel-stats";

describe("buyer channel stats API contract", () => {
  it("maps options, list, daily and update requests", async () => {
    resetArmadaMock({});
    const query = {
      startDate: "2026-07-11",
      endDate: "2026-07-17",
      channelId: 9,
      channelName: "北美",
      templateId: 2,
      countryCode: "US",
      creatorId: 3,
      parentUserId: 4,
      sortBy: "spend" as const,
      sortOrder: "desc" as const
    };
    await getBuyerChannelStatsOptions();
    await listBuyerChannelStats(query);
    await getBuyerChannelStatsDaily(9, {
      countryCode: "US",
      startDate: query.startDate,
      endDate: query.endDate
    });
    await updateBuyerChannelStatsDaily(9, "2026-07-17", {
      countryCode: "US",
      startDate: "2026-07-13",
      endDate: "2026-07-15",
      spend: 20,
      impressions: 100,
      clicks: 10,
      serviceRate: 0.05,
      otherFee: 2,
      version: 7
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/buyer/channel-stats/options",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/buyer/channel-stats",
        opts: { params: query }
      },
      {
        method: "get",
        url: "/api/buyer/channel-stats/9/daily",
        opts: {
          params: {
            countryCode: "US",
            startDate: "2026-07-11",
            endDate: "2026-07-17"
          }
        }
      },
      {
        method: "put",
        url: "/api/buyer/channel-stats/9/daily/2026-07-17",
        opts: {
          data: {
            countryCode: "US",
            startDate: "2026-07-13",
            endDate: "2026-07-15",
            spend: 20,
            impressions: 100,
            clicks: 10,
            serviceRate: 0.05,
            otherFee: 2,
            version: 7
          }
        }
      }
    ]);
  });

  it("exports current filters as a blob and honors Content-Disposition", async () => {
    const blob = new Blob(["xlsx"], { type: "application/vnd.ms-excel" });
    resetHttpMock(blob, {
      "content-disposition":
        "attachment; filename*=UTF-8''buyer-channel-stats.xlsx"
    });
    const params = { startDate: "2026-07-11", endDate: "2026-07-17" };

    const result = await exportBuyerChannelStats(params);

    assert.equal(result.filename, "buyer-channel-stats.xlsx");
    assert.equal(result.blob, blob);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/buyer/channel-stats/export",
        opts: { params, responseType: "blob" },
        configKeys: ["beforeResponseCallback"]
      }
    ]);
  });
});

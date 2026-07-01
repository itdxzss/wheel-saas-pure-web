import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  getIpStatsSummary,
  listIpStatsCountries,
  listIpStatsRegionProxies
} from "./resource-ip-stats";

describe("resource IP stats API", () => {
  it("loads IP stats summary", async () => {
    resetArmadaMock({
      totalIpCount: 10,
      inUseIpCount: 2,
      idleIpCount: 7,
      unavailableIpCount: 1,
      coveredRegionCount: 3
    });

    const summary = await getIpStatsSummary();

    assert.equal(summary.totalIpCount, 10);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/ip-proxies/stats/summary",
        opts: undefined
      }
    ]);
  });

  it("maps country stats query to backend params", async () => {
    resetArmadaMock({ list: [], total: 0, page: 2, pageSize: 20 });

    await listIpStatsCountries({
      keyword: " 印度 ",
      proxyType: "HTTP",
      source: " iproyal ",
      risk: "no_idle",
      sortField: "availableRate",
      sortOrder: "asc",
      page: 2,
      pageSize: 20
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/ip-proxies/stats/countries",
        opts: {
          params: {
            keyword: "印度",
            protocol: 1,
            source: "iproyal",
            risk: "no_idle",
            sortField: "availableRate",
            sortOrder: "asc",
            page: 2,
            pageSize: 20
          }
        }
      }
    ]);
  });

  it("loads encoded region proxy details", async () => {
    resetArmadaMock({ list: [], total: 0, page: 1, pageSize: 10 });

    await listIpStatsRegionProxies("混合（不限国家）", {
      status: 2,
      proxyType: "SOCKS5",
      source: "供应商A",
      keyword: "1.2.3.4",
      page: 1,
      pageSize: 10
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/ip-proxies/stats/countries/%E6%B7%B7%E5%90%88%EF%BC%88%E4%B8%8D%E9%99%90%E5%9B%BD%E5%AE%B6%EF%BC%89/proxies",
        opts: {
          params: {
            status: 2,
            protocol: 2,
            source: "供应商A",
            keyword: "1.2.3.4",
            page: 1,
            pageSize: 10
          }
        }
      }
    ]);
  });
});

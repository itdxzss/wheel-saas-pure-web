import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  getIpStatsSummary,
  getIpStatsCountrySampleStats,
  listIpStatsCountries,
  listIpStatsRegionProxies,
  sampleCheckIpStatsCountry
} from "./resource-ip-stats";

describe("resource IP stats API", () => {
  it("loads IP stats summary", async () => {
    resetArmadaMock({
      totalIpCount: 10,
      inUseIpCount: 2,
      idleIpCount: 7,
      unavailableIpCount: 1,
      coveredRegionCount: 3,
      supportedCountryCount: 12,
      noIpCountryCount: 9
    });

    const summary = await getIpStatsSummary();

    assert.equal(summary.totalIpCount, 10);
    assert.equal(summary.supportedCountryCount, 12);
    assert.equal(summary.noIpCountryCount, 9);
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
      allocationMode: "smart",
      source: " iproyal ",
      risk: "no_ip",
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
            allocationMode: "smart",
            source: "iproyal",
            risk: "no_ip",
            sortField: "availableRate",
            sortOrder: "asc",
            page: 2,
            pageSize: 20
          }
        }
      }
    ]);
  });

  it("posts country sample check count to backend", async () => {
    resetArmadaMock({
      region: "印度",
      sampleCount: 3,
      lastSampleCheckAt: 1_719_900_000_000,
      results: []
    });

    const result = await sampleCheckIpStatsCountry("印度", 3);

    assert.equal(result.lastSampleCheckAt, 1_719_900_000_000);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/stats/countries/%E5%8D%B0%E5%BA%A6/sample-check",
        opts: {
          data: { sampleCount: 3 }
        },
        config: {
          timeout: 120000
        }
      }
    ]);
  });

  it("loads country sample check stats", async () => {
    resetArmadaMock({
      region: "印度",
      totalIpCount: 30,
      availableIpCount: 20,
      inUseIpCount: 7,
      unavailableIpCount: 3
    });

    const result = await getIpStatsCountrySampleStats("印度");

    assert.equal(result.totalIpCount, 30);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/ip-proxies/stats/countries/%E5%8D%B0%E5%BA%A6/sample-check/stats",
        opts: undefined
      }
    ]);
  });

  it("loads encoded region proxy details", async () => {
    resetArmadaMock({
      list: [
        {
          id: 1,
          proxyHost: "1.2.3.4",
          proxyPort: 1080,
          proxyAddress: "1.2.3.4:1080",
          protocol: 2,
          protocolLabel: "SOCKS5",
          region: "混合（不限国家）",
          status: 2,
          statusLabel: "使用中",
          boundAccountId: 1001,
          source: "供应商A",
          allocationMode: "mixed",
          allocationModeLabel: "混合分组",
          ownership: 1,
          ownershipLabel: "租户自有",
          lastSampleCheckAt: null,
          createdAt: null,
          boundAt: null
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    });

    const result = await listIpStatsRegionProxies("混合（不限国家）", {
      status: 2,
      proxyType: "SOCKETS",
      allocationMode: "mixed",
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
            allocationMode: "mixed",
            source: "供应商A",
            keyword: "1.2.3.4",
            page: 1,
            pageSize: 10
          }
        }
      }
    ]);
    assert.equal(result.list[0].protocolLabel, "SOCKETS");
    assert.equal(result.list[0].proxyHost, "1.2.3.4");
    assert.equal(result.list[0].proxyPort, 1080);
    assert.equal(result.list[0].allocationModeLabel, "混合分组");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import type { IpProxyCheckResult } from "@/api/resource-ip";
import type {
  IpCountryStatsRow,
  IpStatsDetailRow
} from "@/api/resource-ip-stats";
import { useResourceIpStatsPage } from "./useResourceIpStatsPage";

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(nextResolve => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function detailRow(id: number): IpStatsDetailRow {
  return {
    id,
    proxyHost: `proxy-${id}.example.com`,
    proxyPort: 8080,
    proxyAddress: `proxy-${id}.example.com:8080`,
    protocol: 1,
    protocolLabel: "HTTP",
    region: "印度",
    status: 1,
    statusLabel: "空闲",
    boundAccountId: null,
    source: "IPide",
    allocationMode: "smart",
    allocationModeLabel: "智能分配",
    ownership: 1,
    ownershipLabel: "租户自有",
    lastSampleCheckAt: null,
    failCount: 0
  };
}

function countryRow(region: string): IpCountryStatsRow {
  return {
    region,
    totalIpCount: 10,
    inUseIpCount: 2,
    idleIpCount: 7,
    unavailableIpCount: 1,
    availableRate: 90,
    unavailableRate: 10,
    lastSampleCheckAt: null,
    resourceRisk: "normal",
    resourceRiskLabel: "正常"
  };
}

describe("resource IP stats page single detail check", () => {
  it("opens the IP-management single-check dialog state and calls the row check API", async () => {
    const pending = deferred<IpProxyCheckResult>();
    resetArmadaMock(pending.promise);
    const page = useResourceIpStatsPage();
    const row = detailRow(9);

    const checking = page.checkDetailIp(row);

    assert.equal(page.showCheckResultDialog.value, true);
    assert.equal(page.checkDialogLoading.value, true);
    assert.equal(page.activeCheckRow.value?.id, 9);
    assert.equal(
      page.activeCheckRow.value?.proxyAddress,
      "proxy-9.example.com:8080"
    );
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/9/check",
        opts: undefined,
        config: { timeout: 20000 }
      }
    ]);

    const result: IpProxyCheckResult = {
      id: 9,
      checkStatus: "success",
      connectionStatus: "空闲",
      whatsappStatus: "HTTP 400",
      outboundIp: "47.15.30.133",
      countryCode: "IN",
      region: "印度",
      location: "India(IN) · Haryana · Sonipat",
      isp: "Reliance Jio Infocomm Limited",
      detectedLatitude: 28.9933,
      detectedLongitude: 77.021,
      checkedAt: 1782871200000,
      errorMessage: null
    };
    pending.resolve(result);
    await checking;

    assert.equal(page.checkDialogLoading.value, false);
    assert.deepEqual(page.checkResults.value, [result]);
  });

  it("opens the batch result dialog after confirming country sample check", async () => {
    const results: IpProxyCheckResult[] = [
      {
        id: 11,
        checkStatus: "success",
        connectionStatus: "空闲",
        whatsappStatus: "HTTP 400",
        outboundIp: "47.15.30.133",
        countryCode: "IN",
        detectedRegion: "印度",
        region: "美国",
        location: "India(IN) · Haryana · Sonipat",
        isp: "Reliance Jio Infocomm Limited",
        detectedLatitude: 28.9933,
        detectedLongitude: 77.021,
        checkedAt: 1782871200000,
        errorMessage: null
      },
      {
        id: 12,
        checkStatus: "failed",
        connectionStatus: "不可用",
        whatsappStatus: "failed",
        outboundIp: null,
        countryCode: null,
        detectedRegion: null,
        region: "印度",
        location: null,
        isp: null,
        detectedLatitude: null,
        detectedLongitude: null,
        checkedAt: 1782871200100,
        errorMessage: "代理连接超时"
      }
    ];
    resetArmadaMock({
      region: "印度",
      sampleCount: 2,
      lastSampleCheckAt: 1782871200100,
      results
    });
    const page = useResourceIpStatsPage();
    page.sampleDialogCountry.value = countryRow("印度");
    page.sampleDialogStats.value = {
      region: "印度",
      totalIpCount: 10,
      availableIpCount: 7,
      inUseIpCount: 2,
      unavailableIpCount: 1
    };
    page.sampleCount.value = 2;
    page.sampleDialogVisible.value = true;

    await page.confirmSampleCheckCountry();

    assert.equal(page.sampleDialogVisible.value, false);
    assert.equal(page.showCheckResultDialog.value, true);
    assert.equal(page.checkDialogLoading.value, false);
    assert.equal(page.activeCheckRow.value, null);
    assert.deepEqual(page.checkResults.value, results);
    assert.deepEqual(armadaCalls()[0], {
      method: "post",
      url: "/api/ip-proxies/stats/countries/%E5%8D%B0%E5%BA%A6/sample-check",
      opts: { data: { sampleCount: 2 } },
      config: { timeout: 120000 }
    });
  });
});

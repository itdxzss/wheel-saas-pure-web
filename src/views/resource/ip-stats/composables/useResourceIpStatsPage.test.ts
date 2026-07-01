import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import type { IpProxyCheckResult } from "@/api/resource-ip";
import type { IpStatsDetailRow } from "@/api/resource-ip-stats";
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
});

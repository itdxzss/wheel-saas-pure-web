import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  batchCheckIpProxies,
  checkIpProxy,
  importIpProxies,
  listIpCountryOptions,
  listTenantIpRegions
} from "./resource-ip";

describe("resource IP API", () => {
  it("loads IP country options from country master data endpoint", async () => {
    const rows = [
      {
        value: "MIXED",
        iso2: null,
        nameZh: "混合（不限国家）",
        phonePrefix: "",
        flag: "🌐",
        virtual: true
      },
      {
        value: "IN",
        iso2: "IN",
        nameZh: "印度",
        phonePrefix: "+91",
        flag: "🇮🇳",
        virtual: false
      }
    ];
    resetArmadaMock({ rows });

    const options = await listIpCountryOptions();

    assert.deepEqual(options, rows);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/admin/countries/options",
        opts: { params: { scope: "ip" } }
      }
    ]);
  });

  it("imports IP proxies without countryValue", async () => {
    resetArmadaMock({
      totalRows: 1,
      insertedRows: 1,
      skippedRows: 0,
      failedRows: 0,
      errors: []
    });

    await importIpProxies({
      allocationMode: "smart",
      proxyType: "SOCKS5",
      source: "iproyal",
      text: "1.1.1.1:8080:u:p"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/import",
        opts: {
          data: {
            allocationMode: "smart",
            protocol: 2,
            source: "iproyal",
            text: "1.1.1.1:8080:u:p"
          }
        }
      }
    ]);
  });

  it("checks a single IP proxy without request body", async () => {
    const result = {
      id: 9,
      checkStatus: "success",
      connectionStatus: "空闲",
      whatsappStatus: "unknown",
      outboundIp: "8.8.8.8",
      countryCode: "US",
      region: "California",
      location: "Mountain View",
      isp: "Google",
      detectedLatitude: 37.386,
      detectedLongitude: -122.084,
      checkedAt: 1704067200000,
      errorMessage: null
    };
    resetArmadaMock(result);

    assert.deepEqual(await checkIpProxy(9), result);
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/9/check",
        opts: undefined,
        config: { timeout: 20000 }
      }
    ]);
  });

  it("checks selected IP proxies with ids body", async () => {
    resetArmadaMock([]);

    await batchCheckIpProxies([1, 2, 3]);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/check",
        opts: { data: { ids: [1, 2, 3] } },
        config: { timeout: 120000 }
      }
    ]);
  });

  it("loads tenant IP regions from the distinct backend endpoint", async () => {
    resetArmadaMock(["混合（不限国家）", "印度", "马来西亚"]);

    const regions = await listTenantIpRegions();

    assert.deepEqual(regions, ["混合（不限国家）", "印度", "马来西亚"]);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/ip-proxies/regions",
        opts: undefined
      }
    ]);
  });
});

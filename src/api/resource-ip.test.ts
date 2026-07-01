import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
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

  it("imports IP proxies with countryValue instead of legacy region", async () => {
    resetArmadaMock({
      totalRows: 1,
      insertedRows: 1,
      skippedRows: 0,
      failedRows: 0,
      errors: []
    });

    await importIpProxies({
      country: "IN",
      proxyType: "HTTP",
      source: "iproyal",
      text: "1.1.1.1:8080:u:p"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/ip-proxies/import",
        opts: {
          data: {
            countryValue: "IN",
            protocol: 1,
            source: "iproyal",
            text: "1.1.1.1:8080:u:p"
          }
        }
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

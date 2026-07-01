import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeIpProxyRow,
  toIpProxyListParams,
  type BackendIpProxyRow
} from "./resource-ip-mapping";

describe("resource IP mapping", () => {
  it("maps backend ip proxy rows to page rows", () => {
    const row: BackendIpProxyRow = {
      id: 7,
      proxyAddress: "proxy.example.com:1080",
      protocol: 2,
      protocolLabel: "SOCKS5",
      region: "印度",
      username: "operator",
      password: "******",
      source: "iproyal",
      createdAt: 1704067200000
    };

    assert.deepEqual(normalizeIpProxyRow(row), {
      id: 7,
      country: "印度",
      proxyType: "SOCKS5",
      proxyAddress: "proxy.example.com:1080",
      username: "operator",
      password: "******",
      validAccountCount: 0,
      source: "iproyal",
      createdAt: "2024-01-01 08:00:00"
    });
  });

  it("maps search form values to backend query params", () => {
    assert.deepEqual(
      toIpProxyListParams({
        country: "混合（不限国家）",
        proxyType: "HTTP",
        source: "ipidea",
        page: 2,
        pageSize: 50
      }),
      {
        countryValue: "MIXED",
        protocol: 1,
        source: "ipidea",
        page: 2,
        pageSize: 50
      }
    );
  });
});

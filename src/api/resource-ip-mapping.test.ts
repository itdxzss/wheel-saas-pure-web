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
      status: 1,
      statusLabel: "空闲",
      ownership: 1,
      ownershipLabel: "租户自有",
      username: "operator",
      password: "plain-secret",
      source: "iproyal",
      remark: "stable",
      allocationMode: "smart",
      allocationModeLabel: "智能分配",
      lastSampleCheckAt: 1704153600000,
      detectedCountryCode: "IN",
      outboundIp: "8.8.8.8",
      detectedLocation: "Mumbai",
      detectedIsp: "Example ISP",
      detectedLatitude: 19.076,
      detectedLongitude: 72.8777,
      checkFailCount: 2,
      lastCheckError: "timeout",
      createdAt: 1704067200000
    };

    assert.deepEqual(normalizeIpProxyRow(row), {
      id: 7,
      country: "印度",
      proxyType: "SOCKETS",
      proxyAddress: "proxy.example.com:1080",
      username: "operator",
      password: "plain-secret",
      validAccountCount: 0,
      source: "iproyal",
      createdAt: "2024-01-01 08:00:00"
    });
  });

  it("maps search form values to backend query params", () => {
    assert.deepEqual(
      toIpProxyListParams({
        country: "混合（不限国家）",
        region: "Mumbai",
        proxyType: "SOCKETS",
        source: "ipidea",
        keyword: "proxy",
        page: 2,
        pageSize: 50
      }),
      {
        countryValue: "MIXED",
        region: "Mumbai",
        protocol: 2,
        source: "ipidea",
        keyword: "proxy",
        page: 2,
        pageSize: 50
      }
    );
  });
});

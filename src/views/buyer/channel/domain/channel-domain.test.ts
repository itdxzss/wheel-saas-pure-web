import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOMAIN_TEMPLATE_CONFLICT_MESSAGE,
  assertDomainBinding,
  normalizeChannelDomain,
  resolveChannelRuntime
} from "./channel-domain";

describe("channel domain rules", () => {
  it("normalizes hosts and rejects non-host input", () => {
    assert.equal(
      normalizeChannelDomain(" HTTPS://Shop.Example.COM. "),
      "shop.example.com"
    );
    for (const invalid of [
      "example.com/path",
      "example.com?x=1",
      "example.com#hash",
      "example.com:443",
      "user@example.com",
      "127.0.0.1",
      "-bad.example.com"
    ]) {
      assert.throws(() => normalizeChannelDomain(invalid), /域名/);
    }
  });

  it("allows unbound and same-template bindings but blocks another template", () => {
    assert.doesNotThrow(() => assertDomainBinding(null, 2));
    assert.doesNotThrow(() => assertDomainBinding({ templateId: 2 }, 2));
    assert.throws(
      () => assertDomainBinding({ templateId: 1 }, 2),
      new RegExp(DOMAIN_TEMPLATE_CONFLICT_MESSAGE)
    );
    assert.equal(DOMAIN_TEMPLATE_CONFLICT_MESSAGE, "该域名已经绑定其他模板");
  });
});

describe("public channel runtime", () => {
  it("distinguishes MIXED and SPECIFIC country modes and isolates same-host codes", () => {
    const base = {
      enabled: true,
      host: "go.example.com",
      template: { id: 1, assetsUrl: "/buyer/v1", runtimeVersion: "v1" }
    } as const;
    const mixed = resolveChannelRuntime({
      ...base,
      channelCode: "A001",
      countryMode: "MIXED",
      countries: ["US", "GB"],
      initialDialCode: "+1"
    });
    const specific = resolveChannelRuntime({
      ...base,
      channelCode: "A002",
      countryMode: "SPECIFIC",
      countries: ["GB", "US"],
      selectedCountry: "GB",
      initialDialCode: "+44",
      template: { id: 2, assetsUrl: "/buyer/v2", runtimeVersion: "v2" }
    });
    assert.deepEqual(mixed.countries, ["US", "GB"]);
    assert.equal(mixed.initialDialCode, "+1");
    assert.deepEqual(specific.countries, ["GB"]);
    assert.equal(specific.initialDialCode, "+44");
    assert.notEqual(mixed.channelCode, specific.channelCode);
    assert.notEqual(
      mixed.template.runtimeVersion,
      specific.template.runtimeVersion
    );
    assert.throws(
      () =>
        resolveChannelRuntime({
          ...base,
          enabled: false,
          channelCode: "OFF",
          countryMode: "MIXED",
          countries: [],
          initialDialCode: "+1"
        }),
      /不可用/
    );
  });
});

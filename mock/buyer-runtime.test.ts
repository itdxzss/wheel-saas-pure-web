import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveMockBuyerRuntime,
  type MockRuntimeChannel
} from "./buyer-runtime";

describe("buyer runtime mock", () => {
  it("uses channelCode to isolate channels sharing one host", () => {
    const channels: MockRuntimeChannel[] = [
      {
        id: 1,
        domain: "go.example.com",
        channelCode: "A",
        runtimeVersion: "channel-v5",
        status: "ENABLED",
        countryMode: "MIXED",
        countries: ["US", "GB"],
        targetCountry: "US",
        defaultDialCode: "+1",
        templateId: 1,
        themeColor: "#409EFF",
        platform: "FACEBOOK",
        pixelId: "pixel-a",
        eventLead: "Lead",
        eventInitiateCheckout: "InitiateCheckout",
        eventCompleteRegistration: "CompleteRegistration",
        openInApp: true,
        joinMarketing: true
      },
      {
        id: 2,
        domain: "go.example.com",
        channelCode: "B",
        runtimeVersion: "channel-v3",
        status: "ENABLED",
        countryMode: "SPECIFIC",
        countries: ["GB"],
        targetCountry: "GB",
        defaultDialCode: "+44",
        templateId: 1,
        themeColor: "#67C23A",
        platform: "TIKTOK",
        eventLead: "Lead",
        eventInitiateCheckout: "LoginRequest",
        eventCompleteRegistration: "LoginSuccess",
        openInApp: false,
        joinMarketing: false
      }
    ];
    const templates = [
      {
        id: 1,
        code: "default",
        runtimeVersion: "template-v1",
        assets: { entry: "/buyer/templates/default/index.html" },
        params: { inviteEnabled: true, locale: "zh-CN" }
      }
    ];
    const first = resolveMockBuyerRuntime(
      channels,
      templates,
      "go.example.com",
      "A"
    );
    const second = resolveMockBuyerRuntime(
      channels,
      templates,
      "go.example.com",
      "B"
    );
    assert.deepEqual(first, {
      channelId: 1,
      channelCode: "A",
      runtimeVersion: "channel-v5",
      templateId: 1,
      templateVersion: "template-v1",
      templateAssets: { entry: "/buyer/templates/default/index.html" },
      templateParams: { inviteEnabled: true, locale: "zh-CN" },
      countryMode: "MIXED",
      allowedCountries: [
        { code: "US", dialCode: "+1" },
        { code: "GB", dialCode: "+44" }
      ],
      defaultDialCode: "+1",
      themeColor: "#409EFF",
      platform: "FACEBOOK",
      pixelId: "pixel-a",
      eventMappings: {
        lead: "Lead",
        loginRequest: "InitiateCheckout",
        loginSuccess: "CompleteRegistration"
      },
      appOpenEnabled: true,
      marketingEnabled: true
    });
    assert.deepEqual(second?.allowedCountries, [
      { code: "GB", dialCode: "+44" }
    ]);
    assert.equal(second?.defaultDialCode, "+44");
    assert.equal(JSON.stringify(first).includes("accessToken"), false);
    assert.equal(
      resolveMockBuyerRuntime(channels, templates, "go.example.com", "missing"),
      null
    );
  });
});

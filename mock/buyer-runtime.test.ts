import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMockBuyerRuntime } from "./buyer-runtime";

describe("buyer runtime mock", () => {
  it("uses channelCode to isolate channels sharing one host", () => {
    const channels = [
      {
        domain: "go.example.com",
        channelCode: "A",
        status: "ENABLED",
        countryMode: "MIXED",
        countries: ["US", "GB"],
        targetCountry: "US",
        defaultDialCode: "+1",
        templateId: 1
      },
      {
        domain: "go.example.com",
        channelCode: "B",
        status: "ENABLED",
        countryMode: "SPECIFIC",
        countries: ["GB"],
        targetCountry: "GB",
        defaultDialCode: "+44",
        templateId: 1
      }
    ];
    const templates = [{ id: 1, code: "default", runtimeVersion: "v1" }];
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
    assert.deepEqual(first?.countries, ["US", "GB"]);
    assert.equal(first?.initialDialCode, "+1");
    assert.deepEqual(second?.countries, ["GB"]);
    assert.equal(second?.initialDialCode, "+44");
    assert.equal(
      resolveMockBuyerRuntime(channels, templates, "go.example.com", "missing"),
      null
    );
  });
});

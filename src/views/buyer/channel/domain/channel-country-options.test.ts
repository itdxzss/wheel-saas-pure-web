import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toBuyerChannelCountries } from "./channel-country-options";

describe("buyer channel country options", () => {
  it("maps real country master data and excludes virtual options", () => {
    const result = toBuyerChannelCountries([
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
    ]);

    assert.deepEqual(result, [{ code: "IN", name: "印度", dialCode: "+91" }]);
  });
});

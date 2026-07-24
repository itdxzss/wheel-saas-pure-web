import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeDateV2ThemeColor,
  normalizePhoneDigits,
  resolveDateV2PathPromotionCode,
  resolveDateV2PromotionCode,
  validateDateV2Phone
} from "./date-v2-preview";

const country = {
  code: "US",
  name: "美国",
  dialCode: "+1",
  minLength: 10,
  maxLength: 10
};

describe("date v2 preview domain", () => {
  it("accepts safe theme colors and normalizes phone input", () => {
    assert.equal(normalizeDateV2ThemeColor("#12AbEF"), "#12AbEF");
    assert.equal(normalizeDateV2ThemeColor("red"), "#ff5c74");
    assert.equal(normalizePhoneDigits("(415) 555-0123"), "4155550123");
  });

  it("validates phone length for the selected country", () => {
    assert.equal(validateDateV2Phone("4155550123", country), undefined);
    assert.match(validateDateV2Phone("123", country) ?? "", /美国/);
  });

  it("reads a promotion code from a direct domain path or preview query", () => {
    assert.equal(
      resolveDateV2PromotionCode({ pathname: "/aaat99zx", search: "" }),
      "aaat99zx"
    );
    assert.equal(
      resolveDateV2PromotionCode({
        pathname: "/date-v2-preview",
        search: "?promotionCode=test1234"
      }),
      "test1234"
    );
    assert.equal(
      resolveDateV2PromotionCode({ pathname: "/buyer/channel", search: "" }),
      ""
    );
  });

  it("keeps the standalone entry path-only for every generated code", () => {
    assert.equal(resolveDateV2PathPromotionCode("/aaat99zx"), "aaat99zx");
    assert.equal(resolveDateV2PathPromotionCode("/bewbmr9k"), "bewbmr9k");
    assert.equal(resolveDateV2PathPromotionCode("/aaat99zx/1"), "aaat99zx");
    assert.equal(resolveDateV2PathPromotionCode("/bewbmr9k/1024/"), "bewbmr9k");
    assert.equal(resolveDateV2PathPromotionCode("/date-v2/aaat99zx"), "");
    assert.equal(resolveDateV2PathPromotionCode("/aaat99zx/member-1"), "");
    assert.equal(resolveDateV2PathPromotionCode("/aaat99zx/1/extra"), "");
    assert.equal(resolveDateV2PathPromotionCode("/"), "");
  });
});

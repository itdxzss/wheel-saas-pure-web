import assert from "node:assert/strict";
import { describe, it } from "node:test";
// Node 的 strip-types 测试运行器需要显式 .ts 扩展名。
// @ts-expect-error 测试运行时约束与项目打包器的扩展名规则不同。
const countryDomain = await import("./public-promotion-countries.ts");
const {
  countryFlagEmoji,
  publicPromotionCountries,
  resolvePublicPromotionCountries
} = countryDomain;

describe("public promotion countries", () => {
  it("provides the complete public country list for mixed channels", () => {
    const mixedCountries = resolvePublicPromotionCountries("MIXED");
    assert.ok(mixedCountries.length >= 240);
    assert.equal(
      new Set(mixedCountries.map(country => country.code)).size,
      mixedCountries.length
    );
    assert.equal(
      mixedCountries.find(country => country.code === "CN")?.dialCode,
      "+86"
    );
    assert.equal(
      mixedCountries.find(country => country.code === "ZA")?.dialCode,
      "+27"
    );
  });

  it("keeps the preferred countries first and known validation lengths", () => {
    assert.deepEqual(
      publicPromotionCountries.slice(0, 2).map(country => country.code),
      ["US", "IN"]
    );
    const unitedStates = publicPromotionCountries.find(
      country => country.code === "US"
    );
    assert.equal(unitedStates?.name, "美国");
    assert.equal(unitedStates?.minLength, 10);
    assert.equal(unitedStates?.maxLength, 10);
  });

  it("limits a single-country channel to its configured country", () => {
    const india = resolvePublicPromotionCountries("in");
    assert.equal(india.length, 1);
    assert.equal(india[0].code, "IN");
  });

  it("provides an emoji fallback for regions without an Iconify flag", () => {
    assert.equal(countryFlagEmoji("XK"), "🇽🇰");
    assert.equal(countryFlagEmoji(), "🌐");
  });
});

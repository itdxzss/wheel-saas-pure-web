import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node 24 requires an explicit extension for direct TS tests.
import { resolvePublicPromotionTemplate } from "./public-promotion.ts";

describe("public promotion template resolver", () => {
  it("maps supported backend template codes to isolated public pages", () => {
    assert.equal(resolvePublicPromotionTemplate("base_sex2"), "date-v2");
    assert.equal(resolvePublicPromotionTemplate("DATE_V2"), "date-v2");
    assert.equal(resolvePublicPromotionTemplate("basic_earn"), "basic-earn");
    assert.equal(resolvePublicPromotionTemplate("BASIC_EARN"), "basic-earn");
    assert.equal(
      resolvePublicPromotionTemplate("basic_party_man"),
      "basic-party-man"
    );
    assert.equal(
      resolvePublicPromotionTemplate("BASIC_PARTY_MAN"),
      "basic-party-man"
    );
    assert.equal(resolvePublicPromotionTemplate("unknown"), undefined);
  });
});

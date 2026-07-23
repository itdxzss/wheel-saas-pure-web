import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePublicPromotionTemplate } from "./public-promotion";

describe("public promotion template resolver", () => {
  it("maps supported backend template codes to isolated public pages", () => {
    assert.equal(resolvePublicPromotionTemplate("base_sex2"), "date-v2");
    assert.equal(resolvePublicPromotionTemplate("DATE_V2"), "date-v2");
    assert.equal(resolvePublicPromotionTemplate("basic_earn"), "basic-earn");
    assert.equal(resolvePublicPromotionTemplate("BASIC_EARN"), "basic-earn");
    assert.equal(resolvePublicPromotionTemplate("unknown"), undefined);
  });
});

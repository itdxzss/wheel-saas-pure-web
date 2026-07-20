import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  marketingPromotionHref,
  marketingPromotionLink,
  marketingTemplateSummary,
  marketingTemplateValue
} from "./marketing-template-info";

describe("marketing template task-list display", () => {
  it("trims and joins content with body text", () => {
    assert.equal(marketingTemplateSummary("  标题  ", "\n正文\n"), "标题 正文");
    assert.equal(marketingTemplateSummary("标题", "  "), "标题");
    assert.equal(marketingTemplateSummary(null, undefined), "—");
  });

  it("uses an em dash for empty full-text fields and links", () => {
    assert.equal(marketingTemplateValue("   "), "—");
    assert.equal(marketingTemplateValue("\n正文\n"), "\n正文\n");
    assert.equal(marketingPromotionLink("  "), "");
  });

  it("only returns an href for valid http or https links", () => {
    assert.equal(
      marketingPromotionHref(" https://example.com/a?b=1 "),
      "https://example.com/a?b=1"
    );
    assert.equal(
      marketingPromotionHref("HTTP://example.com/a"),
      "HTTP://example.com/a"
    );
    assert.equal(marketingPromotionHref("javascript:alert(1)"), undefined);
    assert.equal(marketingPromotionHref("https://"), undefined);
    assert.equal(marketingPromotionHref("not-a-link"), undefined);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./MarketingTemplatePreview.vue", import.meta.url),
  "utf8"
);

describe("marketing template preview", () => {
  it("renders button content as body without a text header", () => {
    assert.match(source, /class="wa-button-body"/);
    assert.match(source, /\[props\.form\.content, props\.form\.text\]/);
    assert.match(source, /\.wa-button-body/);
  });

  it("renders optional text as bottom small copy outside button mode", () => {
    assert.match(source, /v-if="form\.linkMode !== 'BUTTON' && form\.text"/);
    assert.match(source, /class="wa-footer-note"/);
    assert.match(source, /\.wa-footer-note/);
    assert.doesNotMatch(source, /form\.text \|\| "请输入文本"/);
  });

  it("renders promotion link preview only outside button mode", () => {
    assert.match(
      source,
      /v-if="form\.linkMode !== 'BUTTON' && form\.promotionLink"/
    );
  });

  it("previews the visible all-members mention", () => {
    assert.match(source, /v-if="form\.mentionAll"/);
    assert.match(source, />@all</);
    assert.match(source, /class="wa-mention-all"/);
  });
});

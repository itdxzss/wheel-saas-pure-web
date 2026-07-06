import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./MarketingTemplatePreview.vue", import.meta.url),
  "utf8"
);

describe("marketing template preview", () => {
  it("renders optional text as bottom small copy", () => {
    assert.match(source, /v-if="form\.text"/);
    assert.match(source, /class="wa-footer-note"/);
    assert.match(source, /\.wa-footer-note/);
    assert.doesNotMatch(source, /form\.text \|\| "请输入文本"/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./ContactTaskPreview.vue", import.meta.url),
  "utf8"
);

describe("contact task whatsapp preview", () => {
  it("renders the link card fields for a link message", () => {
    assert.match(source, /link-title/);
    assert.match(source, /link-desc/);
    assert.match(source, /link-url/);
  });

  it("treats the image as optional for an image message", () => {
    // 图文消息不传图就只发文字，预览也必须能表达这一点
    assert.match(source, /v-else-if="imageUrl"/);
  });

  it("always shows the body text because it is required for both types", () => {
    assert.match(source, /bubble-text/);
    assert.match(source, /\{\{ content \|\|/);
  });

  it("shows placeholders so an empty form still previews", () => {
    assert.match(source, /消息标题/);
    assert.match(source, /在右侧编辑内容，这里实时预览/);
  });

  it("keeps line breaks in the body", () => {
    assert.match(source, /white-space: pre-wrap/);
  });

  it("says the preview is only indicative", () => {
    assert.match(source, /真机渲染以 WhatsApp 客户端为准/);
  });
});

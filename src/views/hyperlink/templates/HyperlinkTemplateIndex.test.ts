import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("./index.vue", import.meta.url)),
  "utf8"
);
const drawer = readFileSync(
  fileURLToPath(
    new URL("./components/HyperlinkTemplateDrawer.vue", import.meta.url)
  ),
  "utf8"
);
const pageComposable = readFileSync(
  fileURLToPath(
    new URL("./composables/useHyperlinkTemplatePage.ts", import.meta.url)
  ),
  "utf8"
);

describe("hyperlink template page contract", () => {
  it("exposes the four contract permissions on their matching buttons", () => {
    assert.match(source, /tenant:hyperlink_template:view/);
    assert.match(source, /tenant:hyperlink_template:create/);
    assert.match(source, /tenant:hyperlink_template:edit/);
    assert.match(source, /tenant:hyperlink_template:copy/);
    assert.match(source, /tenant:hyperlink_template:delete/);
  });

  it("does not expose message type 2 and limits CTA editing to one URL button", () => {
    assert.doesNotMatch(drawer, /option[^\n]+value="2"/);
    assert.match(drawer, /CTA URL 按钮/);
    assert.doesNotMatch(drawer, /添加按钮/);
  });

  it("uses authorized blob previews and lifecycle cleanup through the page composable", () => {
    assert.match(source, /useHyperlinkTemplatePage/);
    assert.match(drawer, /\.jpg,\.jpeg,image\/jpeg/);
    assert.match(drawer, /500KB/);
    assert.match(pageComposable, /downloadHyperlinkTemplateImage/);
    assert.match(pageComposable, /onBeforeUnmount/);
    assert.match(pageComposable, /objectUrlController\.clear\(\)/);
  });
});

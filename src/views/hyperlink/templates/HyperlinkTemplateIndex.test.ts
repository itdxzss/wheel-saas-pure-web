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
  it("exposes the four competitor actions on their matching permissions", () => {
    assert.match(source, /tenant:hyperlink_template:create/);
    assert.match(source, /tenant:hyperlink_template:edit/);
    assert.match(source, /tenant:hyperlink_template:copy/);
    assert.match(source, /tenant:hyperlink_template:delete/);
    assert.match(source, /新建超链模板/);
    assert.match(source, />\s*编辑\s*</);
    assert.match(source, />\s*复制\s*</);
    assert.match(source, />\s*删除\s*</);
    assert.doesNotMatch(source, /详情\/预览/);
  });

  it("uses the competitor filters and three-column table", () => {
    assert.match(source, /WhatsApp 超链模板/);
    assert.match(source, /模板总数/);
    assert.match(source, /本页按钮模板/);
    assert.match(source, /el-radio-group/);
    assert.match(source, />全部</);
    assert.match(source, /模板管理/);
    assert.match(source, /本页 \{\{ rows.length \}\} 个/);
    assert.match(source, /模板名称 \/ 类型/);
    assert.match(source, /更新时间/);
    assert.match(source, /label="操作"/);
    assert.doesNotMatch(source, /label="创建时间"/);
    assert.doesNotMatch(source, /label="任务引用"/);
    assert.doesNotMatch(source, /label="版本"/);
    assert.doesNotMatch(source, /class="type-select"/);
    assert.match(pageComposable, /label: "模板名称 \/ 类型"/);
    assert.deepEqual((pageComposable.match(/label:/g) ?? []).length, 2);
  });

  it("does not expose message type 2 and limits CTA editing to one URL button", () => {
    assert.doesNotMatch(drawer, /option[^\n]+value="2"/);
    assert.match(drawer, /CTA URL 按钮/);
    assert.doesNotMatch(drawer, /添加按钮/);
    assert.doesNotMatch(drawer, /label="备注"/);
    assert.match(drawer, /底部小字/);
    assert.match(drawer, /副标题/);
    assert.match(drawer, /卡片正文/);
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

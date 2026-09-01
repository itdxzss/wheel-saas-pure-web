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
const preview = readFileSync(
  fileURLToPath(
    new URL("./components/HyperlinkTemplatePreview.vue", import.meta.url)
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
    assert.match(source, /当前条件汇总/);
    assert.match(source, /condition-summary/);
    assert.match(source, /gap: 16px/);
    assert.match(source, /padding: 0/);
    assert.match(source, /margin: 16px/);
    assert.match(source, /template-table-card/);
    assert.doesNotMatch(source, /margin: -8px/);
    assert.doesNotMatch(source, /class="stats-card"/);
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
    assert.match(drawer, /el-radio-group/);
    assert.match(drawer, /仅支持 1 个 URL 按钮/);
    assert.match(drawer, /maxlength="20"/);
    assert.match(drawer, /深度追踪/);
    assert.doesNotMatch(drawer, /添加按钮/);
    assert.doesNotMatch(drawer, /label="备注"/);
    assert.match(drawer, /底部小字/);
    assert.match(drawer, /副标题/);
    assert.match(drawer, /卡片正文/);
  });

  it("keeps the exact competitor field matrix for all three message types", () => {
    assert.match(drawer, /image: \{ 1: 1, 3: 1, 4: 3 \}/);
    assert.match(drawer, /title: \{ 1: 2, 3: 2, 4: 1 \}/);
    assert.match(drawer, /linkDescription: \{ 1: 3 \}/);
    assert.match(drawer, /promotionLink: \{ 1: 4 \}/);
    assert.match(drawer, /content: \{ 1: 5, 3: 3, 4: 2 \}/);
    assert.match(drawer, /cardText: \{ 4: 4 \}/);
    assert.match(drawer, /button: \{ 3: 4, 4: 5 \}/);
    assert.match(drawer, /messageType === 3\) return "底部小字"/);
    assert.match(drawer, /messageType === 4\) return "副标题"/);
    assert.match(
      drawer,
      /form\.value\.messageType === 4[\s\S]*\? 60[\s\S]*: 1024/
    );
    assert.match(drawer, /:required="imageRequired"/);
    assert.match(drawer, /:required="form\.messageType === 1"/);
  });

  it("uses the competitor editor hierarchy and renders three distinct previews", () => {
    assert.match(pageComposable, /return "新建超链模板"/);
    assert.match(pageComposable, /return "编辑超链模板"/);
    assert.match(drawer, /WhatsApp 真机实时预览/);
    assert.match(drawer, /section-index/);
    assert.match(drawer, /用于搜索、筛选和引用模板/);
    assert.match(drawer, /填什么左侧立即可见/);
    assert.match(drawer, /fieldOrder/);
    assert.match(drawer, /width: fit-content/);
    assert.match(drawer, /min-width: 104px/);
    assert.match(drawer, /保存模板/);
    assert.match(preview, /WhatsApp 实时预览/);
    assert.match(preview, /form\.messageType === 1/);
    assert.match(preview, /form\.messageType === 3/);
    assert.match(preview, /card-lead/);
    assert.match(preview, /模板仅保存消息内容，不包含账号范围或数据包/);
  });

  it("uses the shared asset picker with authorized blob previews and lifecycle cleanup", () => {
    assert.match(source, /useHyperlinkTemplatePage/);
    assert.match(drawer, /ResourceAssetField/);
    assert.match(drawer, /v-model="form\.assetId"/);
    assert.match(drawer, /500KB/);
    assert.match(pageComposable, /downloadResourceAsset/);
    assert.doesNotMatch(pageComposable, /uploadHyperlinkTemplateImage/);
    assert.match(pageComposable, /onBeforeUnmount/);
    assert.match(pageComposable, /objectUrlController\.clear\(\)/);
  });
});

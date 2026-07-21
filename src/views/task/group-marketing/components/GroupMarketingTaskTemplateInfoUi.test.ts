import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("group marketing task template info ui", () => {
  it("registers preview and promotion columns at the end", () => {
    const constants = source("../constants.ts");
    const lastSentAt = constants.indexOf('label: "最后发送时间"');
    const preview = constants.indexOf('label: "营销模板预览"');
    const promotion = constants.indexOf('label: "推广链接"');

    assert.ok(lastSentAt < preview && preview < promotion);
  });

  it("renders an ellipsis preview button and opens the read-only dialog", () => {
    const table = source("./GroupMarketingTaskTable.vue");

    assert.match(table, /marketingTemplateSummary/);
    assert.match(table, /openTemplatePreview/);
    assert.match(table, /class="template-summary"/);
    assert.match(table, /text-overflow: ellipsis/);
    assert.match(table, /GroupMarketingTemplatePreviewDialog/);
    assert.match(table, /dynamicColumns\[9\]/);
  });

  it("uses tooltip and only binds validated external hrefs", () => {
    const table = source("./GroupMarketingTaskTable.vue");

    assert.match(table, /<el-tooltip/);
    assert.match(table, /marketingPromotionHref/);
    assert.match(table, /target="_blank"/);
    assert.match(table, /rel="noopener noreferrer"/);
    assert.match(table, />\s*—\s*<\/span>/);
  });

  it("shows content as plain text with preserved newlines", () => {
    const dialog = source("./GroupMarketingTemplatePreviewDialog.vue");

    assert.match(dialog, /label="内容"/);
    assert.match(dialog, /label="文本"/);
    assert.match(dialog, /marketingTemplateContent/);
    assert.match(dialog, /marketingTemplateBodyText/);
    assert.match(dialog, /white-space: pre-wrap/);
    assert.doesNotMatch(dialog, /v-html/);
    assert.doesNotMatch(dialog, /保存/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./MarketingTemplateDrawer.vue", import.meta.url),
  "utf8"
);

describe("marketing template drawer", () => {
  it("labels link mode as message type", () => {
    assert.match(source, /label="消息类型"/);
    assert.match(source, /<el-option label="图文内容" value="IMAGE_TEXT" \/>/);
    assert.doesNotMatch(source, /label="超链模式"/);
  });

  it("disables save when button template has no buttons", () => {
    assert.match(source, /const saveDisabled = computed/);
    assert.match(
      source,
      /form\.value\.linkMode === "BUTTON" && form\.value\.buttons\.length === 0/
    );
    assert.match(source, /:disabled="saveDisabled"/);
  });

  it("treats text as optional copy", () => {
    assert.match(source, /<el-form-item label="文本">/);
    assert.doesNotMatch(source, /<el-form-item label="文本" required>/);
    assert.match(source, /placeholder="可选，作为底部补充说明展示"/);
  });

  it("shows promotion link only outside button mode", () => {
    assert.match(
      source,
      /<el-form-item\s+v-if="form\.linkMode !== 'BUTTON'"\s+label="推广链接"/
    );
    assert.match(source, /:required="form\.linkMode === 'NORMAL'"/);
  });

  it("offers a mention-all switch with a group notification warning", () => {
    assert.match(source, /v-model="form\.mentionAll"/);
    assert.match(source, /label="@所有人"/);
    assert.match(source, /提醒群内所有成员/);
  });

  it("validates visible fields before emitting save", () => {
    assert.match(source, /type FormInstance/);
    assert.match(source, /const formRef = ref<FormInstance>\(\)/);
    assert.match(source, /ref="formRef"/);
    assert.match(source, /await formRef\.value\.validate\(\)/);
    assert.match(source, /@click="submitForm"/);
  });
});

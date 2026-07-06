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
});

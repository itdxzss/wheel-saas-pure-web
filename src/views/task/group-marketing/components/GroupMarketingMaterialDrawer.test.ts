import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMarketingMaterialDrawer.vue", import.meta.url),
  "utf8"
);

describe("group marketing material drawer", () => {
  it("supports image text message type without buttons", () => {
    assert.match(source, /label="消息类型"/);
    assert.match(source, /<el-option label="图文内容" :value="3" \/>/);
    assert.match(source, /form\.value\.linkMode !== 2/);
    assert.doesNotMatch(source, /label="超链模式"/);
  });
});

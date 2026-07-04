import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMarketingCreateDrawer.vue", import.meta.url),
  "utf8"
);

describe("group marketing create drawer", () => {
  it("keeps marketing template required without task-level text content", () => {
    assert.match(source, /<el-form-item label="营销模板" required>/);
    assert.doesNotMatch(source, /label="文本内容"/);
    assert.doesNotMatch(source, /请输入文本消息内容，仅支持文字内容/);
  });
});

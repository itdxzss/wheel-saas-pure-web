import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("contact script task placeholder", () => {
  it("renders a centered coming-soon result like the competitor", () => {
    assert.match(source, /<el-result/);
    assert.match(source, /敬请期待/);
    assert.match(source, /justify-content: center/);
  });

  it("invents no functionality", () => {
    // 竞品这一页就是个空占位，多画一个控件都是编的
    assert.doesNotMatch(source, /el-table|el-form|el-button/);
  });
});

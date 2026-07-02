import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const pageSource = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("group import page template", () => {
  it("keeps the import list aligned with the prototype columns", () => {
    assert.doesNotMatch(pageSource, /\{\s*label:\s*"国家\/区域"/);
    assert.doesNotMatch(pageSource, /label="国家\/区域"/);
    assert.doesNotMatch(pageSource, /\{\s*label:\s*"活跃链接"/);
    assert.doesNotMatch(pageSource, /label="活跃链接"/);
  });
});

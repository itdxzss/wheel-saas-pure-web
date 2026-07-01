import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const pageSource = readFileSync(
  new URL("./index.vue", import.meta.url),
  "utf8"
);

describe("resource IP stats page template", () => {
  it("does not render the duplicated in-page title", () => {
    assert.doesNotMatch(pageSource, /<h2>\s*IP 数据统计\s*<\/h2>/);
    assert.match(pageSource, /<el-button[^>]+@click="refreshAll"/s);
  });
});

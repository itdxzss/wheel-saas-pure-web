import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMarketingDetailDrawer.vue", import.meta.url),
  "utf8"
);

describe("group marketing detail drawer", () => {
  it("uses account rollup rows and group expansion", () => {
    assert.match(source, /accountTargets/);
    assert.match(source, /label="号发送总条数"/);
    assert.match(source, /type="expand"/);
    assert.match(source, /label="群组情况"/);
    assert.match(source, /label="单群发送条数"/);
    assert.match(source, /firstGroupSummary/);
  });

  it("renames summary sent count and removes summary last sent time", () => {
    const descriptions = source.match(
      /<el-descriptions[\s\S]*?<\/el-descriptions>/
    );
    assert.ok(descriptions, "summary descriptions should exist");
    assert.match(descriptions[0], /label="总发送条数"/);
    assert.doesNotMatch(descriptions[0], /label="最后发送时间"/);
  });
});

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

  it("renders country-level sample check column and action", () => {
    assert.match(pageSource, /label="最近抽检时间"/);
    assert.match(pageSource, /@click="sampleCheckCountry\(row\)"/);
    assert.match(pageSource, />\s*检测\s*</);
  });

  it("renders country sample check dialog like the prototype", () => {
    assert.match(pageSource, /国家 IP 抽样检测/);
    assert.match(pageSource, /IP 总数量/);
    assert.match(pageSource, /可用数量/);
    assert.match(pageSource, /使用中数量/);
    assert.match(pageSource, /不可用数量/);
    assert.match(pageSource, /抽样检测数量/);
    assert.match(pageSource, /:max="sampleDialogStats\.totalIpCount"/);
  });
});

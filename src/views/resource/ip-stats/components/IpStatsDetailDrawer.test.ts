import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const drawerSource = readFileSync(
  new URL("./IpStatsDetailDrawer.vue", import.meta.url),
  "utf8"
);

const constantsSource = readFileSync(
  new URL("../constants.ts", import.meta.url),
  "utf8"
);

describe("IP stats detail drawer columns", () => {
  it("matches the prototype detail fields", () => {
    assert.match(constantsSource, /label: "失败次数"/);
    assert.match(constantsSource, /prop: "failCount"/);
    assert.match(drawerSource, /label="失败次数"/);
    assert.doesNotMatch(constantsSource, /label: "创建时间"/);
    assert.doesNotMatch(constantsSource, /label: "绑定时间"/);
    assert.doesNotMatch(drawerSource, /label="创建时间"/);
    assert.doesNotMatch(drawerSource, /label="绑定时间"/);
  });
});

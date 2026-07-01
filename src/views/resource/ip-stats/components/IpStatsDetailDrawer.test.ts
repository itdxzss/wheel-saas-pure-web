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
  it("matches prototype detail filter fields", () => {
    const filterSource = drawerSource.match(
      /<el-form class="ip-detail-filter"[\s\S]*?<\/el-form>/
    )?.[0];

    assert.ok(filterSource);
    assert.match(filterSource, /label="IP 地址"/);
    assert.match(filterSource, /v-model="searchForm\.ipKeyword"/);
    assert.match(filterSource, /placeholder="输入 IP 地址"/);
    assert.match(filterSource, /label="账号"/);
    assert.match(filterSource, /v-model="searchForm\.accountKeyword"/);
    assert.match(filterSource, /placeholder="输入账号"/);
    assert.match(constantsSource, /"SOCKS5"/);
    assert.doesNotMatch(filterSource, /label="IP 地址 \/ 来源"/);
    assert.doesNotMatch(filterSource, /label="分配方式"/);
    assert.doesNotMatch(filterSource, /label="来源"/);
    assert.doesNotMatch(constantsSource, /"SOCKETS"/);
  });

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

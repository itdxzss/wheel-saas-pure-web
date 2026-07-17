import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relative: string): string {
  const url = new URL(relative, import.meta.url);
  assert.ok(existsSync(url), `${relative} should exist`);
  return readFileSync(url, "utf8");
}

describe("buyer channel stats page contract", () => {
  it("renders all filters, actions, grouped wide headers and no pagination", () => {
    const page = source("./index.vue");
    const table = source("./components/ChannelStatsTable.vue");
    const daily = source("./components/DailyStatsRows.vue");
    for (const text of [
      "日期范围",
      "渠道",
      "渠道名称",
      "模板",
      "目标国家",
      "创建人",
      "父级用户",
      "查询",
      "重置",
      "导出",
      "渠道/国家",
      "绑定模板",
      "广告投放",
      "消耗",
      "展示",
      "点击/点击率",
      "其他费用",
      "总费用/手续费",
      "基础指标",
      "UV",
      "访问时长",
      "登录请求次数/去重人数",
      "登录成功次数/去重人数",
      "解绑数量",
      "解绑率",
      "请求登录率",
      "登录成功率",
      "访客上号率",
      "获号成本"
    ])
      assert.ok(`${page}\n${table}`.includes(text), text);
    assert.doesNotMatch(`${page}\n${table}`, /<el-pagination/);
    assert.ok(page.includes("tenant:buyer-channel-stats:export"));
    assert.ok(daily.includes("tenant:buyer-channel-stats:edit"));
    assert.match(page, /:clearable="false"/);
    assert.ok(page.includes("normalizeShanghaiDateRange"));
  });

  it("uses editable daily rows and keeps production fake server disabled", () => {
    const daily = source("./components/DailyStatsRows.vue");
    for (const field of [
      "spend",
      "impressions",
      "clicks",
      "serviceRate",
      "otherFee"
    ])
      assert.ok(daily.includes(field), field);
    const plugins = readFileSync(
      new URL("../../../../build/plugins.ts", import.meta.url),
      "utf8"
    );
    assert.match(plugins, /enableProd:\s*false/);
    const buyerMock = readFileSync(
      new URL("../../../../mock/buyer.ts", import.meta.url),
      "utf8"
    );
    assert.ok(buyerMock.includes("summarizeChannelStats"));
    assert.ok(buyerMock.includes("body.dateStart"));
    assert.ok(buyerMock.includes("body.dateEnd"));
  });

  it("passes effective leaf visibility from 自定义列 while keeping required columns", () => {
    const page = source("./index.vue");
    const table = source("./components/ChannelStatsTable.vue");
    for (const prop of [
      "spend",
      "impressions",
      "clicks",
      "otherFee",
      "totalFee",
      "uv",
      "visitDurationSeconds",
      "loginRequestCount",
      "loginSuccessUserCount",
      "unbindCount",
      "unbindRate",
      "loginRequestRate",
      "loginSuccessRate",
      "visitorConversionRate",
      "accountCost"
    ])
      assert.match(page, new RegExp(`prop:\\s*["']${prop}["']`), prop);
    assert.ok(page.includes("自定义列"));
    assert.match(page, /#default="\{ dynamicColumns \}"/);
    assert.match(page, /:columns="dynamicColumns"/);
    assert.match(table, /columns:.*Array/s);
    assert.match(table, /v-if="isColumnVisible\(/);
    assert.match(page, /prop: "channelName"[\s\S]*?hide:\s*false/);
    assert.match(page, /prop: "templateName"[\s\S]*?hide:\s*false/);
  });
});

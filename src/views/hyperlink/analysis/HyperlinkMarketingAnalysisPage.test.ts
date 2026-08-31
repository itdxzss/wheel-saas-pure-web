import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("./index.vue");
const kpis = read("./components/MarketingStatsKpis.vue");
const table = read("./components/MarketingStatsCountryTable.vue");
const trend = read("./components/MarketingStatsTrendChart.vue");
const api = read("../../../api/hyperlink-analysis.ts");

describe("hyperlink marketing analysis page contract", () => {
  it("offers the frozen dimensions and bounded day/hour windows", () => {
    for (const text of [
      "按日",
      "按小时",
      "日维度最多查询 90 天",
      "小时维度最多查询 7 天",
      "任务类型",
      "发信国家",
      "被营销国家",
      "账号类型",
      "设备系统",
      "Android",
      "iPhone",
      "深度追踪",
      "商业号"
    ]) {
      assert.ok(page.includes(text), text);
    }
    assert.match(page, /YYYY-MM-DD HH:mm:ss/);
  });

  it("renders eight KPI cards plus country-pair detail and aggregate trend", () => {
    assert.equal(kpis.match(/key: "/g)?.length, 8);
    for (const text of [
      "发送量",
      "单钩 / 单钩率",
      "双钩 / 双钩率",
      "访问率",
      "点击 UV",
      "使用号数",
      "号均",
      "封号 / 封号率"
    ]) {
      assert.ok(kpis.includes(text), text);
    }
    assert.match(table, /国家对（发信 → 被营销）/);
    assert.match(table, /row\.series/);
    assert.match(trend, /发送量/);
    assert.match(trend, /单钩量/);
    assert.match(trend, /封号数/);
    assert.match(trend, /号均（单钩 \/ 号）/);
  });

  it("uses only marketing-stats and countries with camelCase filters", () => {
    assert.equal(api.match(/armadaRequest</g)?.length, 2);
    assert.match(api, /\/api\/hyperlink-tasks\/marketing-stats/);
    assert.match(api, /\/api\/hyperlink-tasks\/marketing-stats\/countries/);
    assert.match(api, /deviceOs/);
    assert.match(api, /shortLinkEnabled/);
    assert.match(api, /overview: HyperlinkMarketingMetric/);
    assert.doesNotMatch(api, /\/(?:market-)?accounts|\/export/i);
    assert.doesNotMatch(api, /platform|isShortLinkEnabled/);
  });
});

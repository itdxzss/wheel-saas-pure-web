import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

function read(name: string): string {
  return readFileSync(new URL(`./${name}`, import.meta.url), "utf8");
}

describe("H6 hyperlink attribution tabs", () => {
  it("exposes only the three competitor-derived analysis tabs", () => {
    const source = read("HyperlinkAttributionTabs.vue");
    assert.match(source, /label="深度归因"/);
    assert.match(source, /label="访问趋势"/);
    assert.match(source, /label="封号原因"/);
    assert.match(source, /AttributionTab/);
    assert.match(source, /VisitTrendTab/);
    assert.match(source, /BanReasonStatsTab/);
  });

  it("covers attribution filters, metrics, sorting, export, refresh, columns and errors", () => {
    const source = read("AttributionTab.vue");
    for (const label of [
      "收件号码",
      "发信账号",
      "点击总数",
      "单钩数",
      "点击率",
      "国家/地区",
      "操作系统",
      "首次访问",
      "最近访问"
    ])
      assert.ok(source.includes(label), label);
    assert.match(source, /@keyup\.enter="search"/);
    assert.match(source, /sortable="custom"/);
    assert.match(source, /PureTableBar/);
    assert.match(source, /dynamicColumns/);
    assert.match(source, /exportHyperlinkAttribution/);
    assert.match(source, /@refresh="load"/);
    assert.match(source, /type="error"/);
    assert.match(source, /\[10, 20, 50, 100, 200\]/);
  });

  it("renders privacy masking and retention states without leaking UA", () => {
    const source = read("AttributionIpCell.vue");
    assert.match(source, /maskedFields\.includes\('ip'\)/);
    assert.match(source, /无敏感归因查看权限/);
    assert.match(source, /90 天保留策略/);
    assert.match(source, /User-Agent/);
  });

  it("covers all ranges, chart-table switch, summaries, peaks, export and explicit PV limits", () => {
    const source = read("VisitTrendTab.vue");
    assert.match(source, /\["12h", "24h", "36h", "48h", "72h"\]/);
    assert.match(source, /"30m"/);
    assert.match(source, /趋势图/);
    assert.match(source, /数据表/);
    for (const label of [
      "总 UV",
      "点击率",
      "任务开始",
      "首次访问",
      "UV 高峰",
      "总 PV"
    ])
      assert.ok(source.includes(label), label);
    assert.match(source, /趋势解读/);
    assert.match(source, /topPeaks/);
    assert.match(source, /exportHyperlinkVisitTrend/);
    assert.match(source, /历史逐时 PV 不伪造分桶/);
    assert.match(source, /type="error"/);
  });

  it("shows deduplicated ban total, reason distribution, unknown-ready empty and errors", () => {
    const source = read("BanReasonStatsTab.vue");
    assert.match(source, /封号总数/);
    assert.match(source, /invalidAccountCount/);
    assert.match(source, /item\.reason/);
    assert.match(source, /item\.percentage\.toFixed\(1\)/);
    assert.match(source, /该任务暂无封号记录/);
    assert.match(source, /type="error"/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const drawer = readFileSync(
  new URL("./components/HyperlinkTaskDetailDrawer.vue", import.meta.url),
  "utf8"
);
const summary = readFileSync(
  new URL("./components/HyperlinkTaskSummaryCards.vue", import.meta.url),
  "utf8"
);
const recipients = readFileSync(
  new URL("./components/HyperlinkRecipientStatsTab.vue", import.meta.url),
  "utf8"
);
const state = readFileSync(
  new URL("./composables/useHyperlinkRecipientStats.ts", import.meta.url),
  "utf8"
);
const domain = readFileSync(
  new URL("./domain/recipient-stats.ts", import.meta.url),
  "utf8"
);

describe("hyperlink task H4 detail drawer", () => {
  it("renders the 1300px public shell, five stable tabs and real extension slots", () => {
    assert.match(drawer, /size="min\(100vw, 1300px\)"/);
    assert.match(drawer, /任务收信人 ·/);
    for (const key of [
      "recipients",
      "accounts",
      "clicks",
      "visit-trend",
      "ban-stats"
    ]) {
      assert.match(drawer, new RegExp(`name="${key}"`));
    }
    for (const slot of ["accounts", "clicks", "visit-trend", "ban-stats"]) {
      assert.match(drawer, new RegExp(`<slot\\s+name="${slot}"`));
    }
    assert.match(drawer, /defineExpose\(\{ switchTab, refresh \}\)/);
    assert.doesNotMatch(drawer, /mock|模拟数据|占位数据/i);
  });

  it("shows all six cards, status legend and competitor delivery warning", () => {
    const contract = `${summary}\n${domain}`.replace(/\s+/g, "");
    for (const label of [
      "单钩",
      "双钩 / 双钩率",
      "失败 / 未开通 WS",
      "使用号数",
      "封号数",
      "号均发量",
      "状态图例",
      "落地率 ≈ 双钩率 + 20%",
      "聚合数据约每分钟同步一次"
    ]) {
      assert.ok(contract.includes(label.replace(/\s+/g, "")), label);
    }
  });

  it("covers four filters, search reset refresh export and server pagination", () => {
    for (const label of [
      "收信号码",
      "收信国家",
      "发信国家",
      "完整失败原因",
      "搜索",
      "重置",
      "导出"
    ]) {
      assert.match(recipients, new RegExp(label));
    }
    assert.match(recipients, /@refresh="state\.refresh"/);
    assert.match(recipients, /recipientPageSizes/);
    assert.match(state, /page: 1/);
    assert.match(state, /pageSize/);
    assert.match(state, /listRecipients/);
  });

  it("renders the three competitor columns with column settings and failure tooltip", () => {
    for (const label of ["收信号码", "发送账号", "状态 / 失败原因"]) {
      assert.match(recipients, new RegExp(label));
    }
    assert.match(recipients, /<PureTableBar/);
    assert.match(recipients, /:columns="columns"/);
    assert.match(recipients, /dynamicColumns\[0\]\.hide/);
    assert.match(recipients, /dynamicColumns\[1\]\.hide/);
    assert.match(recipients, /dynamicColumns\[2\]\.hide/);
    assert.match(recipients, /class="failure-reason"/);
    assert.match(recipients, /<el-tooltip/);
  });

  it("has explicit empty, loading failure, permission and export failure states", () => {
    assert.match(recipients, /v-loading="state\.loading"/);
    assert.match(recipients, /暂无符合条件的收信人流水/);
    assert.match(recipients, /state\.permissionDenied/);
    assert.match(recipients, /加载失败/);
    assert.match(state, /导出失败，请重新操作/);
    assert.match(state, /导出文件已过期/);
    assert.match(state, /stopExportPolling/);
    assert.match(summary, /统计加载失败/);
    assert.match(summary, /权限不足/);
  });
});

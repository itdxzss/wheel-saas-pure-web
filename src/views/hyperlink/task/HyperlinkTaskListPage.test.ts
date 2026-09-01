import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const page = source("./index.vue");
const intro = source("./components/HyperlinkTaskIntro.vue");
const search = source("./components/HyperlinkTaskSearchCard.vue");
const metrics = source("./components/HyperlinkTaskMetrics.vue");
const table = source("./components/HyperlinkTaskTable.vue");
const tableStyle = source("./components/HyperlinkTaskTable.scss");
const progressCell = source("./components/HyperlinkTaskProgressCell.vue");
const actions = source("./components/HyperlinkTaskRowActions.vue");
const composable = source("./composables/useHyperlinkTaskPage.ts");
const domain = source("./domain/list-display.ts");
const tableBar = source("../../../components/RePureTableBar/src/bar.tsx");

describe("hyperlink task H1 list page contract", () => {
  it("keeps all competitor filters, page sizes, six cards and fifteen columns", () => {
    for (const label of [
      "任务名",
      "状态",
      "任务类型",
      "目标国家",
      "创建时间"
    ]) {
      assert.match(search, new RegExp(label));
    }
    assert.match(table, /\[10, 20, 50, 100, 200\]/);
    assert.match(composable, /pageSize\.value = 200/);
    assert.match(composable, /pageSize\.value = 20/);
    for (const label of [
      "任务数",
      "发送总数",
      "单钩数",
      "双钩数",
      "点击 UV",
      "点击率"
    ]) {
      assert.match(metrics, new RegExp(label));
    }
    assert.equal((domain.match(/label: "/g) ?? []).length >= 15, true);
  });

  it("keeps the reference green pricing banner, three modes and lifecycle explanation", () => {
    for (const label of [
      "WhatsApp 超链群发",
      "普通模式",
      "超级模式",
      "单价",
      "即时",
      "预发布",
      "周期",
      "暂停",
      "恢复",
      "停止"
    ]) {
      assert.match(intro, new RegExp(label));
    }
    assert.match(intro, /价格加载失败，点击重试/);
  });

  it("keeps manual refresh, export, new, column settings and five-state entries", () => {
    assert.match(table, /@refresh="emit\('refresh'\)"/);
    assert.match(table, /导出 CSV/);
    assert.match(table, /新建超链群发任务/);
    assert.match(tableBar, /列设置/);
    assert.match(tableBar, /columns-change/);
    assert.match(composable, /currentUserTenantColumnKey/);
    for (const action of [
      "START",
      "PAUSE",
      "RESUME",
      "STOP",
      "EDIT",
      "VIEW",
      "DETAIL",
      "COPY"
    ]) {
      assert.match(actions + domain, new RegExp(action));
    }
    assert.doesNotMatch(
      `${page}\n${table}\n${actions}\n${composable}`,
      /DELETE|删除按钮|setInterval/
    );
  });

  it("shows single-hook and double-hook counts together in each task progress cell", () => {
    assert.match(progressCell, /single-hook[\s\S]*row\.successNum/);
    assert.match(progressCell, /double-hook[\s\S]*row\.deliveredNum/);
    assert.equal(
      progressCell.indexOf("single-hook") < progressCell.indexOf("double-hook"),
      true
    );
  });

  it("shows actual finish time and keeps the metric block visually aligned", () => {
    assert.match(table, /taskScheduleDisplay\(row\)\.kind === 'finished'/);
    assert.match(table, /formatEpochMillis\(row\.finishedAt\)/);
    assert.doesNotMatch(table, /fixed="left"/);
    assert.doesNotMatch(table, /row\.actualConcurrency \|\| "-"/);
    assert.match(table, /双钩数 \/ 双钩率/);
    assert.match(table, /点击 UV \/ 点击率/);
    assert.match(table, /累计实际运行时长，暂停期间不计时/);
    assert.match(tableStyle, /metric-rate--success/);
    assert.match(tableStyle, /schedule-time--finished/);
  });

  it("renders success and failure as separate progress-bar segments", () => {
    assert.doesNotMatch(progressCell, /<el-progress/);
    assert.match(
      progressCell,
      /task-progress-segment--success"[\s\S]*?progress\(row\.successNum\)/
    );
    assert.match(
      progressCell,
      /task-progress-segment--failed"[\s\S]*?progress\(row\.failedNum\)/
    );
    assert.match(
      progressCell,
      /task-progress-segment--failed[\s\S]*?var\(--el-color-danger/
    );
    assert.match(progressCell, /flex: 0 0 auto/);
  });

  it("connects H2 H4 H5 H6 and the H3 START confirmation boundary", () => {
    assert.match(page, /event: "open-editor"/);
    assert.match(page, /event: "open-detail"/);
    assert.match(page, /event: "request-start"/);
    assert.match(page, /initialTab: "recipients" \| "visit-trend"/);
    assert.match(page, /rangeHours: 24/);
    assert.match(page, /HyperlinkTaskEditorDrawer/);
    assert.match(page, /HyperlinkTaskStartReviewDialog/);
    assert.match(page, /HyperlinkTaskDetailDrawer/);
    assert.match(page, /AccountStatsTab/);
    assert.match(page, /AttributionTab/);
    assert.match(page, /VisitTrendTab/);
    assert.match(page, /BanReasonStatsTab/);
    assert.doesNotMatch(page, /等待 H[23456]/);
  });

  it("keeps old rows during retry, rejects stale requests and never auto refreshes", () => {
    assert.match(composable, /sequence !== requestSequence/);
    assert.doesNotMatch(composable, /rows\.value = \[\][\s\S]{0,120}catch/);
    assert.match(table, /当前条件没有结果/);
    assert.match(table, /暂无超链任务/);
    assert.doesNotMatch(composable, /setInterval|setTimeout/);
  });
});

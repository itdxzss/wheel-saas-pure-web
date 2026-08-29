import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("contact hyperlink task list", () => {
  it("renders the seven competitor columns", () => {
    for (const label of [
      "消息类型 / 内容",
      "状态",
      "进度（成功 / 计划）",
      "账号统计",
      "账号范围",
      "计划开始时间",
      "操作"
    ]) {
      assert.ok(source.includes(label), `missing column ${label}`);
    }
  });

  it("shows a success rate progress bar", () => {
    assert.match(source, /<el-progress/);
    assert.match(source, /successPercent\(row\)/);
  });

  it("never divides by zero when nothing is planned", () => {
    assert.match(source, /if \(total <= 0\)/);
  });

  it("shows all three account statistics", () => {
    assert.match(source, /使用号数/);
    assert.match(source, /封号数/);
    assert.match(source, /号均发量/);
  });

  it("collapses the account range tags past three", () => {
    assert.match(source, /RANGE_TAG_LIMIT = 3/);
    assert.match(source, /\+\{\{ hiddenRangeCount\(row\) \}\}/);
  });

  it("marks excluded countries differently and shows a flag", () => {
    assert.match(source, /排除 \$\{iso2\}/);
    assert.match(source, /tag\.excluded \? 'danger' : 'info'/);
    assert.match(source, /flagUrl\(tag\.iso2\)/);
  });

  it("says an unfiltered task targets every valid account", () => {
    assert.match(source, /全部有效账号/);
  });

  it("drives status and row actions from the shared domain rules", () => {
    assert.match(source, /statusLabel\(row\.isEnabled, row\.runStatus\)/);
    assert.match(source, /rowActions\(row\.isEnabled, row\.runStatus\)/);
    // 不在模板里重写一遍状态分支，否则和 domain 的口径会分裂
    assert.doesNotMatch(source, /runStatus === 1/);
  });

  it("warns that stopping is irreversible", () => {
    assert.match(source, /停止后任务将被终止，且无法恢复/);
  });

  it("has no delete action anywhere", () => {
    assert.doesNotMatch(source, /删除/);
  });

  it("opens the new task drawer because we un-gate what the competitor disabled", () => {
    assert.match(source, /新建任务/);
    assert.match(source, /page\.openCreate/);
  });

  it("exports the current page as twelve column csv with a bom", () => {
    assert.match(source, /导出本页 CSV/);
    const headerBlock = source.slice(
      source.indexOf("const csvRows"),
      source.indexOf("/** 导出本页数据为 CSV")
    );
    const columns = headerBlock.match(/^\s{4}[^\s:]+:/gm) ?? [];
    assert.equal(columns.length, 12);
    assert.match(source, /\\ufeff|﻿/);
  });

  it("offers the competitor page sizes", () => {
    assert.match(source, /\[10, 20, 50, 100, 200\]/);
  });

  it("wires both drawers", () => {
    assert.match(source, /<ContactTaskDrawer/);
    assert.match(source, /<ContactTaskAccountDrawer/);
  });
  it("previews the body text for an image message, not the task name", () => {
    // 图文消息没有标题，内容列要给文案预览；用任务名充数等于列里没信息
    assert.match(source, /function contentPreview/);
    assert.match(
      source,
      /row\.messageType === MESSAGE_TYPE_LINK \? row\.title : row\.content/
    );
  });

  it("truncates a long preview instead of blowing up the column", () => {
    assert.match(source, /trimmed\.length > 40/);
  });

  it("labels every filter that can appear in the range column", () => {
    for (const label of ["好友≥", "在线", "安卓", "错误码", "限定创建时间"]) {
      assert.ok(source.includes(label), `range column cannot show ${label}`);
    }
  });
});

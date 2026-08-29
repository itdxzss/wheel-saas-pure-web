import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RUN_STATUS_OPTIONS,
  rowActions,
  statusLabel,
  statusTagType
} from "./task-status";

describe("contact task status display", () => {
  it("shows 已停用 regardless of run status when the task is disabled", () => {
    // 双状态字段的展示优先级：isEnabled=0 压过一切
    assert.equal(statusLabel(0, 1), "已停用");
    assert.equal(statusLabel(0, 2), "已停用");
  });

  it("falls back to the five run statuses when enabled", () => {
    assert.equal(statusLabel(1, 0), "未开始");
    assert.equal(statusLabel(1, 1), "进行中");
    assert.equal(statusLabel(1, 2), "已完成");
    assert.equal(statusLabel(1, 3), "已暂停");
    assert.equal(statusLabel(1, 4), "已停止");
  });

  it("gives each status a distinguishable tag type", () => {
    assert.equal(statusTagType(0, 0), "info");
    assert.equal(statusTagType(1, 1), "primary");
    assert.equal(statusTagType(1, 2), "success");
    assert.equal(statusTagType(1, 3), "warning");
    assert.equal(statusTagType(1, 4), "danger");
  });

  it("offers the search dropdown exactly the five run statuses", () => {
    assert.deepEqual(
      RUN_STATUS_OPTIONS.map(o => o.value),
      [0, 1, 2, 3, 4]
    );
  });
});

describe("contact task row actions", () => {
  it("lets a not-started task be started and edited", () => {
    assert.deepEqual(rowActions(1, 0), ["start", "edit", "data"]);
  });

  it("lets a running task be paused or stopped, view only otherwise", () => {
    assert.deepEqual(rowActions(1, 1), ["pause", "stop", "view", "data"]);
  });

  it("lets a paused task resume or stop", () => {
    assert.deepEqual(rowActions(1, 3), ["resume", "stop", "view", "data"]);
  });

  it("leaves terminal tasks view only", () => {
    assert.deepEqual(rowActions(1, 2), ["view", "data"]);
    assert.deepEqual(rowActions(1, 4), ["view", "data"]);
  });

  it("always offers the account data drawer", () => {
    // 「账号数据」在任何状态都要能点开
    for (const runStatus of [0, 1, 2, 3, 4]) {
      assert.ok(rowActions(1, runStatus).includes("data"));
    }
    assert.ok(rowActions(0, 0).includes("data"));
  });

  it("never offers delete because neither the api nor the competitor has it", () => {
    for (const runStatus of [0, 1, 2, 3, 4]) {
      assert.ok(!rowActions(1, runStatus).includes("delete" as never));
    }
  });

  it("treats a disabled task as editable and startable", () => {
    // 停用只是「保存了不发」，仍然可以改和启动
    assert.deepEqual(rowActions(0, 0), ["start", "edit", "data"]);
  });
});

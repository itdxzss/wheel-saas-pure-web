import { describe, expect, it } from "vitest";
import {
  RUN_STATUS_OPTIONS,
  rowActions,
  statusLabel,
  statusTagType
} from "./task-status";

describe("contact task status display", () => {
  it("shows 已停用 regardless of run status when the task is disabled", () => {
    // 双状态字段的展示优先级：isEnabled=0 压过一切
    expect(statusLabel(0, 1)).toBe("已停用");
    expect(statusLabel(0, 2)).toBe("已停用");
  });

  it("falls back to the five run statuses when enabled", () => {
    expect(statusLabel(1, 0)).toBe("未开始");
    expect(statusLabel(1, 1)).toBe("进行中");
    expect(statusLabel(1, 2)).toBe("已完成");
    expect(statusLabel(1, 3)).toBe("已暂停");
    expect(statusLabel(1, 4)).toBe("已停止");
  });

  it("gives each status a distinguishable tag type", () => {
    expect(statusTagType(0, 0)).toBe("info");
    expect(statusTagType(1, 1)).toBe("primary");
    expect(statusTagType(1, 2)).toBe("success");
    expect(statusTagType(1, 3)).toBe("warning");
    expect(statusTagType(1, 4)).toBe("danger");
  });

  it("offers the search dropdown exactly the five run statuses", () => {
    expect(RUN_STATUS_OPTIONS.map(o => o.value)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("contact task row actions", () => {
  it("lets a not-started task be started and edited", () => {
    expect(rowActions(1, 0)).toEqual(["start", "edit", "data"]);
  });

  it("lets a running task be paused or stopped, view only otherwise", () => {
    expect(rowActions(1, 1)).toEqual(["pause", "stop", "view", "data"]);
  });

  it("lets a paused task resume or stop", () => {
    expect(rowActions(1, 3)).toEqual(["resume", "stop", "view", "data"]);
  });

  it("leaves terminal tasks view only", () => {
    expect(rowActions(1, 2)).toEqual(["view", "data"]);
    expect(rowActions(1, 4)).toEqual(["view", "data"]);
  });

  it("always offers the account data drawer", () => {
    // 「账号数据」在任何状态都要能点开
    for (const runStatus of [0, 1, 2, 3, 4]) {
      expect(rowActions(1, runStatus)).toContain("data");
    }
    expect(rowActions(0, 0)).toContain("data");
  });

  it("never offers delete because neither the api nor the competitor has it", () => {
    for (const runStatus of [0, 1, 2, 3, 4]) {
      expect(rowActions(1, runStatus)).not.toContain("delete");
    }
  });

  it("treats a disabled task as editable and startable", () => {
    // 停用只是「保存了不发」，仍然可以改和启动
    expect(rowActions(0, 0)).toEqual(["start", "edit", "data"]);
  });
});

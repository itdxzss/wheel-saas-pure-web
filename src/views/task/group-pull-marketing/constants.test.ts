import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blockReasonLabel,
  builderExitStatusLabel,
  executionStageLabel,
  executionStatusLabel,
  groupLinkMeta,
  groupStatusLabel,
  groupStatusTagType,
  groupPullTaskActions,
  marketerAdminStatusLabel,
  marketingSendStatusLabel,
  requiresMarketerAdmin,
  resourceStatusLabel,
  taskColumns,
  taskStatusLabel
} from "./constants";

describe("group pull marketing constants", () => {
  it("keeps the nine merged task-list columns in prototype order", () => {
    assert.deepEqual(
      taskColumns.map(column => column.label),
      [
        "任务信息",
        "任务状态",
        "群组处理进度",
        "拉人结果",
        "营销进度",
        "消息发送",
        "异常情况",
        "剩余资源",
        "时间/操作"
      ]
    );
  });

  it("maps the three independent task status dimensions", () => {
    assert.deepEqual([1, 2, 5, 7, 8].map(taskStatusLabel), [
      "待启动",
      "执行中",
      "已暂停",
      "已完成",
      "已手动结束"
    ]);
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(blockReasonLabel), [
      "无",
      "等待建群账号",
      "等待营销账号",
      "等待料子数据",
      "系统异常",
      "人工处理"
    ]);
    assert.deepEqual([1, 2, 3, 4].map(resourceStatusLabel), [
      "未锁定",
      "已锁定",
      "释放中",
      "已释放"
    ]);
    assert.equal(taskStatusLabel(99), "-");
    assert.equal(blockReasonLabel(99), "-");
    assert.equal(resourceStatusLabel(99), "-");
  });

  it("returns only lifecycle actions allowed by task and resource status", () => {
    assert.deepEqual(groupPullTaskActions({ status: 1, resourceStatus: 1 }), [
      "start",
      "detail",
      "delete"
    ]);
    assert.deepEqual(groupPullTaskActions({ status: 2, resourceStatus: 2 }), [
      "pause",
      "release",
      "detail"
    ]);
    assert.deepEqual(groupPullTaskActions({ status: 5, resourceStatus: 2 }), [
      "resume",
      "release",
      "detail"
    ]);
    assert.deepEqual(groupPullTaskActions({ status: 7, resourceStatus: 3 }), [
      "detail"
    ]);
    assert.deepEqual(groupPullTaskActions({ status: 8, resourceStatus: 4 }), [
      "detail"
    ]);
  });

  it("derives whether the marketing account must become administrator", () => {
    assert.equal(requiresMarketerAdmin(2, false), true);
    assert.equal(requiresMarketerAdmin(1, true), true);
    assert.equal(requiresMarketerAdmin(3, false), false);
  });

  it("maps group execution details and protects invite links", () => {
    assert.equal(groupStatusLabel(1), "正常");
    assert.equal(groupStatusLabel(2), "封禁");
    assert.equal(groupStatusTagType(1), "success");
    assert.equal(groupStatusTagType(2), "danger");
    assert.equal(groupStatusTagType(null), "info");
    assert.equal(executionStatusLabel(3), "成功");
    assert.equal(executionStatusLabel(4), "失败");
    assert.equal(executionStageLabel(7), "权限设置");
    assert.equal(builderExitStatusLabel(2), "已退出");
    assert.equal(marketerAdminStatusLabel(3), "设置失败");
    assert.equal(marketingSendStatusLabel(1), "待发送");

    assert.deepEqual(
      groupLinkMeta({
        groupInviteUrl: "https://chat.whatsapp.com/abc",
        groupStatus: 1
      }),
      {
        label: "https://chat.whatsapp.com/abc",
        url: "https://chat.whatsapp.com/abc",
        available: true
      }
    );
    assert.equal(
      groupLinkMeta({
        groupInviteUrl: "javascript:alert(1)",
        groupStatus: 1
      }).available,
      false
    );
    assert.equal(
      groupLinkMeta({
        groupInviteUrl: "https://chat.whatsapp.com/abc",
        groupStatus: 2
      }).label,
      "链接已失效"
    );
    assert.equal(
      groupLinkMeta({
        groupInviteUrl: null,
        failureReason: "群链接获取失败"
      }).label,
      "链接获取失败"
    );
  });
});

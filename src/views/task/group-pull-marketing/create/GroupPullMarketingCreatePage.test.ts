import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function componentSource(relativePath: string): string {
  const url = new URL(relativePath, import.meta.url);
  assert.ok(existsSync(fileURLToPath(url)), `${relativePath} should exist`);
  return readFileSync(url, "utf8");
}

describe("group pull marketing create page", () => {
  it("aligns the basic information fields and empty target metrics", () => {
    const source = componentSource("./components/CreateBaseInfoSection.vue");
    for (const label of [
      "任务名称",
      "群组来源",
      "任务备注",
      "目标数据包",
      "上传 TXT",
      "原始数量",
      "有效数量",
      "重复数量",
      "格式错误",
      "无效号码",
      "未注册",
      "已成功使用",
      "其他任务预占",
      "当前可用"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /accept="\.txt"/);
    assert.match(source, /metricLabel/);
  });

  it("aligns target group settings, filters and empty candidate table", () => {
    const source = componentSource("./components/CreateTargetGroupSection.vue");
    for (const label of [
      "群资源使用方式",
      "是否清空当前群成员",
      "是否禁言",
      "群最大人数",
      "群名称修改方式",
      "群头像",
      "群描述",
      "群资料修改权限",
      "入群审批",
      "成员邀请权限",
      "目标群组选择",
      "等待任务池",
      "群组来源",
      "群所属大洲",
      "群所属国家",
      "当前账号角色",
      "群名称",
      "群组状态",
      "当前管理账号",
      "群组 JID",
      "显示普通成员群组",
      "是否被其他任务占用",
      "发言权限",
      "群存续天数",
      "群当前人数"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /<el-table/);
    assert.match(source, /<el-empty/);
    assert.doesNotMatch(source, /Indonesia Game Squad|120363401003/);
  });
});

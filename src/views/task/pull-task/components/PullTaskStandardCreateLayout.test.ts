import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8"
  );
}

const drawerSource = source("./PullTaskCreateDrawer.vue");
const resourcesSource = source("./PullTaskStandardResources.vue");
const settingsSource = source("./PullTaskStandardSettings.vue");
const planSource = source("./PullTaskStandardPlanTable.vue");
const groupSettingsUrl = new URL(
  "./PullTaskStandardGroupSettings.vue",
  import.meta.url
);
const groupSettingsSource = existsSync(groupSettingsUrl)
  ? readFileSync(fileURLToPath(groupSettingsUrl), "utf8")
  : "";
const allCreateSources = [
  drawerSource,
  resourcesSource,
  settingsSource,
  groupSettingsSource,
  planSource
].join("\n");

describe("normal-link create prototype layout", () => {
  it("keeps the create mode hierarchy inside the full create surface", () => {
    assert.match(drawerSource, /新建拉群任务/);
    assert.match(drawerSource, /新群模式/);
    assert.match(drawerSource, /群链接模式/);
    assert.match(drawerSource, /速拉模式/);
    assert.ok(
      drawerSource.indexOf("PullTaskStandardSettings") <
        drawerSource.indexOf("PullTaskStandardResources")
    );
  });

  it("groups the approved normal-link fields like the prototype", () => {
    for (const heading of [
      "模式选择",
      "任务基础",
      "执行策略",
      "拉人参数",
      "账号分组"
    ]) {
      assert.match(settingsSource, new RegExp(heading));
    }
    assert.doesNotMatch(settingsSource, /管理员数量/);
  });

  it("includes every approved non-marketing prototype field", () => {
    for (const field of [
      "群组分组",
      "拉手同步料子方式",
      "是否清空群原成员",
      "前期单次拉人数",
      "前期拉人执行次数",
      "任务完成的管理移至分组",
      "任务完成的拉手移至分组",
      "设置顺序",
      "群名称（可选）",
      "料子文件名为群名",
      "群头像（可选）",
      "群描述（可选）",
      "是否任务完成后自动关闭禁言",
      "是否任务完成后自动关闭拉人权限",
      "允许任何人编辑群组设置",
      "群禁言",
      "获取群链接权限",
      "限时消息"
    ]) {
      assert.match(allCreateSources, new RegExp(field));
    }
    for (const excludedField of [
      "营销发送间隔",
      "营销模板",
      "营销开始方式",
      "审核模式",
      "任务完成后开审核",
      "建立空白群",
      "次管理",
      "拉手退群方式",
      "管理员退群方式",
      "拉手风控时间"
    ]) {
      assert.doesNotMatch(allCreateSources, new RegExp(excludedField));
    }
  });

  it("uses the prototype field vocabulary and execution-order columns", () => {
    assert.match(settingsSource, /同时启动任务数/);
    assert.match(planSource, /进群料子/);
    assert.match(planSource, /状态/);
  });

  it("allows the selected group avatar to be replaced or cleared", () => {
    assert.doesNotMatch(groupSettingsSource, /:limit="1"/);
    assert.match(groupSettingsSource, /clearAvatar/);
    assert.match(
      groupSettingsSource,
      /\.jpg,\.jpeg,\.png,image\/jpeg,image\/png/
    );
    assert.match(groupSettingsSource, /uploadFile\.raw/);
  });

  it("does not describe approved saved fields as frontend-only", () => {
    assert.doesNotMatch(settingsSource, /新增配置.*后端接入/);
  });

  it("uses paste, drag upload and execution-order panels", () => {
    assert.match(resourcesSource, /自定义粘贴链接/);
    assert.match(resourcesSource, /\bdrag\b/);
    assert.match(resourcesSource, /料子资源（可批量）/);
    assert.match(planSource, /进群顺序展示/);
  });

  it("keeps link validation implicit instead of exposing a precheck action", () => {
    assert.match(
      resourcesSource,
      /群组分组和手工群链接任选其一；同时填写时合并使用/
    );
    assert.doesNotMatch(allCreateSources, /预检|已冻结|冻结并创建任务/);
    assert.match(resourcesSource, /handlePasteSave/);
    assert.match(resourcesSource, /scheduleAutomaticPlan/);
    assert.match(resourcesSource, /正在校验并生成执行计划/);
  });
});

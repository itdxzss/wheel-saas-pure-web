import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const drawer = read("./components/HyperlinkTaskEditorDrawer.vue");
const message = read("./components/HyperlinkMessageContentForm.vue");
const button = read("./components/HyperlinkButtonEditor.vue");
const strategy = read("./components/HyperlinkSendStrategyForm.vue");
const filter = read("./components/HyperlinkAccountFilterDrawer.vue");
const review = read("./components/HyperlinkTaskFinalReview.vue");
const composable = read("./composables/useHyperlinkTaskEditor.ts");
const taskApi = read("../../../api/hyperlink-task.ts");
const armadaApi = read("../../../api/armada.ts");
const assetPicker = read("./components/HyperlinkAssetPicker.vue");
const protectedImage = read("./components/HyperlinkProtectedAssetImage.vue");

describe("hyperlink task editor competitor surface", () => {
  it("exposes one drawer controller for all four entry modes", () => {
    for (const name of ["openCreate", "openEdit", "openView", "openCopy"]) {
      assert.match(drawer, new RegExp(name));
    }
    assert.match(drawer, /HyperlinkTaskPreview/);
    assert.match(drawer, /close-on-click-modal="false"/);
    assert.match(drawer, /close-on-press-escape="false"/);
  });

  it("contains all message types, two assets and the complete one-button editor", () => {
    assert.match(drawer, /双图文（历史）/);
    assert.match(drawer, /单图文可能在大部分手机型号上无法正常显示/);
    assert.match(message, /链接预览图/);
    assert.match(message, /正文主图/);
    assert.match(message, /卡片正文/);
    assert.match(button, /还没有按钮/);
    assert.match(button, /链接跳转/);
    assert.match(button, /maxlength="20"/);
    assert.match(button, /深度追踪/);
    assert.match(button, /添加按钮（/);
  });

  it("imports the current template selection instead of the previous model value", () => {
    assert.match(message, /@change="handleTemplateChange"/);
    assert.match(
      message,
      /emit\("use-template", typeof value === "number" \? value : null\)/
    );
    assert.doesNotMatch(message, /@change="[^"]*templateId/);
  });

  it("contains every task strategy control and task-mode hint", () => {
    for (const text of [
      "即时群发",
      "预发布",
      "周期循环",
      "计划结束时间",
      "任务执行间隔",
      "账号范围",
      "消息间隔",
      "最大执行账号数",
      "最大使用账号数",
      "每账号最大发送数",
      "启动方式",
      "延迟时间"
    ]) {
      assert.ok(strategy.includes(text), text);
    }
  });

  it("allows editable tasks to copy a strategy without exposing message templates", () => {
    assert.match(
      drawer,
      /const allowStrategyReferences = computed\([\s\S]*mode\.value === "edit"/
    );
    assert.match(drawer, /:allow-references="allowTemplateReferences"/);
    assert.match(drawer, /:allow-references="allowStrategyReferences"/);
    assert.match(
      composable,
      /mode\.value === "edit"\)[\s\S]*loadDataPackageOptions\(\), loadStrategyOptions\(\)/
    );
  });

  it("contains the complete task account filter and preserves default business groups", () => {
    for (const text of [
      "所属分组",
      "地理范围",
      "手机号",
      "导入批次号",
      "在线状态",
      "轮换状态",
      "账号类型",
      "导入方式",
      "设备类型",
      "账号性质",
      "允许拉群",
      "双向好友数",
      "存活天数",
      "注册天数",
      "协议与渠道",
      "入库时间",
      "清空条件",
      "取消",
      "确定"
    ]) {
      assert.ok(filter.includes(text), text);
    }
    assert.match(filter, /createEmptyAccountFilter\(props.defaultGroupIds\)/);
  });

  it("keeps seven-second final review and server quote details", () => {
    assert.match(review, /seconds\.value = 7/);
    assert.match(review, /当前余额/);
    assert.match(review, /预计冻结/);
    assert.match(review, /pricingBreakdown/);
    assert.match(review, /返回修改/);
    assert.match(review, /确认无误提交/);
  });

  it("loads filter candidates through create-context without menu-permission APIs", () => {
    assert.doesNotMatch(composable, /listAccountGroups/);
    assert.doesNotMatch(composable, /listGroupCountryOptions/);
    assert.doesNotMatch(composable, /listBuyerChannels/);
    for (const name of [
      "groupOptions",
      "countryOptions",
      "channelOptions",
      "protocolOptions"
    ]) {
      assert.ok(composable.includes(name), name);
    }
    assert.match(
      composable,
      /mode\.value === "create" \|\| mode\.value === "copy"/
    );
    assert.match(composable, /mode\.value === "edit"/);
  });

  it("downloads protected assets as authenticated blobs and paginates every reference source", () => {
    assert.match(taskApi, /responseType: "blob"/);
    assert.doesNotMatch(taskApi, /hyperlinkResourceAssetContentUrl/);
    assert.match(assetPicker, /加载更多/);
    assert.match(protectedImage, /useProtectedAssetUrl/);
    assert.match(composable, /listDataPackages\(\{/);
    assert.match(composable, /listHyperlinkTemplates\(\{/);
    assert.match(composable, /loadMoreDataPackages/);
    assert.match(composable, /loadMoreTemplates/);
    assert.doesNotMatch(composable, /pageSize: 200/);
    assert.doesNotMatch(composable, /limit: 100/);
  });

  it("invalidates old match results and revalidates after final review", () => {
    assert.match(composable, /function invalidateMatch/);
    assert.match(composable, /match\.value = null/);
    assert.match(
      composable,
      /async function confirmFinalReview[\s\S]*await refreshMatch\(\)[\s\S]*validationMessage\(\)/
    );
    assert.match(composable, /hasArmadaBusinessCode\(error, 40910\)/);
    assert.match(armadaApi, /class ArmadaApiError/);
    assert.match(drawer, /重新加载服务器版本/);
    assert.match(drawer, /重新提交准备/);
  });

  it("returns create and copy submissions to the task list while provisioning", () => {
    assert.match(
      composable,
      /mode\.value === "create" \|\| mode\.value === "copy"[\s\S]*visible\.value = false[\s\S]*emit\("submitted", receipt\)/
    );
    assert.match(composable, /任务 #\$\{receipt\.taskId\} 已创建，正在准备/);
  });

  it("uses full continent values and explains the current group-tag fact boundary", () => {
    for (const continent of [
      "ASIA",
      "AFRICA",
      "EUROPE",
      "NORTH_AMERICA",
      "SOUTH_AMERICA",
      "OCEANIA",
      "ANTARCTICA"
    ]) {
      assert.ok(filter.includes(continent), continent);
    }
    assert.match(filter, /当前后端未返回 tags 时只按名称匹配/);
  });
});

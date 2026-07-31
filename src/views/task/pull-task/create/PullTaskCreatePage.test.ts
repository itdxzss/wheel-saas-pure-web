import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function componentSource(relativePath: string): string {
  const url = new URL(relativePath, import.meta.url);
  assert.ok(existsSync(fileURLToPath(url)), relativePath + " should exist");
  return readFileSync(url, "utf8");
}

describe("pull task GROUP_MARKETING create page", () => {
  it("aligns basic information and target data metrics", () => {
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
    assert.match(source, /accept=".txt"/);
    assert.doesNotMatch(source, /子模式/);
  });

  it("aligns target group settings and the empty candidate table", () => {
    const source = componentSource("./components/CreateTargetGroupSection.vue");
    for (const label of [
      "群资源使用方式",
      "是否清空当前群成员",
      "是否禁言",
      "群最大人数",
      "群名称修改方式",
      "统一群名称",
      "群名称模板",
      "群头像",
      "群描述",
      "统一群描述",
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
    assert.match(source, /draft\.groupNameMode/);
    assert.match(source, /draft\.groupDescriptionMode/);
    assert.doesNotMatch(source, /Indonesia Game Squad|120363401003/);
  });

  it("aligns role resources and puller parameters", () => {
    const source = componentSource("./components/CreateRoleConfigSection.vue");
    for (const label of [
      "管理员账号",
      "拉手账号",
      "水军账号",
      "营销账号",
      "每群计划使用拉手数量",
      "每个拉手最多拉多少人",
      "单个拉手每次最多拉多少人",
      "两次拉人之间等待时间",
      "最大使用拉手总数",
      "最大使用群组数",
      "连续异常群组上限",
      "拉手最大重试次数",
      "拉手熔断次数",
      "拉手完成后是否退出群组",
      "到达执行上限后的处理方式",
      "每群计划水军人数",
      "水军单任务入群上限",
      "水军每日入群上限",
      "允许跨任务复用",
      "水军资源不足处理",
      "允许降低计划数量",
      "允许替换水军"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /账号筛选接口待确认/);
    assert.match(source, /draft\.roleAccounts/);
    assert.match(source, /clearRoleAccount/);
    assert.match(source, /roleDialogVisible/);
  });

  it("aligns marketing messages, thresholds and unmet actions", () => {
    const source = componentSource("./components/CreateMarketingSection.vue");
    for (const label of [
      "营销发送间隔",
      "营销静默时间",
      "群组封控时间",
      "单群营销账号上限",
      "营销模板",
      "模板版本",
      "推广链接",
      "模板内容预览",
      "立即发送第一条",
      "发送方式",
      "固定发送轮次",
      "消息发送总上限",
      "失败重试次数",
      "群组异常处理方式",
      "营销开始方式",
      "水军最低成功标准",
      "目标数据最低成功标准",
      "未达标处理方式",
      "继续补充",
      "更换拉手",
      "更换水军",
      "补充目标数据",
      "重试",
      "暂停当前群",
      "允许部分完成",
      "转人工",
      "放弃当前群"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /showSendRounds/);
    assert.match(source, /draft\.globalMaxMarketingAccountsPerGroup/);
    assert.match(source, /请先在拉群任务列表完成全局设置/);
  });

  it("aligns immediate and scheduled launch modes", () => {
    const source = componentSource("./components/CreateLaunchSection.vue");
    for (const label of [
      "任务启动时机",
      "任务什么时候开始",
      "创建后立即开始",
      "指定时间开始",
      "邀请链接重置能力待后端确认"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /showScheduledStart/);
    assert.match(source, /type="datetime"/);
  });

  it("assembles five sections and blocks unconfirmed API actions", () => {
    const source = componentSource("./index.vue");
    for (const component of [
      "CreateBaseInfoSection",
      "CreateTargetGroupSection",
      "CreateRoleConfigSection",
      "CreateMarketingSection",
      "CreateLaunchSection"
    ]) {
      assert.match(source, new RegExp(component));
    }
    for (const action of [
      "保存草稿",
      "校验配置",
      "预览任务",
      "取消",
      "创建并启动"
    ]) {
      assert.match(source, new RegExp(action));
    }
    assert.match(source, /GROUP_MARKETING/);
    assert.match(source, /validateCreateDraft/);
    assert.match(source, /previewVisible/);
    assert.match(source, /<el-dialog/);
    assert.match(source, /notifyUnconfirmedCreateAction/);
    assert.match(source, /usePullTaskCreateSetting/);
    assert.match(source, /onMounted/);
    assert.match(source, /:disabled="!createSettingConfigured"/);
    assert.match(
      source,
      /router.push\(\{ name: PULL_TASK_LIST_ROUTE_NAME \}\)/
    );
    assert.doesNotMatch(source, /from "@\/api\//);
    assert.doesNotMatch(source, /子模式/);
  });

  it("uses conservative compact density and keeps the two-column form", () => {
    const pageSource = componentSource("./index.vue");
    const baseSectionSource = componentSource(
      "./components/CreateBaseInfoSection.vue"
    );

    assert.match(pageSource, /--el-font-size-base:\s*13px/);
    assert.match(pageSource, /--el-component-size:\s*30px/);
    assert.match(pageSource, /\.create-section > \.el-card__header/);
    assert.match(
      pageSource,
      /\.el-form-item\)\s*\{[^}]*margin-bottom:\s*12px/s
    );
    assert.match(pageSource, /\.action-bar\s*\{[^}]*padding:\s*8px 12px/s);
    assert.match(
      baseSectionSource,
      /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/
    );
  });
});

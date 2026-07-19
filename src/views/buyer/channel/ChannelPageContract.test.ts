import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");
const drawer = readFileSync(
  new URL("./components/ChannelFormDrawer.vue", import.meta.url),
  "utf8"
);

function drawerFormItem(label: string): string {
  const labelIndex = drawer.indexOf(`label="${label}"`);
  const start = drawer.lastIndexOf("<el-form-item", labelIndex);
  const end = drawer.indexOf("</el-form-item>", labelIndex);
  return start >= 0 && end >= 0 ? drawer.slice(start, end) : "";
}

describe("buyer channel page contract", () => {
  it("loads target countries from the existing country master data API", () => {
    assert.ok(page.includes("listIpCountryOptions"));
    assert.ok(page.includes("toBuyerChannelCountries"));
  });

  it("contains required filters, columns, actions, permissions and pagination sizes", () => {
    for (const text of [
      "目标国家",
      "模板",
      "创建人",
      "父级用户",
      "渠道名称",
      "推广码",
      "绑定模板",
      "推广平台",
      "FB域名状态",
      "推广链接",
      "裂变链接",
      "预选区号",
      "状态",
      "创建时间",
      "新增",
      "刷新",
      "Facebook事件配置指引"
    ])
      assert.ok(page.includes(text), text);
    for (const permission of [
      "tenant:buyer-channel:create",
      "tenant:buyer-channel:edit",
      "tenant:buyer-channel:detect",
      "tenant:buyer-channel:delete"
    ])
      assert.ok(page.includes(permission), permission);
    assert.match(page, /pageSize[^\n]*30|page_size[^\n]*30/);
    assert.ok(page.includes("[30, 60, 200, 500]"));
  });

  it("uses Element Plus and renders all required shared drawer fields", () => {
    assert.match(drawer, /el-drawer/);
    for (const text of [
      "渠道名称",
      "所属人",
      "目标国家",
      "绑定模板",
      "主题色",
      "https://",
      "默认区号",
      "Pixel ID",
      "Access Token",
      "Lead",
      "InitiateCheckout",
      "CompleteRegistration",
      "App 内打开",
      "参加营销",
      "状态"
    ])
      assert.ok(drawer.includes(text), text);
  });

  it("uses option-driven fee, platform and event facts with MIXED/SPECIFIC dial behavior", () => {
    assert.ok(page.includes("options.uploadFee.label"));
    assert.ok(page.includes("options.uploadFee.value"));
    assert.ok(drawer.includes("混合（不限国家）"));
    assert.ok(drawer.includes("dialCodeOptions"));
    assert.ok(drawer.includes("options.platforms"));
    assert.ok(drawer.includes("options.eventOptions"));
    assert.ok(drawer.includes("countryMode"));
  });

  it("offers all countries on first open and locks SPECIFIC to its dial code", () => {
    const countryField = drawerFormItem("目标国家");
    const dialCodeField = drawerFormItem("默认区号");
    assert.ok(countryField.includes('v-for="country in options.countries"'));
    assert.ok(dialCodeField.includes('v-for="country in dialCodeOptions"'));
    assert.ok(
      dialCodeField.includes(":disabled=\"form.countryMode === 'SPECIFIC'\"")
    );
    assert.ok(drawer.includes("validateTargetCountry"));
  });

  it("renders field-level save errors and persistent channel-list retry state", () => {
    assert.ok(drawer.includes(':error="fieldErrors.domain"'));
    assert.ok(drawer.includes("fieldErrors"));
    assert.ok(page.includes("errorMessage"));
    assert.match(page, /<el-alert[\s\S]*渠道列表加载失败/);
    assert.match(page, /<el-button[\s\S]*重试/);
    assert.match(page, /catch \(error\)[\s\S]*rows\.value = \[\]/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");
const drawer = readFileSync(
  new URL("./components/ChannelFormDrawer.vue", import.meta.url),
  "utf8"
);

describe("buyer channel page contract", () => {
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
      "Facebook",
      "TikTok",
      "快手",
      "MGSKY Ads",
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
});

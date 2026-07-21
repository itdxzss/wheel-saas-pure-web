import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");
const drawer = readFileSync(
  new URL("./components/ChannelFormDrawer.vue", import.meta.url),
  "utf8"
);
const platformFields = readFileSync(
  new URL("./components/channel-platform-fields.ts", import.meta.url),
  "utf8"
);
const trackingFields = readFileSync(
  new URL("./components/channel-tracking-fields.ts", import.meta.url),
  "utf8"
);
const previewOptions = readFileSync(
  new URL("./components/channel-preview-options.ts", import.meta.url),
  "utf8"
);
const drawerContract = `${drawer}\n${platformFields}\n${trackingFields}\n${previewOptions}`;
const normalizedDrawer = drawerContract.replace(/\s+/g, " ");
const channelForm = readFileSync(
  new URL("./domain/channel-form.ts", import.meta.url),
  "utf8"
);
const channelApi = readFileSync(
  new URL("../../../api/buyer-channel.ts", import.meta.url),
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
      "归属用户",
      "目标国家",
      "绑定模板",
      "https://",
      "预选区号",
      "FB Pixel ID",
      "FB Access Token",
      "意向用户上报事件",
      "请求登录上报事件",
      "登录成功上报事件",
      "App 内打开",
      "参加营销"
    ])
      assert.ok(normalizedDrawer.includes(text), text);

    for (const text of [
      "仅用于渠道分类标记，比如主要投印度就选「印度」，选完后下方预选区号会自动填充。",
      "域名需要解析后才可正常访问，请联系运营人员配置！",
      "同一个域名只能在同一个模板下创建多个渠道链接，跨模板请使用新域名~",
      "决定用户打开渠道链接后，手机号输入框默认显示的区号。",
      "仅 Facebook / TikTok 支持 CAPI 探测",
      "用户点击广告后，可直接在"
    ])
      assert.ok(normalizedDrawer.includes(text), text);

    assert.ok(drawer.includes('type="textarea"'));
    assert.ok(drawer.includes("inline-prompt"));
    assert.doesNotMatch(drawer, /el-color-picker|label="状态"|事件映射/);
  });

  it("uses fixed preview owners, backend templates and platform facts", () => {
    assert.ok(page.includes("options.uploadFee.label"));
    assert.ok(page.includes("options.uploadFee.value"));
    assert.ok(drawer.includes("混合（不限国家）"));
    assert.ok(drawer.includes("dialCodeOptions"));
    assert.ok(drawer.includes("previewPlatformOptions"));
    assert.ok(page.includes("listBuyerTemplateOptions"));
    assert.ok(drawer.includes("options.templates"));
    assert.doesNotMatch(drawer, /previewTemplateOptions/);
    for (const platform of ["Facebook", "TikTok", "快手", "MGSKY Ads"])
      assert.ok(drawerContract.includes(platform), platform);
    for (const owner of [
      "test",
      "testuser456",
      "Rahu",
      "ForeverAditya",
      "pingzi",
      "gose-"
    ])
      assert.ok(drawerContract.includes(owner), owner);
    assert.ok(drawer.includes("reportingEventOptions"));
    assert.ok(drawer.includes("countryMode"));
  });

  it("switches pixel, token, events and app guidance by platform", () => {
    for (const text of [
      "FB Pixel ID",
      "FB Access Token",
      "TikTok Pixel ID",
      "TikTok Access Token",
      "快手 Pixel ID",
      "MGSKY Ads Pixel ID",
      "TikTok Events API 长效 Access Token"
    ])
      assert.ok(drawerContract.includes(text), text);
    assert.ok(drawer.includes("platformFieldConfig"));
    assert.ok(drawer.includes("appOpenMessage"));
    assert.ok(drawer.includes("platformFieldConfig.showEvents"));
    assert.ok(drawer.includes("validatePixelId"));
    assert.ok(drawer.includes("validateAccessToken"));
    assert.ok(drawer.includes(':required="requiresAccessToken"'));
  });

  it("only offers branded detection for Facebook and TikTok", () => {
    assert.ok(page.includes("supportsDetection"));
    assert.ok(page.includes("FacebookDetectIcon"));
    assert.ok(page.includes("TikTokDetectIcon"));
    assert.ok(page.includes('v-if="supportsDetection(row)"'));
    assert.ok(page.includes("探测"));
  });

  it("uses the promotion channel create/query contract and maps every platform tracking id", () => {
    assert.ok(channelApi.includes("/api/promotion-channels/create"));
    assert.ok(channelApi.includes("/api/promotion-channels/query"));
    assert.ok(channelApi.includes("trackingId: payload.pixelId"));
    assert.ok(channelApi.includes("KUAISHOU: 3"));
    assert.ok(channelApi.includes("MGSKY: 4"));
    assert.ok(channelApi.includes("preselectedCountry"));
    assert.ok(channelApi.includes("creatorUserId"));
    assert.ok(channelApi.includes("ownerUserIds"));
  });

  it("offers all countries on first open and locks SPECIFIC to its dial code", () => {
    const countryField = drawerFormItem("目标国家");
    const dialCodeField = drawerFormItem("预选区号");
    assert.ok(drawer.includes("@iconify/vue/offline"));
    assert.ok(drawer.includes("@iconify/json/json/flagpack.json"));
    assert.ok(countryField.includes('v-for="country in options.countries"'));
    assert.ok(countryField.includes("countryFlagIcon(country.code)"));
    assert.ok(countryField.includes("country.dialCode"));
    assert.ok(countryField.includes("country-option"));
    assert.ok(countryField.includes("clearable"));
    assert.ok(
      countryField.includes('popper-class="buyer-country-select-popper"')
    );
    assert.ok(countryField.includes('#label="{ value }"'));
    assert.ok(countryField.includes("country-check"));
    assert.doesNotMatch(countryField, /\{\{\s*country\.flag/);
    assert.match(channelForm, /countryMode:\s*"SPECIFIC"/);
    assert.match(
      drawer,
      /targetCountry:\s*\[\s*\{[\s\S]*?required:\s*true[\s\S]*?validateTargetCountry/
    );
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

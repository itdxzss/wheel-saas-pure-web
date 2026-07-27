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
const drawerContract = `${drawer}\n${platformFields}\n${trackingFields}`;
const normalizedDrawer = drawerContract.replace(/\s+/g, " ");
const channelForm = readFileSync(
  new URL("./domain/channel-form.ts", import.meta.url),
  "utf8"
);
const countryFlag = readFileSync(
  new URL("./domain/channel-country-flag.ts", import.meta.url),
  "utf8"
);
const channelApi = readFileSync(
  new URL("../../../api/buyer-channel.ts", import.meta.url),
  "utf8"
);
const systemUserApi = readFileSync(
  new URL("../../../api/system-user.ts", import.meta.url),
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
      "tenant:buyer-channel:delete"
    ])
      assert.ok(page.includes(permission), permission);
    assert.match(page, /pageSize[^\n]*30|page_size[^\n]*30/);
    assert.ok(page.includes("[30, 60, 200, 500]"));
  });

  it("resets every filter before querying page one and refreshes from the backend", () => {
    assert.ok(page.includes("async function resetFilters(): Promise<void>"));
    for (const filter of [
      "targetCountry",
      "templateId",
      "creatorId",
      "parentUserId"
    ]) {
      assert.ok(page.includes(`filters.${filter} = undefined;`), filter);
    }
    assert.match(
      page,
      /async function resetFilters\(\): Promise<void> \{[\s\S]*?page\.value = 1;[\s\S]*?await refresh\(\);[\s\S]*?\}/
    );
    assert.ok(page.includes('@click="resetFilters">重置'));
    assert.ok(page.includes('<el-button @click="refresh">刷新</el-button>'));
    assert.match(
      page,
      /async function refresh\(\): Promise<void> \{[\s\S]*?listBuyerChannels\(/
    );
  });

  it("uses Element Plus and renders all required shared drawer fields", () => {
    assert.match(drawer, /el-drawer/);
    for (const text of [
      "渠道名称",
      "归属用户",
      "目标国家",
      "绑定模板",
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

    const domainField = drawerFormItem("访问域名");
    assert.match(domainField, /#prepend>http:\/\/<\/template>/);
    assert.doesNotMatch(domainField, /#prepend>https:\/\/<\/template>/);
    assert.ok(domainField.includes('href="https://www.dynadot.com/"'));

    for (const text of [
      "仅用于渠道分类标记，比如主要投印度就选「印度」，选完后下方预选区号会自动填充。",
      "域名需要解析后才可正常访问，请联系运营人员配置！",
      "同一个域名只能在同一个模板下创建多个渠道链接，跨模板请使用新域名~",
      "决定用户打开渠道链接后，手机号输入框默认显示的区号。",
      "Facebook 正式业务事件由后端 CAPI 异步上报",
      "用户点击广告后，可直接在"
    ])
      assert.ok(normalizedDrawer.includes(text), text);

    assert.ok(drawer.includes('type="textarea"'));
    assert.ok(drawer.includes("inline-prompt"));
    assert.doesNotMatch(drawer, /label="状态"|事件映射/);
  });

  it("uses backend users, templates and platform facts", () => {
    assert.ok(page.includes("options.uploadFee.label"));
    assert.ok(page.includes("options.uploadFee.value"));
    assert.ok(drawer.includes("混合（不限国家）"));
    assert.ok(drawer.includes("dialCodeOptions"));
    assert.ok(drawer.includes("previewPlatformOptions"));
    assert.ok(page.includes("listBuyerTemplateOptions"));
    assert.ok(page.includes("listSystemUserOptions"));
    assert.ok(page.includes("toBuyerChannelUserOptions"));
    assert.ok(page.includes("resolveBuyerChannelCreatorNames"));
    assert.ok(systemUserApi.includes('"/api/admin/users"'));
    assert.ok(drawer.includes("options.templates"));
    assert.ok(drawer.includes('v-for="owner in options.owners"'));
    assert.doesNotMatch(drawer, /previewTemplateOptions/);
    for (const platform of ["Facebook", "TikTok", "快手", "MGSKY Ads"])
      assert.ok(drawerContract.includes(platform), platform);
    assert.doesNotMatch(
      `${page}\n${drawer}\n${channelApi}`,
      /previewOwnerOptions|previewCreatorNames|testuser456|ForeverAditya/
    );
    assert.ok(drawer.includes("options.eventOptions"));
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

  it("loads the official event catalog and has no manual probe action", () => {
    assert.ok(page.includes("listFacebookStandardEvents"));
    assert.ok(page.includes("eventOptions:"));
    assert.ok(
      channelApi.includes("/api/promotion-channels/facebook-standard-events")
    );
    assert.equal(
      drawer.match(/v-for="event in options\.eventOptions"/g)?.length,
      3
    );
    for (const field of [
      "eventLead",
      "eventInitiateCheckout",
      "eventCompleteRegistration"
    ]) {
      assert.ok(drawer.includes(`prop="${field}"`), field);
    }
    assert.equal(
      drawer.match(/:disabled="options\.eventOptions\.length === 0"/g)?.length,
      3
    );
    assert.ok(drawer.includes("validateReportingEvent"));
    assert.ok(drawer.includes("请选择 Meta 官方标准事件"));
    assert.doesNotMatch(page, /supportsDetection|openDetect|runDetect|>探测</);
    assert.doesNotMatch(channelApi, /promotion-channels\/probe|testEventCode/);
  });

  it("renders country flags and the complete promotion and fission URLs", () => {
    assert.ok(page.includes("countryFlagIcon(row.targetCountryIso2)"));
    assert.ok(page.includes("countryFlagIcon(row.preselectedCountryIso2)"));
    assert.ok(page.includes('row[column.prop] || "-"'));
    assert.doesNotMatch(page, />打开链接<\/el-button>/);
    assert.doesNotMatch(page, /openLink\(/);
    assert.ok(page.includes("user-select: text"));
    assert.ok(page.includes("copyChannelLink"));
    assert.ok(page.includes("navigator.clipboard.writeText"));
    assert.ok(page.includes("链接已复制"));
    assert.ok(
      channelApi.includes("targetCountryIso2: value.targetCountryIso2")
    );
    assert.ok(
      channelApi.includes(
        "preselectedCountryIso2: value.preselectedCountryIso2"
      )
    );
  });

  it("uses the promotion channel CRUD contract and maps every platform tracking id", () => {
    assert.ok(channelApi.includes("/api/promotion-channels/create"));
    assert.ok(channelApi.includes("/api/promotion-channels/query"));
    assert.ok(channelApi.includes("/api/promotion-channels/detail/${id}"));
    assert.ok(channelApi.includes("/api/promotion-channels/update/${id}"));
    assert.ok(channelApi.includes("/api/promotion-channels/delete/${id}"));
    assert.ok(channelApi.includes("trackingId: payload.pixelId"));
    assert.ok(channelApi.includes("KUAISHOU: 3"));
    assert.ok(channelApi.includes("MGSKY: 4"));
    assert.ok(channelApi.includes("preselectedCountry"));
    assert.ok(channelApi.includes("creatorUserId"));
    assert.ok(channelApi.includes("ownerUserIds"));
  });

  it("refreshes the current page after saving and safely backs up after deleting the last row", () => {
    assert.ok(page.includes('@saved="handleSaved"'));
    assert.match(
      page,
      /async function handleSaved\(\): Promise<void> \{[\s\S]*?await refresh\(\);[\s\S]*?\}/
    );
    assert.match(
      page,
      /rows\.value\.length === 1 && page\.value > 1[\s\S]*?page\.value -= 1;[\s\S]*?await refresh\(\);/
    );
  });

  it("offers all countries on first open and locks SPECIFIC to its dial code", () => {
    const countryField = drawerFormItem("目标国家");
    const dialCodeField = drawerFormItem("预选区号");
    assert.ok(drawer.includes("@iconify/vue/offline"));
    assert.ok(countryFlag.includes("@iconify/json/json/flagpack.json"));
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

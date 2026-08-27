import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");
const intro = readFileSync(
  new URL("./components/DataPackageIntro.vue", import.meta.url),
  "utf8"
);
const searchCard = readFileSync(
  new URL("./components/DataPackageSearchCard.vue", import.meta.url),
  "utf8"
);
const identityCell = readFileSync(
  new URL("./components/DataPackageIdentityCell.vue", import.meta.url),
  "utf8"
);
const usageCell = readFileSync(
  new URL("./components/DataPackageUsageCell.vue", import.meta.url),
  "utf8"
);
const funnelCell = readFileSync(
  new URL("./components/DataPackageFunnelCell.vue", import.meta.url),
  "utf8"
);
const clickAnalysisDrawer = readFileSync(
  new URL("./components/ClickAnalysisDrawer.vue", import.meta.url),
  "utf8"
);
const composable = readFileSync(
  new URL("./composables/useDataPackagePage.ts", import.meta.url),
  "utf8"
);

describe("hyperlink data package index", () => {
  it("matches competitor filters, grouped columns, actions and server pagination", () => {
    const pageContract = `${source}\n${intro}\n${searchCard}`;
    for (const label of [
      "数据包说明",
      "每行一个手机号",
      "禁止上传",
      "名称",
      "创建时间",
      "全部",
      "今天",
      "昨天",
      "UV 占比",
      "主要国家",
      "数据包管理",
      "本页号码",
      "空包",
      "新建数据包",
      "批量导出号码",
      "批量导出点击记录",
      "超链点击分析",
      "导出 CSV",
      "导入",
      "导出",
      "重置失败",
      "更多"
    ]) {
      assert.match(pageContract, new RegExp(label));
    }
    for (const label of ["ID", "数据包", "号码使用", "投递漏斗", "创建时间"]) {
      assert.match(composable, new RegExp(label));
    }
    for (const label of ["查看号码", "重命名", "删除数据包"]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /v-model:current-page="page"/);
    assert.match(source, /v-model:page-size="pageSize"/);
    assert.match(source, /<el-empty description="暂无符合条件的数据包"/);
    assert.match(source, /v-if="errorMessage"/);
  });

  it("renders the competitor-style combined information cells", () => {
    assert.match(identityCell, /Database/);
    assert.match(identityCell, /package-name/);
    assert.match(identityCell, /primaryCountryIso2/);
    assert.match(identityCell, /暂无备注/);
    assert.match(usageCell, /usage-bar/);
    assert.match(usageCell, /未用/);
    assert.match(usageCell, /已使用/);
    assert.match(usageCell, /未开通 WS/);
    assert.match(funnelCell, /单钩/);
    assert.match(funnelCell, /双钩/);
    assert.match(funnelCell, /点击 UV/);
  });

  it("protects every operation with the frozen permission keys", () => {
    assert.match(source, /tenant:hyperlink_data:create/);
    assert.match(source, /tenant:hyperlink_data:view/);
    assert.match(source, /tenant:hyperlink_data:import/);
    assert.match(source, /tenant:hyperlink_data:export/);
    assert.match(source, /tenant:hyperlink_data:edit/);
    assert.match(source, /tenant:hyperlink_data:delete/);
  });

  it("does not introduce production mocks or direct request clients", () => {
    assert.doesNotMatch(source, /\bmock\b/i);
    assert.doesNotMatch(source, /axios|armadaRequest|@\/utils\/http/);
  });

  it("matches the competitor click export menu and detailed right drawer", () => {
    assert.match(source, /TXT（仅收件人手机号）/);
    assert.match(source, /CSV（含数据包名称等字段）/);
    assert.doesNotMatch(source, /导出 XLSX/);
    assert.match(source, /ClickAnalysisDrawer/);
    assert.doesNotMatch(source, /<el-dialog[\s\S]*title="超链点击分析"/);

    for (const label of [
      "按号码的点击表现挑出号码并导出",
      "一次最多看 90 天",
      "今天",
      "昨天",
      "近 7 天",
      "受众国家",
      "更多国家",
      "按国家分组",
      "从来不点的号码",
      "点击率高的号码",
      "收到几次都没点",
      "点击比例最低多少",
      "恢复默认",
      "成功发送去重号码",
      "导出号码"
    ]) {
      assert.match(clickAnalysisDrawer, new RegExp(label));
    }
    assert.match(clickAnalysisDrawer, /<el-drawer/);
    assert.match(clickAnalysisDrawer, /size="880px"/);
    assert.match(clickAnalysisDrawer, /defaultThresholds/);
    assert.match(clickAnalysisDrawer, /5, 10, 15, 20/);
  });
});

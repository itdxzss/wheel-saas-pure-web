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
});

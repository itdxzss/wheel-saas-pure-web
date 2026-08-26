import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiSource = readFileSync(
  new URL("../../../../api/group.ts", import.meta.url),
  "utf8"
);
const constantsSource = readFileSync(
  new URL("../constants.ts", import.meta.url),
  "utf8"
);
const tableSource = readFileSync(
  new URL("./GroupListTable.vue", import.meta.url),
  "utf8"
);
const pageSource = readFileSync(
  new URL("../index.vue", import.meta.url),
  "utf8"
);

test("group list renders one canonical classification and metadata columns", () => {
  const classificationBlock = tableSource.match(
    /<div class="group-type-tags">([\s\S]*?)<\/div>/
  )?.[1];

  assert.match(apiSource, /groupClassification: GroupClassification/);
  assert.match(constantsSource, /label: "邀请链接", prop: "inviteUrl"/);
  assert.match(constantsSource, /label: "创建信息", prop: "groupCreatedAt"/);
  assert.match(tableSource, /function classificationMeta/);
  assert.match(tableSource, /v-if="classificationMeta\(row as GroupListRow\)"/);
  assert.match(tableSource, /label: "历史群"/);
  assert.match(tableSource, /label: "上控后群"/);
  assert.ok(classificationBlock);
  assert.equal((classificationBlock.match(/<el-tag\b/g) ?? []).length, 1);
  assert.doesNotMatch(tableSource, /row\.isHistorical/);
  assert.doesNotMatch(tableSource, /row\.isPostControl/);
  assert.doesNotMatch(apiSource, /groupType\?:[^;]*BOTH/);
  assert.doesNotMatch(constantsSource, /BOTH|同时属于两类/);
  assert.match(tableSource, /row\.adminPhones/);
  assert.match(tableSource, /row\.availableAdmin/);
  assert.match(apiSource, /creatorContinentCode\?: string \| null/);
  assert.match(tableSource, /国家：/);
  assert.match(tableSource, /洲：/);
  assert.match(tableSource, /continentName\(row\.creatorContinentCode\)/);
  assert.doesNotMatch(tableSource, /州：/);
  assert.doesNotMatch(tableSource, /creatorPhoneRegion/);
  assert.match(tableSource, /formatGroupCreatedAt\(row\.groupCreatedAt\)/);
});

test("group list does not render an expandable detail row", () => {
  assert.doesNotMatch(tableSource, /type="expand"/);
  assert.doesNotMatch(tableSource, /class="group-detail"/);
});

test("group list exposes group folder toolbar and name tag", () => {
  assert.match(apiSource, /folderName\?: string \| null/);
  assert.match(tableSource, /管理群组分组/);
  assert.match(tableSource, /批量分组/);
  assert.match(tableSource, /emit\('manage-folders'\)/);
  assert.match(tableSource, /emit\('assign-folder'\)/);
  assert.match(tableSource, /row\.folderName \|\| "未分组"/);
  assert.match(tableSource, /新建普群/);
  assert.match(tableSource, /emit\('create-normal-group'\)/);
  assert.match(
    tableSource,
    /v-auth="\['tenant:normal_group:create', 'tenant:normal_group:view'\]"/
  );
});

test("group list keeps common-group creation and historical filters together", () => {
  assert.match(pageSource, /CommonGroupCreateFlow/);
  assert.match(
    pageSource,
    /@create-normal-group="commonGroupCreateFlow\?\.open\(\)"/
  );
  assert.match(pageSource, /HistoricalGroupFilterDrawer/);
  assert.match(pageSource, /@query="queryHistoricalFilter"/);
});

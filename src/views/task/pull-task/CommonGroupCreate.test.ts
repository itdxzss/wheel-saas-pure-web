import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8"
  );
}

const indexSource = source("./index.vue");
const flowSource = source(
  "./components/common-group/CommonGroupCreateFlow.vue"
);
const accountMemberSource = source(
  "./components/common-group/CommonGroupAccountMemberSections.vue"
);
const configurationSource = source(
  "./components/common-group/CommonGroupConfigurationSections.vue"
);
const formSource = source("./common-group/common-group-form.ts");
const composableSource = source("./composables/useCommonGroupCreate.ts");
const mockSource = source("../../../../mock/common-group-task.ts");

describe("common group creation flow", () => {
  it("places the common-group entry after the existing pull-task entry", () => {
    assert.match(
      indexSource,
      /新建拉群任务[\s\S]*commonGroupCreateFlow\?\.open\(\)[\s\S]*新建普群/
    );
    assert.match(indexSource, /CommonGroupCreateFlow/);
    assert.match(indexSource, /tenant:pull_task:create/);
  });

  it("keeps the unconfirmed member and speed options disabled", () => {
    assert.match(accountMemberSource, /value="CUSTOM" disabled>自定义号码/);
    assert.match(configurationSource, /value="FAST" disabled>快速/);
    assert.doesNotMatch(flowSource, /待确认/);
  });

  it("validates the required groups and numeric limits before confirmation", () => {
    assert.match(formSource, /请选择管理员分组/);
    assert.match(formSource, /请选择成员分组/);
    assert.match(formSource, /建群数量必须为 1 至 20 的整数/);
    assert.match(formSource, /开始编号必须为大于等于 1 的整数/);
    assert.match(composableSource, /validateCommonGroupForm\(form\)/);
    assert.match(composableSource, /confirmVisible\.value = true/);
  });

  it("loads current account groups and protects dirty-form closing", () => {
    assert.match(composableSource, /listAccountGroups/);
    assert.match(composableSource, /listGroupFolders/);
    assert.match(composableSource, /放弃未提交的修改/);
    assert.match(flowSource, /确认创建普群任务/);
    assert.match(flowSource, /@return-to-form="returnToForm"/);
  });

  it("keeps the temporary create route out of production", () => {
    assert.match(mockSource, /process\.env\.NODE_ENV === "production"/);
    assert.match(mockSource, /\/api\/common-group-tasks/);
  });
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const dialogUrl = new URL("./PullTaskGlobalSettingDialog.vue", import.meta.url);
const indexSource = readFileSync(
  fileURLToPath(new URL("../index.vue", import.meta.url)),
  "utf8"
);

describe("pull task global setting dialog", () => {
  it("renders the three confirmed integer fields and units", () => {
    assert.ok(existsSync(fileURLToPath(dialogUrl)));
    const source = readFileSync(fileURLToPath(dialogUrl), "utf8");

    for (const label of ["营销静默时间", "群组封控时间", "单群营销账号上限"]) {
      assert.match(source, new RegExp('label="' + label + '"'));
    }
    assert.match(source, /el-input-number/);
    assert.match(source, />分钟</);
    assert.match(source, />个</);
    assert.match(source, /emit\(["']cancel["']\)/);
    assert.match(source, /emit\(["']save["']\)/);
    assert.match(source, /update:form/);
  });

  it("mounts one permission-guarded list-page entry", () => {
    assert.match(indexSource, />\s*全局设置\s*</);
    assert.match(indexSource, /tenant:pull_task:settings/);
    assert.match(indexSource, /<PullTaskGlobalSettingDialog/);
    assert.equal(
      (indexSource.match(/<PullTaskGlobalSettingDialog/g) ?? []).length,
      1
    );
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMarketingCreateDrawer.vue", import.meta.url),
  "utf8"
);
const pageSource = readFileSync(
  new URL("../composables/useGroupMarketingTaskPage.ts", import.meta.url),
  "utf8"
);

describe("group marketing create drawer", () => {
  it("keeps marketing template required without task-level text content", () => {
    assert.match(source, /<el-form-item label="营销模板" required>/);
    assert.doesNotMatch(source, /label="文本内容"/);
    assert.doesNotMatch(source, /请输入文本消息内容，仅支持文字内容/);
  });

  it("tracks account and group checkbox intent without adding a target mode control", () => {
    assert.match(source, /@check="onTreeCheck"/);
    assert.match(source, /buildMarketingSelections/);
    assert.doesNotMatch(source, /targetScope/);
    assert.doesNotMatch(source, /目标范围/);
  });

  it("disables tree nodes when realtime group loading failed for the account", () => {
    assert.match(
      source,
      /account\.status !== "ONLINE" \|\| account\.groupsError === true/
    );
    assert.match(
      source,
      /disabled: account\.status !== "ONLINE" \|\| account\.groupsError === true/
    );
  });

  it("loads account groups lazily when an account node is expanded", () => {
    assert.match(source, /lazy/);
    assert.match(source, /:load="loadTreeNode"/);
    assert.match(source, /loadAccountGroups\(parsed\.accountId\)/);
    assert.doesNotMatch(source, /default-expand-all/);
  });

  it("keeps lazy loaded groups out of the root account tree data", () => {
    const match = pageSource.match(
      /async function loadAccountGroups[\s\S]*?\n  }\n\n  function searchTasks/
    );
    assert.ok(match, "loadAccountGroups should stay easy to review");
    assert.match(match[0], /loadedGroupAccounts/);
    assert.doesNotMatch(match[0], /treeAccounts\.value = treeAccounts\.value\.map/);
  });

  it("does not reset checked accounts when only lazy group data changes", () => {
    assert.match(source, /accountListSignature/);
    assert.match(source, /loadedAccountsById/);
    assert.doesNotMatch(source, /\{\s*deep:\s*true\s*\}/);
  });
});

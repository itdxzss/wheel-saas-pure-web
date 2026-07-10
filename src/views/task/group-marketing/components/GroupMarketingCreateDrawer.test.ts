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

  it("shows Chinese account status and current group count in tree labels", () => {
    assert.match(
      source,
      /accountStatusText\(account\).*accountGroupCount\(account\).*个群/s
    );
    assert.doesNotMatch(
      source,
      /label: `\$\{account\.wsPhone\} · \$\{account\.status\}`/
    );
  });

  it("normalizes backend status codes before rendering status text", () => {
    assert.match(source, /function statusTextFromCode/);
    assert.match(source, /case "ONLINE":\s*return "在线";/);
    assert.match(source, /return statusTextFromCode\(text\) \?\? text/);
  });

  it("disables tree nodes when the backend marks the account unavailable", () => {
    assert.match(source, /function accountSelectable/);
    assert.match(source, /disabled: !accountSelectable\(account\)/);
  });

  it("loads account groups lazily when an account node is expanded", () => {
    assert.match(source, /lazy/);
    assert.match(source, /:load="loadTreeNode"/);
    assert.match(source, /loadAccountGroups\(parsed\.accountId\)/);
    assert.doesNotMatch(source, /default-expand-all/);
  });

  it("uses lifecycle time fields instead of the old start mode selector", () => {
    assert.match(source, /label="账号群组发送时间"/);
    assert.match(source, /label="任务开始时间" required/);
    assert.match(source, /label="任务结束时间" required/);
    assert.match(source, /:disabled-date="disableAccountGroupSendDate"/);
    assert.doesNotMatch(source, /label="发送状态"/);
  });

  it("keeps lazy loaded groups out of the root account tree data", () => {
    const match = pageSource.match(
      /async function loadAccountGroups[\s\S]*?\n  }\n\n  function searchTasks/
    );
    assert.ok(match, "loadAccountGroups should stay easy to review");
    assert.match(match[0], /loadedGroupAccounts/);
    assert.doesNotMatch(
      match[0],
      /treeAccounts\.value = treeAccounts\.value\.map/
    );
  });

  it("does not reset checked accounts when only lazy group data changes", () => {
    assert.match(source, /accountListSignature/);
    assert.match(source, /loadedAccountsById/);
    assert.doesNotMatch(source, /\{\s*deep:\s*true\s*\}/);
  });
});

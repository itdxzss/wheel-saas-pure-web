import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupPullMarketingCreateDrawer.vue", import.meta.url),
  "utf8"
);

describe("group pull marketing create drawer", () => {
  it("uses one TXT or CSV file and only the confirmed group settings", () => {
    assert.match(source, /accept="\.txt,\.csv"/);
    assert.match(source, /基础设置/);
    assert.match(source, /群信息设置/);
    assert.match(source, /群组发言权限/);
    assert.match(source, /建群账号退出群组/);
    assert.match(source, /maxlength="100"/);
    assert.doesNotMatch(source, /群头像|群描述|群公告|邀请链接权限/);
  });

  it("saves without starting the task", () => {
    assert.match(source, />\s*保存\s*</);
    assert.doesNotMatch(source, /保存并启动|保存草稿/);
    assert.match(source, /emit\(["']submit["']\)/);
  });
});

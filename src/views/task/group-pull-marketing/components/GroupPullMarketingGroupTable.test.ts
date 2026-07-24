import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupPullMarketingGroupTable.vue", import.meta.url),
  "utf8"
);

describe("group pull marketing group table", () => {
  it("keeps failed executions and all confirmed detail columns", () => {
    for (const label of [
      "序号",
      "建群账号",
      "营销账号",
      "群名称",
      "群链接",
      "群状态",
      "进群人数",
      "群人数",
      "营销号发送条数",
      "发言权限",
      "建群账号退出配置",
      "退群状态",
      "管理员状态",
      "建群执行结果",
      "失败阶段",
      "失败原因",
      "营销发送状态",
      "最后发送时间"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /row\.groupMemberCount == null \? "-"/);
  });

  it("opens only safe links and offers copy for available links", () => {
    assert.match(source, /target="_blank"/);
    assert.match(source, /rel="noopener noreferrer"/);
    assert.match(source, /copyGroupLink/);
    assert.match(source, /linkMeta\(row\)\.available/);
  });
});

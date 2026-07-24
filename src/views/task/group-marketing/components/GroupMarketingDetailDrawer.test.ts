import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMarketingDetailDrawer.vue", import.meta.url),
  "utf8"
);

function groupTableSource(): string {
  const groupTable = source.match(
    /<el-table\s+class="group-rollup-table"[\s\S]*?<\/el-table>/
  );
  assert.ok(groupTable, "group detail should use an Element Plus table");
  return groupTable[0];
}

describe("group marketing detail drawer", () => {
  it("renders the exact account and group detail fields in order", () => {
    assert.match(
      source,
      /label="在线状态"[\s\S]*label="发送账号"[\s\S]*label="账号发送总条数"[\s\S]*label="账号失败条数"[\s\S]*label="账号跳过条数"[\s\S]*label="明细"/
    );
    assert.match(
      groupTableSource(),
      /label="当前关系"[\s\S]*label="最后协议状态"[\s\S]*label="群名称"[\s\S]*label="群 GID"[\s\S]*label="成功"[\s\S]*label="失败"[\s\S]*label="跳过"[\s\S]*label="最后发送时间"[\s\S]*label="最后执行"/
    );
    assert.doesNotMatch(source, />群组链接</);
    assert.doesNotMatch(source, />最近原因</);
    assert.doesNotMatch(source, />发言号码</);
  });

  it("uses resizable Element Plus columns without fixing the last columns", () => {
    const groupTable = groupTableSource();
    assert.match(groupTable, /:data="asAccountRow\(row\)\.groups"/);
    assert.match(groupTable, /<el-table-column[\s\S]*?resizable/);
    assert.doesNotMatch(groupTable, /\sfixed(?:=|\s|>)/);
    assert.doesNotMatch(source, /group-rollup-header|group-rollup-detail-row/);
    assert.doesNotMatch(source, /min-width:\s*1280px/);
  });

  it("renders membership, protocol status, execution result and skipped counts separately", () => {
    assert.match(source, /label="跳过条数"/);
    assert.match(
      source,
      /groupMembershipStatusMeta\(group\.membershipStatus\)/
    );
    assert.match(source, /groupSendStatusMeta\(group\.groupStatus\)/);
    assert.match(source, /groupExecutionResultMeta\(group\.executionResult\)/);
    assert.match(source, /group\.skippedMessageCount \?\? 0/);
    assert.match(source, /row\.skippedMessageCount \?\? 0/);
  });

  it("uses live login state and renders failed or skipped reason inside execution", () => {
    assert.match(source, /loginStateLabel/);
    assert.match(source, /loginStateTagType/);
    assert.match(source, /row\.loginState/);
    assert.match(source, /group\.executionReason/);
    assert.match(source, /\[['"]FAILED['"], ['"]SKIPPED['"]\]\.includes/);
    assert.match(source, /group\.executionReason \|\| "未知原因"/);
  });

  it("keeps empty groups and nullable fields safe", () => {
    assert.match(source, /暂无发送记录/);
    assert.match(
      source,
      /group\.groupName \|\| group\.groupJid \|\| "未命名群组"/
    );
    assert.match(source, /group\.groupJid \|\| "-"/);
    assert.match(source, /formatEpoch\(group\.lastSentAt\)/);
  });

  it("renames summary sent count and removes summary last sent time", () => {
    const descriptions = source.match(
      /<el-descriptions[\s\S]*?<\/el-descriptions>/
    );
    assert.ok(descriptions, "summary descriptions should exist");
    assert.match(descriptions[0], /label="总发送条数"/);
    assert.doesNotMatch(descriptions[0], /label="最后发送时间"/);
  });
});

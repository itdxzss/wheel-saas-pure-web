import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupPullMarketingTaskTable.vue", import.meta.url),
  "utf8"
);

describe("group pull marketing task table", () => {
  it("renders the confirmed task statistics and three status dimensions", () => {
    for (const label of [
      "任务ID",
      "任务名称",
      "任务状态",
      "数据",
      "建群数量",
      "失败数量",
      "营销号",
      "创建时间",
      "结束时间",
      "操作"
    ]) {
      assert.match(source, new RegExp(label));
    }
    assert.match(source, /taskStatusLabel/);
    assert.match(source, /blockReasonLabel/);
    assert.match(source, /resourceStatusLabel/);
    assert.match(source, /marketingAccountTotalCount == null/);
  });

  it("uses the centralized action matrix instead of duplicating status checks", () => {
    assert.match(source, /groupPullTaskActions/);
    assert.match(source, /v-for="action in taskActions\(row\)"/);
    assert.match(source, /:key="action"/);
  });
});

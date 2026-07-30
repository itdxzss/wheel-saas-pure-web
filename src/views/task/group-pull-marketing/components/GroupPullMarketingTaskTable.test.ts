import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupPullMarketingTaskTable.vue", import.meta.url),
  "utf8"
);

describe("group pull marketing task table", () => {
  it("renders exactly the nine merged prototype columns", () => {
    const labels = [
      "任务信息",
      "任务状态",
      "群组处理进度",
      "拉人结果",
      "营销进度",
      "消息发送",
      "异常情况",
      "剩余资源",
      "时间/操作"
    ];
    let previousIndex = -1;
    for (const label of labels) {
      const index = source.indexOf(`label="${label}"`);
      assert.ok(
        index > previousIndex,
        `${label} should follow prototype order`
      );
      previousIndex = index;
    }
    for (const legacyLabel of [
      "任务ID",
      "任务名称",
      "数据",
      "建群数量",
      "失败数量",
      "营销号",
      "创建时间",
      "结束时间"
    ]) {
      assert.doesNotMatch(source, new RegExp(`label="${legacyLabel}"`));
    }
    assert.match(source, /fixed="left"/);
    assert.match(source, /fixed="right"/);
    assert.match(source, /<el-progress/);
    assert.match(source, /<el-tooltip/);
    assert.match(source, /displayMetric/);
    assert.match(source, /displayRate/);
    assert.match(source, /resourceShortageLabel/);
    assert.match(source, /有效成功率按本次新增成功入群人数 ÷ 有效目标数据计算/);
    assert.match(source, /需要补充或替换资源的群组数/);
  });

  it("uses the centralized action matrix instead of duplicating status checks", () => {
    assert.match(source, /groupPullTaskActions/);
    assert.match(source, /v-for="action in taskActions\(row\)"/);
    assert.match(source, /:key="action"/);
  });
});

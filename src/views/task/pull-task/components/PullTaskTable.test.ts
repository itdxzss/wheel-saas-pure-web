import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const componentUrl = new URL("./PullTaskTable.vue", import.meta.url);

describe("pull task unified table", () => {
  it("renders exactly the nine confirmed columns", () => {
    assert.ok(existsSync(fileURLToPath(componentUrl)));
    const source = readFileSync(fileURLToPath(componentUrl), "utf8");
    const labels = [
      ...source.matchAll(/<el-table-column[\s\S]*?label="([^"]+)"/g)
    ]
      .map(match => match[1])
      .filter(label => label !== undefined);

    assert.deepEqual(labels, [
      "任务信息",
      "任务状态",
      "群组处理进度",
      "拉人结果",
      "营销进度",
      "消息发送",
      "异常情况",
      "剩余资源",
      "时间/操作"
    ]);
  });

  it("uses tooltips and keeps confirmed unknown and status semantics", () => {
    assert.ok(existsSync(fileURLToPath(componentUrl)));
    const source = readFileSync(fileURLToPath(componentUrl), "utf8");

    assert.ok((source.match(/<el-tooltip/g) ?? []).length >= 3);
    assert.match(source, /row\.groupProgress/);
    assert.match(source, /row\.pullResult/);
    assert.match(source, /row\.marketingProgress/);
    assert.match(
      source,
      /shouldShowUnknownMessage\(row\.messageStats\?\.unknownCount\)/
    );
    assert.match(source, /row\.blockingReason\s*\|\|\s*row\.primaryStage/);
    assert.match(source, /row\.allowedActions/);
    assert.doesNotMatch(source, /row\.createdAt/);
  });
});

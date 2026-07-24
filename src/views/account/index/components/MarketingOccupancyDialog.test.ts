import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(new URL("./MarketingOccupancyDialog.vue", import.meta.url)),
  "utf8"
);
const composableSource = readFileSync(
  fileURLToPath(
    new URL("../composables/useAccountListPage.ts", import.meta.url)
  ),
  "utf8"
);

describe("MarketingOccupancyDialog", () => {
  it("shows the confirmed task and account usage facts", () => {
    assert.match(source, /当前空闲/);
    assert.match(source, /v-if="detail && !detail\.taskId"/);
    for (const label of [
      "营销任务类型",
      "任务ID",
      "任务名称",
      "当前任务状态",
      "分组锁定状态",
      "锁定时间",
      "营销账号总数量",
      "实际调用营销账号数量"
    ]) {
      assert.match(source, new RegExp(label));
    }
  });

  it("loads details on click and caches them only for the current list view", () => {
    assert.match(composableSource, /getAccountGroupMarketingOccupancy/);
    assert.match(composableSource, /createMarketingOccupancyDetailSession/);
    assert.match(composableSource, /marketingOccupancySession\.invalidate\(\)/);
    assert.match(composableSource, /marketingOccupancyRequestVersion/);
  });

  it("renders task navigation only for integrated business types", () => {
    assert.match(source, /function canOpenTask/);
    assert.match(source, /detail\.taskBusinessType === 1/);
    assert.match(source, /detail\.taskBusinessType === 2/);
    assert.match(source, /v-if="canOpenTask\(detail\)"/);
  });
});

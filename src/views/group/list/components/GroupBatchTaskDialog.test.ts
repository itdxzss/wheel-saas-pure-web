import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const apiSource = readFileSync(
  new URL("../../../../api/group.ts", import.meta.url),
  "utf8"
);
const dialogSource = readFileSync(
  new URL("./GroupBatchTaskDialog.vue", import.meta.url),
  "utf8"
);

describe("GroupBatchTaskDialog", () => {
  it("shows Kafka in-flight item states as sending instead of canceled", () => {
    assert.match(apiSource, /\| "DISPATCHED"/);
    assert.match(apiSource, /\| "WAITING_RESULT"/);
    assert.match(dialogSource, /DISPATCHED: "发送中"/);
    assert.match(dialogSource, /WAITING_RESULT: "发送中"/);
    assert.match(dialogSource, /CANCELED: "已取消"/);
    assert.doesNotMatch(
      dialogSource,
      /status === "FAILED" \? "失败" : "已取消"/
    );
  });
});

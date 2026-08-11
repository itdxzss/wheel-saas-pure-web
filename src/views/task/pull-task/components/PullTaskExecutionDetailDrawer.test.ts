import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(
    new URL("./PullTaskExecutionDetailDrawer.vue", import.meta.url)
  ),
  "utf8"
);

describe("normal-link execution detail drawer", () => {
  it("renders all real read-model facts without legacy marketing actions", () => {
    for (const fact of [
      "detail.execution",
      "detail.roles",
      "detail.actions",
      "detail.calls",
      "members"
    ]) {
      assert.match(source, new RegExp(fact.replace(".", "\\.")));
    }
    assert.match(source, /账号资源/);
    assert.match(source, /执行动作/);
    assert.match(source, /拉人调用/);
    assert.match(source, /逐成员结果/);
    assert.match(source, /提权结果/);
    assert.match(source, /label="群 JID"/);
    assert.match(source, /label="账号"/);
    assert.match(source, /label="拉手账号"/);
    assert.match(source, /label="站台账号"/);
    assert.match(
      source,
      /pullerAccountLabel\(detail\.roles, row\.pullerAccountId\)/
    );
    assert.match(source, /stationAccountLabel\(detail\.roles, row\.callId\)/);
    assert.match(source, /label="号码"/);
    assert.doesNotMatch(source, /（脱敏）/);
    assert.doesNotMatch(source, /重新执行|重试|营销/);
  });
});

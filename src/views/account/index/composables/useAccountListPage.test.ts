import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(new URL("./useAccountListPage.ts", import.meta.url)),
  "utf8"
);

describe("account list applied filter readiness", () => {
  it("commits the initial form only after a successful load and guards batch actions before then", () => {
    assert.match(source, /const queryState = createAccountQueryState\(\);/);
    assert.match(source, /if \(appliedFilters === null\)/);
    assert.match(source, /loadAccountList\(initialRequest, 1, true\)/);
    assert.match(source, /if \(!queryState\.hasApplied\(\)/);
    assert.match(source, /账号列表尚未加载成功，请先查询后再执行批量操作/);
  });

  it("starts a page-local 30 second online batch cooldown before dispatch", () => {
    assert.match(source, /const BATCH_ONLINE_COOLDOWN_MS = 30_000;/);
    assert.match(source, /const batchOnlineCooldownUntil = ref\(0\);/);
    assert.match(source, /const batchOnlineCooldownRemaining = computed/);
    assert.match(
      source,
      /batchOnlineCooldownUntil\.value =\s*Date\.now\(\) \+ BATCH_ONLINE_COOLDOWN_MS/
    );
    assert.match(source, /let onlineRequestDispatched = false;/);
    assert.match(
      source,
      /onlineRequestDispatched &&\s*isRequestTimeout\(error\)/
    );
    assert.doesNotMatch(source, /batch-online-cooldown.*localStorage/i);
  });

  it("maps idempotent single-online results without reporting protocol failure", () => {
    assert.match(source, /result\.stateSource === "ALREADY_PENDING"/);
    assert.match(source, /result\.stateSource === "ALREADY_ONLINE"/);
    assert.match(source, /正在上线，请稍后/);
    assert.match(source, /账号已在线/);
  });
});

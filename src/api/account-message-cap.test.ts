import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./account-message-cap.ts", import.meta.url),
  "utf8"
);

describe("account message cap api", () => {
  it("posts selected ids to the batch query endpoint and nothing else", () => {
    assert.match(source, /armadaRequest<MessageCapBatch>/);
    assert.match(source, /"post",\s*"\/api\/accounts\/message-cap\/query"/);
    assert.match(source, /data:\s*\{\s*ids,\s*debug\s*\}/);
  });

  it("keeps quotas as strings so large and sentinel values survive", () => {
    assert.match(source, /totalQuota: string \| null/);
    assert.doesNotMatch(source, /totalQuota: number/);
  });
});

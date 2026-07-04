import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("marketing template index", () => {
  it("uses message type wording in search and table", () => {
    assert.match(source, /label="消息类型"/);
    assert.match(source, /label="消息类型"/);
    assert.doesNotMatch(source, /label="文本类型"/);
  });
});

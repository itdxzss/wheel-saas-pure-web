import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("login page", () => {
  it("does not prefill a fixed username", () => {
    assert.match(page, /username:\s*""/);
    assert.doesNotMatch(page, /username:\s*["']admin["']/i);
  });
});

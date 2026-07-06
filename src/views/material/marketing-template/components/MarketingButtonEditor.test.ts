import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./MarketingButtonEditor.vue", import.meta.url),
  "utf8"
);

describe("marketing button editor", () => {
  it("keeps at least one button during normal editing", () => {
    assert.match(source, /buttons\.length <= 1/);
    assert.match(source, /按钮超链至少需要 1 个按钮/);
  });
});

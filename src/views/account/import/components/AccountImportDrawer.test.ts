import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./AccountImportDrawer.vue", import.meta.url),
  "utf8"
);

describe("account import drawer template", () => {
  it("defaults to the enabled JSON import kind", () => {
    assert.match(source, /importKind:\s*"json"\s+as AccountImportKind/);
    assert.match(source, /form\.importKind\s*=\s*"json";/);
  });
});

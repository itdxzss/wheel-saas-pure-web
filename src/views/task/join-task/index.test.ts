import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("join task page layout", () => {
  it("allows the table section to shrink inside the pure-admin content area", () => {
    assert.match(
      source,
      /\.join-task-page\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\);/
    );
    assert.match(
      source,
      /\.join-task-page\s*>\s*\*\s*\{[\s\S]*min-width:\s*0;/
    );
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./useAccountImportPage.ts", import.meta.url),
  "utf8"
);

describe("account import submit routing", () => {
  it("uploads JSON and selected full params files through multipart", () => {
    assert.match(source, /payload\.importKind === "json" \|\| payload\.file/);
    assert.match(source, /await uploadAccountImportFile\(\{/);
  });

  it("keeps pasted full params on the text import path", () => {
    assert.match(source, /await createAccountImportTask\(\{/);
    assert.match(source, /text:\s*payload\.text \?\? ""/);
  });
});

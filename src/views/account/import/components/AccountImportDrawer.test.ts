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

  it("requires an explicit declared account type", () => {
    assert.match(source, /accountType:\s*""/);
    assert.match(source, /form\.accountType\s*=\s*"";/);
    assert.match(source, /请选择申报账号类型/);
  });

  it("labels the compatible text area as five/six content", () => {
    assert.match(
      source,
      /form\.importKind === 'six' \? '五\/六段号内容' : '全参账号内容'/
    );
  });

  it("forwards a selected full params TXT file to preserve its filename", () => {
    assert.match(
      source,
      /file:\s*form\.importKind === "six" \? null : form\.file/
    );
  });
});

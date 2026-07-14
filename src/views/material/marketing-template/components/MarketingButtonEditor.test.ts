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

  it("adds quick reply buttons while keeping the three-button limit", () => {
    assert.match(source, /const defaults = buttonDefaults\.quick/);
    assert.match(source, /if \(buttons\.value\.length >= 3\) return/);
    assert.match(source, /buttons\.length >= 3/);
  });

  it("uses Element Plus validation for each link value", () => {
    assert.match(source, /validateMarketingButtonLink/);
    assert.match(source, /type FormItemRule/);
    assert.match(source, /:prop="`buttons\.\$\{index\}\.value`"/);
    assert.match(source, /:rules="linkValueRules"/);
    assert.match(source, /trigger: \["blur", "change"\]/);
  });

  it("does not restore a default URL when a button becomes a link", () => {
    assert.match(source, /link: \{ label: "立即抢购", value: "" \}/);
    assert.match(
      source,
      /button\.type === "link" \|\| button\.type === "quick"/
    );
  });
});

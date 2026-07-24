import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node 24 requires an explicit extension for direct TS tests.
import { resolveBuyerTemplatePreviewKind } from "./buyer-template-preview.ts";

describe("buyer template preview resolver", () => {
  it("resolves the two completed template homepages", () => {
    assert.equal(resolveBuyerTemplatePreviewKind("base_sex2"), "date-v2");
    assert.equal(resolveBuyerTemplatePreviewKind("basic_earn"), "basic-earn");
  });

  it("normalizes template codes and rejects unfinished templates", () => {
    assert.equal(resolveBuyerTemplatePreviewKind(" BASE_SEX2 "), "date-v2");
    assert.equal(resolveBuyerTemplatePreviewKind("basic_party_man"), undefined);
    assert.equal(resolveBuyerTemplatePreviewKind(undefined), undefined);
  });
});

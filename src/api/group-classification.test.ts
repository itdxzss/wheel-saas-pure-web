import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeGroupClassificationRow,
  resolveGroupClassification
} from "./group-classification";

describe("group classification API compatibility", () => {
  it("prefers every valid canonical value over the legacy projection", () => {
    assert.equal(
      resolveGroupClassification({
        groupClassification: "HISTORICAL",
        isHistorical: false,
        isPostControl: true
      }),
      "HISTORICAL"
    );
    assert.equal(
      resolveGroupClassification({
        groupClassification: "POST_CONTROL",
        isHistorical: true,
        isPostControl: false
      }),
      "POST_CONTROL"
    );
    assert.equal(
      resolveGroupClassification({
        groupClassification: "UNCLASSIFIED",
        isHistorical: true,
        isPostControl: false
      }),
      "UNCLASSIFIED"
    );
  });

  it("accepts only one true legacy flag when the canonical value is absent", () => {
    assert.equal(
      resolveGroupClassification({
        isHistorical: true,
        isPostControl: false
      }),
      "HISTORICAL"
    );
    assert.equal(
      resolveGroupClassification({
        isHistorical: false,
        isPostControl: true
      }),
      "POST_CONTROL"
    );
  });

  it("does not guess when legacy flags are both true or both false", () => {
    assert.equal(
      resolveGroupClassification({
        isHistorical: true,
        isPostControl: true
      }),
      "UNCLASSIFIED"
    );
    assert.equal(
      resolveGroupClassification({
        isHistorical: false,
        isPostControl: false
      }),
      "UNCLASSIFIED"
    );
  });

  it("fails closed instead of masking an invalid canonical value", () => {
    assert.equal(
      resolveGroupClassification({
        groupClassification: "BROKEN",
        isHistorical: true,
        isPostControl: false
      }),
      "UNCLASSIFIED"
    );
  });

  it("removes legacy fields before exposing a list row to the UI", () => {
    assert.deepEqual(
      normalizeGroupClassificationRow({
        id: 42,
        groupClassification: null,
        isHistorical: true,
        isPostControl: false
      }),
      { id: 42, groupClassification: "HISTORICAL" }
    );
  });
});

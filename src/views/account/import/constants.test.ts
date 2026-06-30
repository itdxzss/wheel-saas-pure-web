import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detailStatusOptions, exportOptions } from "./constants";

describe("account import constants", () => {
  it("keeps abnormal as a detail filter but not as an export option", () => {
    const detailStatusValues: string[] = detailStatusOptions.map(
      option => option.value
    );
    const exportValues: string[] = exportOptions.map(option => option.value);

    assert.ok(
      detailStatusValues.includes("ABNORMAL"),
      "detail filter should keep abnormal"
    );
    assert.equal(exportValues.includes("ABNORMAL"), false);
  });
});

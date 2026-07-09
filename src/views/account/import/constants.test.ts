import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountImportIpAllocationModeOptions,
  detailStatusOptions,
  exportOptions,
  importKindOptions
} from "./constants";

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

  it("only disables account import kinds that are still unsupported", () => {
    const disabledKinds = importKindOptions
      .filter(option => option.disabled)
      .map(option => option.value);

    assert.deepEqual(disabledKinds, ["fullparam"]);
  });

  it("uses smart and mixed IP allocation modes for account import", () => {
    assert.deepEqual(
      accountImportIpAllocationModeOptions.map(option => option.value),
      ["smart", "mixed"]
    );
    assert.deepEqual(
      accountImportIpAllocationModeOptions.map(option => option.label),
      ["智能分配", "混合国家"]
    );
  });
});

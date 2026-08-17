import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountImportIpAllocationModeOptions,
  detailStatusOptions,
  exportOptions,
  importKindLabelMap,
  importKindOptions,
  importTypeOptions
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

  it("enables full params import and explains the Android conversion", () => {
    const disabledKinds = importKindOptions
      .filter(option => option.disabled)
      .map(option => option.value);
    const fullParams = importKindOptions.find(
      option => option.value === "fullparam"
    );

    assert.deepEqual(disabledKinds, []);
    assert.match(fullParams?.desc ?? "", /一行一个 JSON 对象/);
    assert.match(fullParams?.desc ?? "", /Android/);
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

  it("labels the existing six kind as five/six compatible", () => {
    const option = importKindOptions.find(item => item.value === "six");

    assert.equal(importKindLabelMap.six, "五/六段号");
    assert.equal(option?.label, "五/六段号");
    assert.match(option?.desc ?? "", /五段号或六段号/);
    assert.ok(
      importTypeOptions.some(
        item => item.label === "五/六段号" && item.value === "五/六段号"
      )
    );
  });
});

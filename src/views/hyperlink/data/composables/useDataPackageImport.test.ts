import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DATA_PACKAGE_IMPORT_MAX_ROWS,
  dataPackageImportModeLabel,
  inspectDataPackageTxt
} from "./useDataPackageImport";

describe("data package TXT inspection", () => {
  it("allows UTF-8 BOM and counts only non-empty rows", async () => {
    const file = new File(
      ["\uFEFF639123456789\n\n  628123456789  \r\n"],
      "phones.txt",
      { type: "text/plain" }
    );

    assert.deepEqual(await inspectDataPackageTxt(file), {
      filename: "phones.txt",
      nonEmptyRowCount: 2
    });
  });

  it("rejects non-TXT, empty and oversized imports before submission", async () => {
    await assert.rejects(
      inspectDataPackageTxt(new File(["639123456789"], "phones.csv")),
      /仅支持 UTF-8 编码的 \.txt 文件/
    );
    await assert.rejects(
      inspectDataPackageTxt(new File([], "phones.txt")),
      /TXT 文件不能为空/
    );
    const rows = Array.from(
      { length: DATA_PACKAGE_IMPORT_MAX_ROWS + 1 },
      (_, index) => String(600000 + index)
    ).join("\n");
    await assert.rejects(
      inspectDataPackageTxt(new File([rows], "phones.txt")),
      /单次最多导入 5000 条/
    );
  });

  it("keeps the two fixed import mode labels", () => {
    assert.equal(dataPackageImportModeLabel("APPEND"), "追加导入");
    assert.equal(dataPackageImportModeLabel("OVERWRITE"), "覆盖导入");
  });
});

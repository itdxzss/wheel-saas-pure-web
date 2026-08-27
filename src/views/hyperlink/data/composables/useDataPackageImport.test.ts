import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DATA_PACKAGE_IMPORT_MAX_ROWS,
  dataPackageImportModeLabel,
  inspectDataPackageTxt
} from "./useDataPackageImport";

describe("data package TXT inspection", () => {
  it("parses, deduplicates and classifies forbidden-country phones", async () => {
    const file = new File(
      [
        "\uFEFF66812345678\n\n 66812345678 \n+66812345678\n60123456789\n65987654321\n"
      ],
      "phones.txt",
      { type: "text/plain" }
    );

    assert.deepEqual(await inspectDataPackageTxt(file), {
      filename: "phones.txt",
      nonEmptyRowCount: 5,
      validPhoneCount: 3,
      invalidRowCount: 1,
      duplicatedRowCount: 1,
      forbiddenCountries: [
        { count: 1, label: "马来西亚", prefix: "60" },
        { count: 1, label: "新加坡", prefix: "65" }
      ]
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
      /单次最多导入 100,000 条/
    );
  });

  it("accepts exactly one hundred thousand non-empty rows", async () => {
    const rows = "66812345678\n".repeat(DATA_PACKAGE_IMPORT_MAX_ROWS);

    const result = await inspectDataPackageTxt(new File([rows], "phones.txt"));

    assert.equal(DATA_PACKAGE_IMPORT_MAX_ROWS, 100_000);
    assert.equal(result.nonEmptyRowCount, 100_000);
  });

  it("keeps the two fixed import mode labels", () => {
    assert.equal(dataPackageImportModeLabel("APPEND"), "追加导入");
    assert.equal(dataPackageImportModeLabel("OVERWRITE"), "覆盖导入");
  });
});

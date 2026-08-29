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
        "\uFEFF66812345678\n\n66812345678\n+66812345678\n60123456789\n65987654321\n"
      ],
      "phones.txt",
      { type: "text/plain" }
    );

    assert.deepEqual(await inspectDataPackageTxt(file), {
      brazilRisk: null,
      exceedsMaxRows: false,
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

  it("rejects non-TXT and empty imports before submission", async () => {
    await assert.rejects(
      inspectDataPackageTxt(new File(["639123456789"], "phones.csv")),
      /仅支持 UTF-8 编码的 \.txt 文件/
    );
    await assert.rejects(
      inspectDataPackageTxt(new File([], "phones.txt")),
      /TXT 文件不能为空/
    );
  });

  it("keeps the complete inspection when the file exceeds the row limit", async () => {
    const rows = "66812345678\n".repeat(DATA_PACKAGE_IMPORT_MAX_ROWS + 1);

    const result = await inspectDataPackageTxt(new File([rows], "phones.txt"));

    assert.equal(DATA_PACKAGE_IMPORT_MAX_ROWS, 100_000);
    assert.equal(result.nonEmptyRowCount, 100_001);
    assert.equal(result.validPhoneCount, 1);
    assert.equal(result.duplicatedRowCount, 100_000);
    assert.equal(result.exceedsMaxRows, true);
  });

  it("reports Brazil format risk with samples when every valid phone starts with 55", async () => {
    const result = await inspectDataPackageTxt(
      new File(
        ["556293501634\n557182353451\n559984344731\ninvalid\n"],
        "brazil.txt"
      )
    );

    assert.deepEqual(result.brazilRisk, {
      samplePhones: ["556293501634", "557182353451", "559984344731"]
    });
  });

  it("treats surrounding whitespace as invalid instead of normalizing it", async () => {
    const result = await inspectDataPackageTxt(
      new File([" 5511987654321 \n551187654321\n"], "phones.txt")
    );

    assert.equal(result.nonEmptyRowCount, 2);
    assert.equal(result.validPhoneCount, 1);
    assert.equal(result.invalidRowCount, 1);
  });

  it("keeps the two fixed import mode labels", () => {
    assert.equal(dataPackageImportModeLabel("APPEND"), "追加导入");
    assert.equal(dataPackageImportModeLabel("OVERWRITE"), "覆盖导入");
  });
});

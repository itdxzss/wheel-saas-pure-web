import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inspectGroupPackageText,
  inspectGroupPackageFile
} from "./import-inspection";
import {
  packageCsvCell,
  retryableCount,
  sumPackageMetrics,
  exportCount
} from "./package-display";

describe("group package TXT inspection", () => {
  it("keeps first line order and upgrades a duplicate admin marker", () => {
    const result = inspectGroupPackageText(
      "\uFEFF+66 (812) 345-678\n\n66887654321a\n66812345678A\ninvalid\n"
    );
    assert.deepEqual(result.preview, [
      { phone: "66812345678", adminRequired: true, sourceLineNo: 1 },
      { phone: "66887654321", adminRequired: true, sourceLineNo: 3 }
    ]);
    assert.equal(result.totalRows, 5);
    assert.equal(result.blankRows, 1);
    assert.equal(result.validRows, 2);
    assert.equal(result.duplicatedRows, 1);
    assert.equal(result.invalidRows, 1);
    assert.equal(result.adminCount, 2);
  });

  it("rejects prefix A, JIDs and out-of-range phone length", () => {
    const result = inspectGroupPackageText(
      "A66812345678\n66812345678@s.whatsapp.net\n123456\n1234567890123456\n1234567\n123456789012345A"
    );
    assert.equal(result.invalidRows, 4);
    assert.equal(result.validRows, 2);
  });

  it("uses physical source lines for CR and Unicode line separators as the backend does", () => {
    const result = inspectGroupPackageText(
      "66812345678\r\r66887654321A\u202866777777777\n"
    );
    assert.equal(result.totalRows, 4);
    assert.equal(result.blankRows, 1);
    assert.deepEqual(
      result.preview.map(row => row.sourceLineNo),
      [1, 3, 4]
    );
  });

  it("applies the 100,000 limit to unique valid phones, not duplicate or invalid rows", () => {
    const text = Array.from({ length: 100_000 }, (_, index) =>
      String(66000000000 + index)
    ).join("\n");
    const atLimit = inspectGroupPackageText(`${text}\n66000000000A\ninvalid`);
    assert.equal(atLimit.exceedsLimit, false);
    assert.equal(atLimit.validRows, 100_000);
    assert.equal(atLimit.adminCount, 1);
    assert.equal(
      inspectGroupPackageText(`${text}\n77000000000`).exceedsLimit,
      true
    );
  });

  it("validates file format and UTF-8 before enabling upload", async () => {
    await assert.rejects(
      inspectGroupPackageFile(new File(["1234567"], "phones.csv")),
      /TXT/
    );
    await assert.rejects(
      inspectGroupPackageFile(new File([], "empty.txt")),
      /不能为空/
    );
    await assert.rejects(
      inspectGroupPackageFile(new File([new Uint8Array([0xff])], "bad.txt")),
      TypeError
    );
    const result = await inspectGroupPackageFile(
      new File(["66812345678A\n"], "valid.txt")
    );
    assert.equal(result.adminCount, 1);
  });

  it("does not confuse privacy rejection, unregistered and unknown with resettable failure", () => {
    const metrics = {
      totalCount: 10,
      unusedCount: 1,
      claimedCount: 2,
      successCount: 1,
      failedCount: 5,
      privacyRejectedCount: 2,
      unregisteredCount: 1,
      unknownCount: 1
    };
    assert.equal(retryableCount(metrics), 2);
    assert.equal(exportCount(metrics, "failed"), 5);
    assert.equal(exportCount(metrics, "unused"), 1);
    assert.equal(sumPackageMetrics([]).totalCount, 0);
  });

  it("quotes names as text when exporting the list to CSV", () => {
    assert.equal(packageCsvCell("=SUM(1,2)"), '"\'=SUM(1,2)"');
    assert.equal(packageCsvCell('a"b'), '"a""b"');
  });
});

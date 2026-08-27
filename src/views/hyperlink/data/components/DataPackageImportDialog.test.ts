import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./DataPackageImportDialog.vue", import.meta.url),
  "utf8"
);

describe("data package import dialog", () => {
  it("offers both frozen modes and a real TXT file picker", () => {
    assert.match(source, /label="APPEND"/);
    assert.match(source, /label="OVERWRITE"/);
    assert.match(source, /accept="\.txt,text\/plain"/);
    assert.match(source, /单次最多[\s\S]*5000/);
    assert.match(source, /以后端导入结果为准/);
  });

  it("renders every server import result counter", () => {
    for (const field of [
      "importId",
      "generation",
      "totalRows",
      "acceptedRows",
      "invalidRows",
      "duplicatedRows",
      "phoneCountAfterImport"
    ]) {
      assert.match(source, new RegExp(`result\\.${field}`));
    }
  });
});

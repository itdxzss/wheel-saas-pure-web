import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./DataPackageImportDialog.vue", import.meta.url),
  "utf8"
);
const guideSource = readFileSync(
  new URL("./DataPackageImportGuide.vue", import.meta.url),
  "utf8"
);

describe("data package import dialog", () => {
  it("matches the competitor import guidance and package context", () => {
    assert.match(source, /title="导入手机号"/);
    assert.match(guideSource, /dataPackage\.name/);
    assert.match(guideSource, /dataPackage\.id/);
    assert.match(guideSource, /dataPackage\.metrics\.totalCount/);
    assert.match(guideSource, /下载模板/);
    assert.match(guideSource, /文件格式要求/);
    assert.match(guideSource, /仅允许 0-9 数字/);
    assert.match(guideSource, /禁止上传马来西亚/);
    assert.match(guideSource, /正确/);
    assert.match(guideSource, /错误/);
  });

  it("offers both import modes, front-end inspection and a TXT picker", () => {
    assert.match(source, /value: "APPEND"/);
    assert.match(source, /value: "OVERWRITE"/);
    assert.match(source, /accept="\.txt,text\/plain"/);
    assert.match(source, /formattedMaxRows/);
    assert.match(source, /forbiddenCountries/);
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

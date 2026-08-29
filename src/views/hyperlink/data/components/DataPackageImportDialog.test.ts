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
const confirmationSource = readFileSync(
  new URL("./DataPackageImportConfirmDialog.vue", import.meta.url),
  "utf8"
);
const pageStateSource = readFileSync(
  new URL("../composables/useDataPackagePage.ts", import.meta.url),
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
    assert.match(source, /exceedsMaxRows/);
    assert.match(source, /共解析到/);
    assert.match(source, /已超过单次最大/);
    assert.match(source, /巴西号码风险提醒/);
    assert.match(source, /\+9\s*\/ 去9/);
    assert.match(source, /samplePhones/);
    assert.match(source, /show-file-list/);
    assert.match(source, /formatFileSize/);
    assert.match(source, /点击或拖拽重新选择/);
  });

  it("does not render a post-upload result dialog", () => {
    assert.doesNotMatch(source, /<el-result/);
    assert.doesNotMatch(source, /导入完成/);
    assert.doesNotMatch(source, /result\./);
    assert.doesNotMatch(pageStateSource, /importResult/);
    assert.match(pageStateSource, /importVisible\.value = false/);
    assert.match(pageStateSource, /ElMessage\.success\("号码导入完成"\)/);
  });

  it("opens a confirmation step before emitting the upload", () => {
    assert.match(source, /confirmationVisible\.value = true/);
    assert.match(source, /@confirm="confirmUpload"/);
    assert.match(confirmationSource, /title="导入确认"/);
    assert.match(confirmationSource, /即将向数据包/);
    assert.match(confirmationSource, /随机预览（前 5 条）/);
    assert.match(confirmationSource, /previewPhones/);
    assert.match(confirmationSource, /巴西号码（55 开头）风险提醒/);
    assert.match(confirmationSource, /返回修改/);
    assert.match(confirmationSource, /确认上传/);
  });
});

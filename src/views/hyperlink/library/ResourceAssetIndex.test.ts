import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
// @ts-expect-error Node test runner resolves the explicit TypeScript extension.
import * as assetDomain from "./domain/resource-asset.ts";

const pageSource = readFileSync(
  fileURLToPath(new URL("./index.vue", import.meta.url)),
  "utf8"
);
const cardSource = readFileSync(
  fileURLToPath(new URL("./components/ResourceAssetCard.vue", import.meta.url)),
  "utf8"
);
const uploadSource = readFileSync(
  fileURLToPath(
    new URL("./components/ResourceAssetUploadDialog.vue", import.meta.url)
  ),
  "utf8"
);
const pickerSource = readFileSync(
  fileURLToPath(
    new URL("./components/ResourceAssetPicker.vue", import.meta.url)
  ),
  "utf8"
);

describe("hyperlink image asset library", () => {
  it("keeps exact case-sensitive tags and enforces the 20 tag boundary", () => {
    assert.equal(assetDomain.RESOURCE_ASSET_MAX_TAGS, 20);
    assert.deepEqual(
      assetDomain.normalizeResourceAssetTags([" Promo ", "promo", "Promo", ""]),
      ["Promo", "promo"]
    );
    assert.throws(
      () =>
        assetDomain.normalizeResourceAssetTags(
          Array.from({ length: 21 }, (_, index) => `tag-${index}`)
        ),
      /最多设置 20 个标签/
    );
  });

  it("contains management, serial upload and picker contracts", () => {
    assert.match(pageSource, /WhatsApp 素材库/);
    assert.match(pageSource, /tenant:resource_asset:upload/);
    assert.match(cardSource, /确认删除该素材/);
    assert.match(uploadSource, /uploadResourceAssetBatch/);
    assert.doesNotMatch(uploadSource, /Promise\.all\([^)]*uploadResourceAsset/);
    assert.match(pickerSource, /从素材库选择/);
    assert.match(pickerSource, /pageSize = ref<12 \| 24 \| 48 \| 96>\(12\)/);
    assert.match(pickerSource, /使用该素材/);
    assert.match(pickerSource, /暂无符合条件的图片素材/);
    assert.match(pickerSource, /pendingSelection/);
  });

  it("uses a blue branded intro and compact scannable asset cards", () => {
    assert.match(pageSource, /class="intro-content"/);
    assert.match(pageSource, /class="asset-list-card"/);
    assert.match(cardSource, /class="asset-heading"/);
    assert.match(cardSource, />尺寸</);
    assert.match(cardSource, />大小</);
    assert.match(cardSource, />引用</);
    assert.match(cardSource, /: "未知"/);
    assert.match(cardSource, /aspect-ratio:\s*16\s*\/\s*9/);
    assert.match(cardSource, /min-height:\s*0/);
    assert.match(
      pageSource,
      /background:\s*linear-gradient\([\s\S]*?var\(--el-color-primary\)/
    );
  });

  it("uploads one file at a time and keeps only failed items for retry", async () => {
    const files = ["one.jpg", "two.jpg", "three.jpg"].map(
      name => new File([name], name, { type: "image/jpeg" })
    );
    const items: assetDomain.ResourceAssetUploadItem[] = files.map(file => ({
      file,
      status: "pending",
      progress: 0,
      message: ""
    }));
    const calls: string[] = [];
    const gates = files.map(() => deferred<void>());
    const running = assetDomain.uploadResourceAssetBatch(
      items,
      ["Promo"],
      async (file, tags, onProgress) => {
        calls.push(file.name);
        assert.deepEqual(tags, ["Promo"]);
        onProgress(50);
        await gates[calls.length - 1].promise;
      },
      error => (error instanceof Error ? error.message : "上传失败")
    );

    await tick();
    assert.deepEqual(calls, ["one.jpg"]);
    gates[0].resolve();
    await tick();
    assert.deepEqual(calls, ["one.jpg", "two.jpg"]);
    gates[1].reject(new Error("第二张失败"));
    await tick();
    assert.deepEqual(calls, ["one.jpg", "two.jpg", "three.jpg"]);
    gates[2].resolve();

    const result = await running;
    assert.deepEqual(
      result.succeeded.map(item => item.file.name),
      ["one.jpg", "three.jpg"]
    );
    assert.deepEqual(
      result.failed.map(item => item.file.name),
      ["two.jpg"]
    );
    assert.equal(result.failed[0].message, "第二张失败");
    assert.equal(result.succeeded[0].progress, 100);
  });
});

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function tick(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

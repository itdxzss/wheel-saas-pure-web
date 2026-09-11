import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node test runner resolves the explicit TypeScript extension.
import { validateResourceAssetFile } from "./resource-asset.ts";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64"
);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);

describe("resource asset image formats", () => {
  it("accepts PNG and existing JPEG signatures with case-insensitive extensions", async () => {
    for (const file of [
      new File([png], "透明图.PNG", { type: "image/png" }),
      new File([jpeg], "图片.JPG", { type: "image/jpeg" }),
      new File([jpeg], "图片.jpeg", { type: "image/jpeg" })
    ]) {
      assert.deepEqual(await validateResourceAssetFile(file), {
        valid: true,
        message: ""
      });
    }
  });

  it("rejects renamed images, mismatched MIME, invalid signatures and truncated PNG", async () => {
    for (const file of [
      new File([png], "图片.jpg", { type: "image/png" }),
      new File([jpeg], "图片.png", { type: "image/png" }),
      new File([png], "图片.png", { type: "image/jpeg" }),
      new File([png], "图片.gif", { type: "image/gif" }),
      new File([png.subarray(0, 8)], "图片.png", { type: "image/png" }),
      new File([png.subarray(0, -4)], "图片.png", { type: "image/png" }),
      new File([], "图片.png", { type: "image/png" })
    ]) {
      assert.equal((await validateResourceAssetFile(file)).valid, false);
    }
  });

  it("keeps the 500KB boundary for PNG", async () => {
    const bytes = new Uint8Array(500 * 1024);
    bytes.set(png.subarray(0, 8));
    bytes.set(png.subarray(-12), bytes.length - 12);
    assert.equal(
      (
        await validateResourceAssetFile(
          new File([bytes], "图片.png", { type: "image/png" })
        )
      ).valid,
      true
    );
    const oversized = await validateResourceAssetFile(
      new File([bytes, new Uint8Array(1)], "图片.png", { type: "image/png" })
    );
    assert.equal(oversized.valid, false);
    assert.match(oversized.message, /500KB/);
  });
});

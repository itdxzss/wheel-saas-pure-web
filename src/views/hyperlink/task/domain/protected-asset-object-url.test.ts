import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProtectedAssetObjectUrlCache } from "./protected-asset-object-url";

describe("protected hyperlink asset object URL cache", () => {
  it("shares one authenticated download and revokes after the final release", async () => {
    let downloads = 0;
    const revoked: string[] = [];
    const cache = createProtectedAssetObjectUrlCache(
      async () => {
        downloads += 1;
        return new Blob(["image"]);
      },
      {
        createObjectURL: () => "blob:asset-7",
        revokeObjectURL: url => revoked.push(url)
      }
    );

    const [first, second] = await Promise.all([
      cache.acquire(7),
      cache.acquire(7)
    ]);
    assert.equal(first, "blob:asset-7");
    assert.equal(second, "blob:asset-7");
    assert.equal(downloads, 1);

    cache.release(7);
    assert.deepEqual(revoked, []);
    cache.release(7);
    assert.deepEqual(revoked, ["blob:asset-7"]);
  });

  it("revokes a late result when every consumer already released it", async () => {
    let resolveBlob!: (blob: Blob) => void;
    const revoked: string[] = [];
    const cache = createProtectedAssetObjectUrlCache(
      () => new Promise(resolve => (resolveBlob = resolve)),
      {
        createObjectURL: () => "blob:late",
        revokeObjectURL: url => revoked.push(url)
      }
    );

    const pending = cache.acquire(9);
    cache.release(9);
    resolveBlob(new Blob(["late"]));
    await pending;
    assert.deepEqual(revoked, ["blob:late"]);
  });
});

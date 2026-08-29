import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  deleteResourceAsset,
  downloadResourceAsset,
  getResourceAsset,
  listResourceAssets,
  listResourceAssetTags,
  resourceAssetContentUrl,
  updateResourceAsset,
  uploadResourceAsset
} from "./resource-asset";

describe("resource asset API", () => {
  it("uses repeated tag query parameters for exact multi-tag filtering", async () => {
    resetArmadaMock({
      list: [],
      page: 1,
      pageSize: 24,
      total: 0,
      totalPages: 0
    });

    await listResourceAssets({
      page: 1,
      pageSize: 24,
      tags: ["Promo", "promo"]
    });

    const [call] = armadaCalls();
    assert.equal(call.method, "get");
    assert.equal(call.url, "/api/resource-assets");
    const opts = call.opts as {
      params: Record<string, unknown>;
      paramsSerializer: {
        serialize: (params: Record<string, unknown>) => string;
      };
    };
    assert.deepEqual(opts.params, {
      page: 1,
      pageSize: 24,
      tags: ["Promo", "promo"]
    });
    assert.equal(
      opts.paramsSerializer.serialize(opts.params),
      "page=1&pageSize=24&tags=Promo&tags=promo"
    );
  });

  it("maps detail, tag, update and delete endpoints", async () => {
    resetArmadaMock({ tags: ["Promo", "promo"] });

    await getResourceAsset(88);
    assert.deepEqual(await listResourceAssetTags(), ["Promo", "promo"]);
    await updateResourceAsset(88, { assetName: "活动主图", tags: ["Promo"] });
    await deleteResourceAsset(88);

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/resource-assets/88", opts: undefined },
      { method: "get", url: "/api/resource-assets/tags", opts: undefined },
      {
        method: "put",
        url: "/api/resource-assets/88",
        opts: { data: { assetName: "活动主图", tags: ["Promo"] } }
      },
      { method: "delete", url: "/api/resource-assets/88", opts: undefined }
    ]);
  });

  it("uploads a file with JSON tags and reports progress", async () => {
    resetArmadaMock({ id: 88 });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "promo.jpg", {
      type: "image/jpeg"
    });
    const progress: number[] = [];

    await uploadResourceAsset(file, ["Promo", "promo"], value =>
      progress.push(value)
    );

    const [call] = armadaCalls();
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/resource-assets");
    const opts = call.opts as {
      data: FormData;
      timeout: number;
      onUploadProgress: (event: { loaded: number; total?: number }) => void;
    };
    assert.equal(opts.data.get("file"), file);
    assert.equal(opts.data.get("tags"), '["Promo","promo"]');
    assert.equal(opts.timeout, 45_000);
    opts.onUploadProgress({ loaded: 1, total: 4 });
    assert.deepEqual(progress, [25]);

    const headers = { "Content-Type": "application/json" };
    (
      call.config as {
        beforeRequestCallback: (config: { headers: typeof headers }) => void;
      }
    ).beforeRequestCallback({ headers });
    assert.deepEqual(headers, {});
  });

  it("downloads content as an authenticated blob", async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
      type: "image/jpeg"
    });
    resetHttpMock(blob);

    assert.equal(await downloadResourceAsset(88), blob);
    assert.equal(
      resourceAssetContentUrl(88),
      "/api/resource-assets/88/content"
    );
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/resource-assets/88/content",
        opts: { responseType: "blob" }
      }
    ]);
  });
});

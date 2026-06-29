import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { listTenantIpRegions } from "./resource-ip";

describe("resource IP API", () => {
  it("loads tenant IP regions from the distinct backend endpoint", async () => {
    resetArmadaMock(["混合（不限国家）", "印度", "马来西亚"]);

    const regions = await listTenantIpRegions();

    assert.deepEqual(regions, ["混合（不限国家）", "印度", "马来西亚"]);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/ip-proxies/regions",
        opts: undefined
      }
    ]);
  });
});

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";

describe("buyer permission navigation", () => {
  it("does not register buyer pages as permission-free static routes", () => {
    assert.equal(
      existsSync(new URL("./modules/buyer.ts", import.meta.url)),
      false
    );
    for (const view of [
      "../views/buyer/template/index.vue",
      "../views/buyer/channel/index.vue",
      "../views/buyer/channel-stats/index.vue"
    ]) {
      assert.equal(existsSync(new URL(view, import.meta.url)), true, view);
    }
  });
});

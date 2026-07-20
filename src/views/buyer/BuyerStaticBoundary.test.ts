import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("buyer static preview boundary", () => {
  it("keeps the original dynamic menu contract", () => {
    const routes = read("src/api/routes.ts");
    const fakeRoutes = read("mock/asyncRoutes.ts");
    assert.match(routes, /\/get-async-routes/);
    assert.doesNotMatch(routes, /\/api\/tenant\/me\/menus|menu-mapping/);
    assert.match(fakeRoutes, /url:\s*["']\/get-async-routes["']/);
    assert.doesNotMatch(fakeRoutes, /buyerRouter|toWheelMenuNode/);
  });

  it("uses the original shared table and request contracts", () => {
    const bar = read("src/components/RePureTableBar/src/bar.tsx");
    assert.doesNotMatch(bar, /columnTitle|columnDraggable|column-visibility/);
    assert.doesNotMatch(read("src/api/armada.ts"), /ArmadaBusinessError/);
    assert.doesNotMatch(read("src/utils/api-error.ts"), /hasApiErrorCode/);
    assert.doesNotMatch(read("types/router.d.ts"), /module_key|perm_key/);
  });

  it("does not ship buyer Fake Server files", () => {
    for (const path of [
      "mock/buyer.ts",
      "mock/buyer-runtime.ts",
      "mock/buyer-runtime.test.ts"
    ]) {
      assert.equal(existsSync(new URL(path, root)), false, path);
    }
  });
});

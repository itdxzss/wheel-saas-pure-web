import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("buyer permission boundary", () => {
  it("loads buyer navigation from the authenticated tenant menu", () => {
    const routes = read("src/api/routes.ts");
    assert.match(routes, /\/api\/tenant\/me\/menus/);
    assert.doesNotMatch(routes, /\/get-async-routes|menu-mapping/);
    assert.equal(
      existsSync(new URL("src/router/modules/buyer.ts", root)),
      false
    );
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

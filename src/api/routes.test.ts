import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { getAsyncRoutes } from "./routes";

describe("authenticated async route API", () => {
  it("loads current tenant menus from the real backend endpoint", async () => {
    resetArmadaMock([]);
    assert.deepEqual(await getAsyncRoutes(), []);
    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/tenant/me/menus", opts: undefined }
    ]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { getAsyncRoutes } from "./routes";

describe("tenant async routes", () => {
  it("requests the production tenant menu endpoint and keeps pure-admin shape", async () => {
    resetArmadaMock([
      {
        route_path: "/buyer/promotion/template",
        menu_key: "BuyerTemplate",
        name: "模板管理",
        icon: null,
        module_key: "buyer_template",
        perm_key: "tenant:buyer-template:view",
        view_path: "buyer/template/index",
        children: []
      }
    ]);

    const result = await getAsyncRoutes();

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/tenant/me/menus", opts: undefined }
    ]);
    assert.deepEqual(result, {
      success: true,
      data: [
        {
          path: "/buyer/promotion/template",
          name: "BuyerTemplate",
          component: "buyer/template/index",
          meta: {
            title: "模板管理",
            module_key: "buyer_template",
            perm_key: "tenant:buyer-template:view"
          }
        }
      ]
    });
  });
});

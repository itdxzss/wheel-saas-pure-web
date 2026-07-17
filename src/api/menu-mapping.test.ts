import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapWheelMenuNodes } from "./menu-mapping";

describe("wheel tenant menu mapping", () => {
  it("recursively maps wheel menu fields to pure-admin routes", () => {
    const result = mapWheelMenuNodes([
      {
        route_path: "/buyer",
        menu_key: "BuyerRoot",
        name: "买号上量系统",
        icon: "ep:promotion",
        module_key: "buyer",
        perm_key: null,
        view_path: null,
        children: [
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
        ]
      }
    ]);

    assert.deepEqual(result, [
      {
        path: "/buyer",
        name: "BuyerRoot",
        meta: {
          title: "买号上量系统",
          icon: "ep:promotion",
          module_key: "buyer"
        },
        children: [
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
      }
    ]);
  });
});

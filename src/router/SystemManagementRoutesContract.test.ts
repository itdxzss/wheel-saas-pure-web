import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const routes = readFileSync(
  new URL("../../mock/asyncRoutes.ts", import.meta.url),
  "utf8"
);

describe("temporary system management routes", () => {
  it("exposes the three system pages and regrouped business directories", () => {
    for (const text of [
      "群组管理",
      "资源管理",
      "系统管理",
      'component: "system/user/index"',
      'component: "system/role/index"',
      'component: "system/menu/index"',
      'name: "SystemUser"',
      'name: "SystemRole"',
      'name: "SystemMenu"'
    ])
      assert.ok(routes.includes(text), text);
  });
});

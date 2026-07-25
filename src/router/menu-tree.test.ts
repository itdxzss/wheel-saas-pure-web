import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { findViewModuleKey, shouldKeepMenuNode } from "./menu-tree.ts";

describe("dynamic menu tree filtering", () => {
  it("keeps a backend leaf menu when children is an empty array", () => {
    assert.equal(
      shouldKeepMenuNode({
        component: "system/user/index",
        children: []
      }),
      true
    );
  });

  it("hides a directory that has no accessible child menu", () => {
    assert.equal(shouldKeepMenuNode({ children: [] }), false);
  });

  it("keeps a directory that still has accessible children", () => {
    assert.equal(shouldKeepMenuNode({ children: [{}] }), true);
  });
});

describe("dynamic route component matching", () => {
  const moduleKeys = [
    "/src/views/system/menu/index.vue",
    "/src/views/system/role/index.vue",
    "/src/views/system/user/index.vue"
  ];

  it("does not guess a page component for a directory route", () => {
    assert.equal(
      findViewModuleKey(
        { path: "/system", children: [{ path: "/system/user" }] },
        moduleKeys
      ),
      undefined
    );
  });

  it("maps each system menu to its own real page component", () => {
    assert.equal(
      findViewModuleKey({ component: "system/user/index" }, moduleKeys),
      "/src/views/system/user/index.vue"
    );
    assert.equal(
      findViewModuleKey({ component: "system/role/index" }, moduleKeys),
      "/src/views/system/role/index.vue"
    );
    assert.equal(
      findViewModuleKey({ component: "system/menu/index" }, moduleKeys),
      "/src/views/system/menu/index.vue"
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { shouldKeepMenuNode } from "./menu-tree.ts";

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

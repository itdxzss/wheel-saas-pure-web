import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { findViewModuleKey } from "./menu-tree.ts";

const taskPage = fileURLToPath(
  new URL("../views/contact/hyperlink/index.vue", import.meta.url)
);
const scriptPage = fileURLToPath(
  new URL("../views/contact/script/index.vue", import.meta.url)
);
const mockRoutes = readFileSync(
  fileURLToPath(new URL("../../mock/asyncRoutes.ts", import.meta.url)),
  "utf8"
);

describe("contact marketing dynamic routes", () => {
  it("maps backend component paths to the two real page modules", () => {
    assert.equal(existsSync(taskPage), true);
    assert.equal(existsSync(scriptPage), true);

    const moduleKeys = [
      "/src/views/contact/hyperlink/index.vue",
      "/src/views/contact/script/index.vue"
    ];
    assert.equal(
      findViewModuleKey({ component: "contact/hyperlink/index" }, moduleKeys),
      moduleKeys[0]
    );
    assert.equal(
      findViewModuleKey({ component: "contact/script/index" }, moduleKeys),
      moduleKeys[1]
    );
  });

  it("keeps the development preview menu aligned with backend RBAC", () => {
    // 这四个节点逐字对齐 V159__contact_marketing_menu_rbac.sql
    assert.match(mockRoutes, /path: "\/contact"/);
    assert.match(mockRoutes, /component: "contact\/hyperlink\/index"/);
    assert.match(mockRoutes, /component: "contact\/script\/index"/);
    assert.match(mockRoutes, /tenant:contact_task:view/);
    assert.match(mockRoutes, /tenant:contact_task:create/);
    assert.match(mockRoutes, /tenant:contact_task:edit/);
    assert.match(mockRoutes, /tenant:contact_task:operate/);
  });

  it("uses the menu keys the migration inserts", () => {
    assert.match(mockRoutes, /name: "ContactHyperlinkTask"/);
    assert.match(mockRoutes, /name: "ContactScriptTask"/);
  });

  it("declares no delete permission because the api has none", () => {
    assert.doesNotMatch(mockRoutes, /tenant:contact_task:delete/);
  });
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { findViewModuleKey } from "./menu-tree.ts";

const dataPage = fileURLToPath(
  new URL("../views/hyperlink/data/index.vue", import.meta.url)
);
const templatePage = fileURLToPath(
  new URL("../views/hyperlink/templates/index.vue", import.meta.url)
);
const taskPage = fileURLToPath(
  new URL("../views/hyperlink/task/index.vue", import.meta.url)
);
const mockRoutes = readFileSync(
  fileURLToPath(new URL("../../mock/asyncRoutes.ts", import.meta.url)),
  "utf8"
);

describe("hyperlink phase-one dynamic routes", () => {
  it("maps backend component paths to the three real page modules", () => {
    assert.equal(existsSync(dataPage), true);
    assert.equal(existsSync(templatePage), true);
    assert.equal(existsSync(taskPage), true);

    const moduleKeys = [
      "/src/views/hyperlink/data/index.vue",
      "/src/views/hyperlink/templates/index.vue",
      "/src/views/hyperlink/task/index.vue"
    ];
    assert.equal(
      findViewModuleKey({ component: "hyperlink/data/index" }, moduleKeys),
      moduleKeys[0]
    );
    assert.equal(
      findViewModuleKey({ component: "hyperlink/templates/index" }, moduleKeys),
      moduleKeys[1]
    );
    assert.equal(
      findViewModuleKey({ component: "hyperlink/task/index" }, moduleKeys),
      moduleKeys[2]
    );
  });

  it("keeps the development preview menu aligned with backend RBAC", () => {
    assert.match(mockRoutes, /path: "\/hyperlink"/);
    assert.match(mockRoutes, /component: "hyperlink\/data\/index"/);
    assert.match(mockRoutes, /component: "hyperlink\/templates\/index"/);
    assert.match(mockRoutes, /component: "hyperlink\/task\/index"/);
    assert.match(mockRoutes, /tenant:hyperlink_task:view/);
    assert.match(mockRoutes, /tenant:hyperlink_task:create/);
    assert.match(mockRoutes, /tenant:hyperlink_task:edit/);
    assert.match(mockRoutes, /tenant:hyperlink_task:action/);
    assert.match(mockRoutes, /tenant:hyperlink_task:export/);
    assert.match(mockRoutes, /tenant:hyperlink_data:create/);
    assert.match(mockRoutes, /tenant:hyperlink_data:import/);
    assert.match(mockRoutes, /tenant:hyperlink_data:edit/);
    assert.match(mockRoutes, /tenant:hyperlink_data:delete/);
    assert.match(mockRoutes, /tenant:hyperlink_template:create/);
    assert.match(mockRoutes, /tenant:hyperlink_template:edit/);
    assert.match(mockRoutes, /tenant:hyperlink_template:copy/);
    assert.match(mockRoutes, /tenant:hyperlink_template:delete/);
  });
});

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
const strategyPage = fileURLToPath(
  new URL("../views/hyperlink/strategy/index.vue", import.meta.url)
);
const libraryPage = fileURLToPath(
  new URL("../views/hyperlink/library/index.vue", import.meta.url)
);
const analysisPage = fileURLToPath(
  new URL("../views/hyperlink/analysis/index.vue", import.meta.url)
);
const mockRoutes = readFileSync(
  fileURLToPath(new URL("../../mock/asyncRoutes.ts", import.meta.url)),
  "utf8"
);

describe("hyperlink phase-one dynamic routes", () => {
  it("maps backend component paths to the six real page modules", () => {
    assert.equal(existsSync(dataPage), true);
    assert.equal(existsSync(templatePage), true);
    assert.equal(existsSync(taskPage), true);
    assert.equal(existsSync(strategyPage), true);
    assert.equal(existsSync(libraryPage), true);
    assert.equal(existsSync(analysisPage), true);

    const moduleKeys = [
      "/src/views/hyperlink/data/index.vue",
      "/src/views/hyperlink/templates/index.vue",
      "/src/views/hyperlink/task/index.vue",
      "/src/views/hyperlink/strategy/index.vue",
      "/src/views/hyperlink/library/index.vue",
      "/src/views/hyperlink/analysis/index.vue"
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
    assert.equal(
      findViewModuleKey({ component: "hyperlink/strategy/index" }, moduleKeys),
      moduleKeys[3]
    );
    assert.equal(
      findViewModuleKey({ component: "hyperlink/library/index" }, moduleKeys),
      moduleKeys[4]
    );
    assert.equal(
      findViewModuleKey({ component: "hyperlink/analysis/index" }, moduleKeys),
      moduleKeys[5]
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
    assert.match(mockRoutes, /component: "hyperlink\/strategy\/index"/);
    assert.match(mockRoutes, /tenant:hyperlink_strategy:create/);
    assert.match(mockRoutes, /tenant:hyperlink_strategy:edit/);
    assert.match(mockRoutes, /tenant:hyperlink_strategy:delete/);
    assert.match(mockRoutes, /tenant:hyperlink_task:attribution_sensitive/);
    assert.match(mockRoutes, /component: "hyperlink\/library\/index"/);
    assert.match(mockRoutes, /component: "hyperlink\/analysis\/index"/);
    assert.match(mockRoutes, /tenant:hyperlink_analysis:view/);
    assert.match(mockRoutes, /tenant:hyperlink_data:create/);
    assert.match(mockRoutes, /tenant:hyperlink_data:import/);
    assert.match(mockRoutes, /tenant:hyperlink_data:edit/);
    assert.match(mockRoutes, /tenant:hyperlink_data:delete/);
    assert.match(mockRoutes, /tenant:hyperlink_template:create/);
    assert.match(mockRoutes, /tenant:hyperlink_template:edit/);
    assert.match(mockRoutes, /tenant:hyperlink_template:copy/);
    assert.match(mockRoutes, /tenant:hyperlink_template:delete/);
    assert.match(mockRoutes, /tenant:resource_asset:upload/);
    assert.match(mockRoutes, /tenant:resource_asset:edit/);
    assert.match(mockRoutes, /tenant:resource_asset:delete/);
    const hyperlinkPages = [
      "hyperlink/task/index",
      "hyperlink/data/index",
      "hyperlink/templates/index",
      "hyperlink/strategy/index",
      "hyperlink/library/index",
      "hyperlink/analysis/index"
    ];
    for (let index = 1; index < hyperlinkPages.length; index += 1) {
      assert.ok(
        mockRoutes.indexOf(hyperlinkPages[index - 1]) <
          mockRoutes.indexOf(hyperlinkPages[index]),
        `${hyperlinkPages[index - 1]} before ${hyperlinkPages[index]}`
      );
    }
    for (const rank of [10, 20, 30, 40, 50, 60]) {
      assert.match(mockRoutes, new RegExp(`rank: ${rank}`));
    }
  });
});

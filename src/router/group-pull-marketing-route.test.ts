import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  fileURLToPath(new URL("../api/routes.ts", import.meta.url)),
  "utf8"
);
const marketingPageSource = readFileSync(
  fileURLToPath(
    new URL("../views/task/group-marketing/index.vue", import.meta.url)
  ),
  "utf8"
);
const groupPullDetailSource = readFileSync(
  fileURLToPath(
    new URL(
      "../views/task/group-pull-marketing/detail/index.vue",
      import.meta.url
    )
  ),
  "utf8"
);

describe("group pull marketing navigation", () => {
  it("derives a hidden detail route from the authorized real menu", () => {
    assert.match(routeSource, /appendAuthorizedCompanionRoutes/);
    assert.match(routeSource, /TaskGroupPullMarketing/);
    assert.match(routeSource, /get.*\/api\/tenant\/me\/menus/);
    assert.match(routeSource, /\/task\/group-pull-marketing\/:id/);
    assert.match(routeSource, /GroupPullMarketingDetail/);
    assert.match(routeSource, /activePath: "\/task\/group-pull-marketing"/);
    assert.match(
      routeSource,
      /component: "task\/group-pull-marketing\/detail\/index"/
    );
  });

  it("opens an existing simple marketing detail from the taskId query", () => {
    assert.match(marketingPageSource, /useRoute/);
    assert.match(marketingPageSource, /route\.query\.taskId/);
    assert.match(marketingPageSource, /openDetailById/);
  });

  it("watches the dynamic task id when the hidden detail route is reused", () => {
    assert.match(groupPullDetailSource, /watch\(/);
    assert.match(groupPullDetailSource, /route\.params\.id/);
    assert.match(groupPullDetailSource, /pageState\.changeTaskId\(taskId\)/);
  });
});

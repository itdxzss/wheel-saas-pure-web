import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const routeSource = readFileSync(
  fileURLToPath(new URL("../../mock/asyncRoutes.ts", import.meta.url)),
  "utf8"
);
const pageSource = readFileSync(
  fileURLToPath(new URL("../views/task/feed-task/index.vue", import.meta.url)),
  "utf8"
);

describe("feed task route contract", () => {
  it("places the page under the dynamic marketing menu", () => {
    assert.match(routeSource, /title: "动态营销"/);
    assert.match(routeSource, /path: "\/task\/feed\/task"/);
    assert.match(routeSource, /component: "task\/feed-task\/index"/);
    assert.match(routeSource, /perm_key: "tenant:feed_task:view"/);
  });

  it("keeps the page wired to the dedicated feed task state", () => {
    assert.match(pageSource, /useFeedTaskPage/);
    assert.match(pageSource, /FeedTaskFilterDrawer/);
    assert.match(pageSource, /FeedTaskEditorDrawer/);
    assert.match(pageSource, /FeedTaskDataDrawer/);
  });
});

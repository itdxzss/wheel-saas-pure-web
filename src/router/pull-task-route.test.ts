import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  fileURLToPath(new URL("../api/routes.ts", import.meta.url)),
  "utf8"
);

describe("pull task navigation", () => {
  it("derives a hidden create route from the authorized pull task menu", () => {
    assert.match(routeSource, /PULL_TASK_ROUTE_NAME = "TaskPull"/);
    assert.match(routeSource, /path: "\/task\/pull-task\/create"/);
    assert.match(
      routeSource,
      /component: "task\/pull-task\/create\/index"/
    );
    assert.match(routeSource, /name: "TaskPullCreate"/);
    assert.match(routeSource, /activePath: "\/task\/pull-task"/);
    assert.match(routeSource, /title: "新建拉群任务"/);
  });

  it("does not add the pull task prototype to the marketing menu", () => {
    assert.doesNotMatch(
      routeSource,
      /path: "\/task\/group-pull-marketing\/create"/
    );
    assert.match(routeSource, /path: "\/task\/group-pull-marketing\/:id"/);
  });
});

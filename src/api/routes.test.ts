import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import { getAsyncRoutes } from "./routes";

const mockRouteSource = readFileSync(
  fileURLToPath(new URL("../../mock/asyncRoutes.ts", import.meta.url)),
  "utf8"
);

describe("original async route API", () => {
  it("keeps the framework endpoint and response shape", async () => {
    const response = { success: true, data: [] };
    resetHttpMock(response);
    assert.deepEqual(await getAsyncRoutes(), response);
    assert.deepEqual(httpCalls(), [
      { method: "get", url: "/get-async-routes", opts: undefined }
    ]);
  });

  it("keeps build marketing and registers the independent group pull menu", () => {
    assert.match(mockRouteSource, /name: "TaskGroupCreationMarketing"/);
    assert.match(mockRouteSource, /path: "\/task\/group-creation-marketing"/);
    assert.match(mockRouteSource, /name: "TaskGroupPullMarketing"/);
    assert.match(mockRouteSource, /title: "拉群营销"/);
    assert.match(
      mockRouteSource,
      /perm_key: "tenant:group_pull_marketing:view"/
    );
  });
});

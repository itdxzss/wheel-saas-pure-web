import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import { getAsyncRoutes } from "./routes";

describe("original async route API", () => {
  it("keeps the framework endpoint and response shape", async () => {
    const response = { success: true, data: [] };
    resetHttpMock(response);
    assert.deepEqual(await getAsyncRoutes(), response);
    assert.deepEqual(httpCalls(), [
      { method: "get", url: "/get-async-routes", opts: undefined }
    ]);
  });
});

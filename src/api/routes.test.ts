import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import { getAsyncRoutes } from "./routes";

describe("authenticated async route API", () => {
  it("loads current tenant menus from the real backend endpoint", async () => {
    const response = { code: 0, message: "ok", data: [] };
    resetHttpMock(response);
    assert.deepEqual(await getAsyncRoutes(), []);
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/tenant/me/menus",
        opts: undefined,
        config: undefined
      }
    ]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { isRequestTimeout } from "./api-error.ts";

describe("isRequestTimeout", () => {
  it("recognizes Axios timeout codes", () => {
    assert.equal(isRequestTimeout({ code: "ECONNABORTED" }), true);
    assert.equal(isRequestTimeout({ code: "ETIMEDOUT" }), true);
  });

  it("recognizes timeout messages and rejects unrelated failures", () => {
    assert.equal(
      isRequestTimeout({ message: "timeout of 10000ms exceeded" }),
      true
    );
    assert.equal(isRequestTimeout({ message: "Network Error" }), false);
    assert.equal(isRequestTimeout("cancel"), false);
  });
});

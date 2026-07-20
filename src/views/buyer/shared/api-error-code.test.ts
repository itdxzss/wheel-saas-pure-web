import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasBuyerApiErrorCode } from "./api-error-code";

describe("buyer API error codes", () => {
  it("finds a code in Axios and nested business error shapes", () => {
    const errors = [
      { response: { data: { errorCode: "VERSION_CONFLICT" } } },
      { response: { data: { code: "VERSION_CONFLICT" } } },
      { data: { error: { message: "VERSION_CONFLICT" } } }
    ];
    for (const error of errors) {
      assert.equal(hasBuyerApiErrorCode(error, "VERSION_CONFLICT"), true);
    }
    assert.equal(
      hasBuyerApiErrorCode(new Error("network"), "VERSION_CONFLICT"),
      false
    );
  });
});

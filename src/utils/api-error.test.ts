import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasApiErrorCode } from "./api-error";

describe("structured API error extraction", () => {
  it("finds codes in Axios response data and Armada error data", () => {
    for (const error of [
      {
        response: {
          status: 409,
          data: { errorCode: "DOMAIN_TEMPLATE_CONFLICT" }
        }
      },
      { response: { status: 409, data: { code: "DOMAIN_TEMPLATE_CONFLICT" } } },
      {
        response: { status: 409, data: { message: "DOMAIN_TEMPLATE_CONFLICT" } }
      },
      { code: 409, data: { errorCode: "DOMAIN_TEMPLATE_CONFLICT" } }
    ]) {
      assert.equal(hasApiErrorCode(error, "DOMAIN_TEMPLATE_CONFLICT"), true);
    }
  });
});

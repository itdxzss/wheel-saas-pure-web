import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resetHttpMock } from "./__tests__/http-test-double";
import { ArmadaBusinessError, armadaRequest } from "./armada";

describe("armada business errors", () => {
  it("preserves non-zero envelope code and data without changing its message", async () => {
    resetHttpMock({
      code: "BUSINESS_REJECTED",
      message: "业务拒绝",
      data: { errorCode: "DOMAIN_TEMPLATE_CONFLICT", field: "domain" }
    });
    await assert.rejects(
      armadaRequest("post", "/api/test", { data: { value: 1 } }),
      error => {
        assert.ok(error instanceof ArmadaBusinessError);
        assert.equal(error.message, "业务拒绝");
        assert.equal(error.code, "BUSINESS_REJECTED");
        assert.deepEqual(error.data, {
          errorCode: "DOMAIN_TEMPLATE_CONFLICT",
          field: "domain"
        });
        return true;
      }
    );
  });
});

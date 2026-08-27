import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import * as authAccess from "./auth-access.ts";

const {
  hasValidAuthSession,
  isUnauthorizedBusinessCode,
  isUnauthorizedHttpStatus
} = authAccess;

describe("route authentication access", () => {
  it("requires a login marker, user identity and unexpired access token", () => {
    const now = 1_000;
    const valid = { accessToken: "token", expires: 2_000 };

    assert.equal(hasValidAuthSession(valid, true, true, now), true);
    assert.equal(hasValidAuthSession(valid, false, true, now), false);
    assert.equal(hasValidAuthSession(valid, true, false, now), false);
    assert.equal(
      hasValidAuthSession({ expires: 2_000 }, true, true, now),
      false
    );
    assert.equal(
      hasValidAuthSession(
        { accessToken: "token", expires: 1_000 },
        true,
        true,
        now
      ),
      false
    );
  });

  it("only treats HTTP 401 as a forced-login response", () => {
    assert.equal(isUnauthorizedHttpStatus(401), true);
    assert.equal(isUnauthorizedHttpStatus(403), false);
    assert.equal(isUnauthorizedHttpStatus(500), false);
    assert.equal(isUnauthorizedHttpStatus(undefined), false);
  });

  it("only treats current-user authentication business codes as forced login", () => {
    assert.equal(isUnauthorizedBusinessCode(40101), true);
    assert.equal(isUnauthorizedBusinessCode(40104), true);
    assert.equal(isUnauthorizedBusinessCode(40302), false);
    assert.equal(isUnauthorizedBusinessCode(40103), false);
    assert.equal(isUnauthorizedBusinessCode(40301), false);
  });
});

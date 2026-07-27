import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { isValidPassword } from "./password-policy.ts";

describe("password policy", () => {
  it("accepts 8-18 visible characters from at least two categories", () => {
    assert.equal(isValidPassword("admin123"), true);
    assert.equal(isValidPassword("admin!@#"), true);
  });

  it("rejects passwords outside the shared policy", () => {
    assert.equal(isValidPassword("admin"), false);
    assert.equal(isValidPassword("AdminAdmin"), false);
    assert.equal(isValidPassword("12345678"), false);
    assert.equal(isValidPassword("管理admin123"), false);
    assert.equal(isValidPassword("admin 123"), false);
  });
});

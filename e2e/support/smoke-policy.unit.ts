import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { resolveLoginCredentials } from "./environment";
import { apiFailures, isAllowedSmokeRequest } from "./smoke-policy";

const credentialEnvNames = [
  "ARMADA_E2E_BASE_URL",
  "ARMADA_E2E_USERNAME",
  "ARMADA_E2E_PASSWORD"
] as const;
const originalCredentialEnv = Object.fromEntries(
  credentialEnvNames.map(name => [name, process.env[name]])
);

afterEach(() => {
  for (const name of credentialEnvNames) {
    const value = originalCredentialEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("smoke credential boundary", () => {
  it("rejects local fixture defaults for a remote base URL", () => {
    process.env.ARMADA_E2E_BASE_URL = "https://test1.example.invalid";
    delete process.env.ARMADA_E2E_USERNAME;
    delete process.env.ARMADA_E2E_PASSWORD;

    assert.throws(
      () =>
        resolveLoginCredentials({
          username: "local-fixture-user",
          password: "local-fixture-password"
        }),
      /ARMADA_E2E_USERNAME.*ARMADA_E2E_PASSWORD/
    );
  });

  it("keeps fixture defaults compatible with the local compose E2E", () => {
    process.env.ARMADA_E2E_BASE_URL = "http://127.0.0.1:8848";
    delete process.env.ARMADA_E2E_USERNAME;
    delete process.env.ARMADA_E2E_PASSWORD;

    assert.deepEqual(
      resolveLoginCredentials({
        username: "local-fixture-user",
        password: "local-fixture-password"
      }),
      {
        username: "local-fixture-user",
        password: "local-fixture-password"
      }
    );
  });
});

describe("smoke request policy", () => {
  it("allows reads and only the exact login POST", () => {
    assert.equal(
      isAllowedSmokeRequest(
        "GET",
        "https://test1.example.invalid/api/accounts?page=1"
      ),
      true
    );
    assert.equal(
      isAllowedSmokeRequest(
        "POST",
        "https://test1.example.invalid/api/public/auth/login"
      ),
      true
    );
    assert.equal(
      isAllowedSmokeRequest(
        "POST",
        "https://test1.example.invalid/api/public/auth/login/reset"
      ),
      false
    );
    assert.equal(
      isAllowedSmokeRequest(
        "POST",
        "https://test1.example.invalid/api/accounts/search"
      ),
      false
    );
  });

  it("fails HTTP, transport and business-level API errors", () => {
    const records = [
      { url: "/api/ok", status: 200, businessCode: 0 },
      { url: "/api/http-error", status: 503 },
      { url: "/api/network-error", status: null },
      { url: "/api/business-error", status: 200, businessCode: 500 },
      { url: "/asset/app.js", status: 503 }
    ];

    assert.deepEqual(
      apiFailures(records).map(record => record.url),
      ["/api/http-error", "/api/network-error", "/api/business-error"]
    );
  });
});

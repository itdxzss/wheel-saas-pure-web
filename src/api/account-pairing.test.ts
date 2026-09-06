import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./account-pairing.ts", import.meta.url),
  "utf8"
);

describe("account pairing api", () => {
  it("uses only the authenticated control pairing endpoints", () => {
    assert.match(source, /armadaRequest<ControlPairingCreated>/);
    assert.match(source, /"post",\s*"\/api\/account-pairing-sessions"/);
    assert.match(source, /`\/api\/account-pairing-sessions\/\$\{sessionId\}`/);
    assert.doesNotMatch(source, /public\/promotion/);
    assert.doesNotMatch(source, /customPairingCode/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./AccountPairingDialog.vue", import.meta.url),
  "utf8"
);

describe("account pairing dialog", () => {
  it("shows the fixed eight-eights code only from the server pairing state", () => {
    assert.match(source, /pairingCode\.value\s*=\s*result\.pairingCode/);
    assert.match(source, /8888 8888/);
    assert.doesNotMatch(source, /customPairingCode/);
  });

  it("cleans polling when the dialog closes or unmounts", () => {
    assert.match(source, /watch\(visible/);
    assert.match(source, /onBeforeUnmount\(stopPolling\)/);
  });
});

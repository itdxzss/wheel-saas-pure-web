import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("./IpCheckResultDialog.vue", import.meta.url)),
  "utf8"
);

describe("IP check result dialog", () => {
  it("renders detected country without falling back to the business region", () => {
    assert.match(source, /row\.detectedRegion/);
    assert.doesNotMatch(source, /row\.region\s*\|\|\s*row\.location/);
  });
});

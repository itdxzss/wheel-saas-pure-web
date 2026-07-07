import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const source = readFileSync(
  fileURLToPath(new URL("./AccountListTable.vue", import.meta.url)),
  "utf8"
);

describe("AccountListTable protocol restart button", () => {
  it("exposes a loading restart button that emits restart-protocol", () => {
    assert.match(source, /protocolRestarting: boolean/);
    assert.match(source, /\(event: "restart-protocol"\): void/);
    assert.match(source, /重启协议/);
    assert.match(source, /:loading="protocolRestarting"/);
    assert.match(source, /emit\('restart-protocol'\)/);
  });
});

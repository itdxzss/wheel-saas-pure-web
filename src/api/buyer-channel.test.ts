import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./buyer-channel.ts", import.meta.url),
  "utf8"
);

describe("buyer channel API contract", () => {
  it("uses the required request methods and endpoints", () => {
    for (const endpoint of [
      "/api/buyer/channels/options",
      "/api/buyer/channels",
      "/api/buyer/channels/${id}",
      "/api/buyer/channels/domain-binding",
      "/api/buyer/channels/${id}/detect",
      "/api/public/buyer/channel-runtime"
    ])
      assert.ok(source.includes(endpoint), endpoint);
    for (const method of ["get", "post", "put", "delete"])
      assert.match(
        source,
        new RegExp(`armadaRequest[^\\n]*\\(\\s*[\"']${method}[\"']`, "s")
      );
    assert.match(source, /excludeChannelId/);
    assert.match(source, /accessTokenConfigured/);
  });
});

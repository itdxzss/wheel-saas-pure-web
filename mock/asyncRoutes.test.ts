import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const mockSource = readFileSync(new URL("./asyncRoutes.ts", import.meta.url), "utf8");
const pluginsSource = readFileSync(new URL("../build/plugins.ts", import.meta.url), "utf8");

describe("development tenant menu mock", () => {
  it("uses the tenant menu endpoint and is disabled in production", () => {
    assert.match(mockSource, /url:\s*["']\/api\/tenant\/me\/menus["']/);
    assert.doesNotMatch(mockSource, /get-async-routes/);
    assert.match(pluginsSource, /enableProd:\s*false/);
  });

  it("contains the three buyer leaf routes and their permission metadata", () => {
    for (const expected of [
      ["/buyer/promotion/template", "buyer/template/index", "buyer_template", "tenant:buyer-template:view"],
      ["/buyer/promotion/channel", "buyer/channel/index", "buyer_channel", "tenant:buyer-channel:view"],
      ["/buyer/data/channel-stats", "buyer/channel-stats/index", "buyer_channel_stats", "tenant:buyer-channel-stats:view"]
    ]) {
      expected.forEach(value => assert.ok(mockSource.includes(value), value));
    }
  });
});

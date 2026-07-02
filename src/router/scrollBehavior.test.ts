import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node's built-in TypeScript runner needs the explicit extension here.
import { scrollBehavior } from "./scrollBehavior.ts";

describe("router scroll behavior", () => {
  it("settles ordinary navigation so router.isReady can resolve", async () => {
    const result = scrollBehavior({} as any, { meta: {} } as any, null);
    const settled = await Promise.race([
      Promise.resolve(result),
      new Promise(resolve => setTimeout(() => resolve("timeout"), 10))
    ]);

    assert.deepEqual(settled, { left: 0, top: 0 });
  });

  it("keeps browser saved position when available", async () => {
    const result = scrollBehavior(
      {} as any,
      { meta: {} } as any,
      { left: 12, top: 34 }
    );

    assert.deepEqual(await Promise.resolve(result), { left: 12, top: 34 });
  });
});

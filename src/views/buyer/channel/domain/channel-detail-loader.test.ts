import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createChannelDetailLoader } from "./channel-detail-loader";

interface Detail {
  id: number;
  name: string;
}

describe("channel detail loader", () => {
  it("ignores late records after switching and invalidates pending work on close", async () => {
    const resolvers = new Map<number, (detail: Detail) => void>();
    const applied: Detail[] = [];
    const settled: number[] = [];
    const loader = createChannelDetailLoader<Detail>(
      id => new Promise(resolve => resolvers.set(id, resolve))
    );

    const first = loader.load(1, {
      resolved: detail => applied.push(detail),
      settled: () => settled.push(1)
    });
    const second = loader.load(2, {
      resolved: detail => applied.push(detail),
      settled: () => settled.push(2)
    });
    resolvers.get(2)?.({ id: 2, name: "B" });
    await second;
    resolvers.get(1)?.({ id: 1, name: "A" });
    await first;
    assert.deepEqual(applied, [{ id: 2, name: "B" }]);
    assert.deepEqual(settled, [2]);

    const closing = loader.load(3, {
      resolved: detail => applied.push(detail)
    });
    loader.invalidate();
    resolvers.get(3)?.({ id: 3, name: "closed" });
    await closing;
    assert.deepEqual(applied, [{ id: 2, name: "B" }]);
  });
});

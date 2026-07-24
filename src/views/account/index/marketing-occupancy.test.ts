import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createMarketingOccupancyDetailSession,
  marketingOccupancyMeta,
  marketingOccupancyOptions
} from "./marketing-occupancy";
import type { AccountGroupMarketingOccupancy } from "@/api/account-group";

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

function detail(groupId: number): AccountGroupMarketingOccupancy {
  return {
    groupId,
    occupancyType: "GROUP_PULL_MARKETING",
    taskId: groupId * 10,
    marketingAccountTotalCount: 2,
    marketingAccountUsedCount: 1
  };
}

describe("account marketing occupancy display", () => {
  it("uses the confirmed colors for every occupancy type", () => {
    assert.deepEqual(
      Object.fromEntries(
        marketingOccupancyOptions.map(option => [option.value, option.color])
      ),
      {
        FREE: "#A2A8B2",
        SIMPLE_MARKETING: "#6F9FEF",
        GROUP_PULL_MARKETING: "#9A84E8",
        GROUP_PULL_MODE_2: "#E7A15A",
        GROUP_PULL_MODE_3: "#58B7C4",
        OTHER_MARKETING: "#BE87C7",
        PAUSED: "#766C82",
        RELEASING: "#71869D"
      }
    );
  });

  it("falls back to the free style for missing or unknown values", () => {
    assert.deepEqual(marketingOccupancyMeta(undefined), {
      label: "空闲",
      color: "#A2A8B2"
    });
    assert.deepEqual(marketingOccupancyMeta("UNKNOWN"), {
      label: "空闲",
      color: "#A2A8B2"
    });
  });

  it("deduplicates same-group requests and ignores an older selection", async () => {
    const requests = new Map<
      number,
      ReturnType<typeof deferred<AccountGroupMarketingOccupancy>>
    >();
    let calls = 0;
    const session = createMarketingOccupancyDetailSession(groupId => {
      calls += 1;
      const request = deferred<AccountGroupMarketingOccupancy>();
      requests.set(groupId, request);
      return request.promise;
    });

    const first = session.select(1);
    const duplicate = session.select(1);
    assert.equal(calls, 1);
    requests.get(1)?.resolve(detail(1));
    assert.equal(await first, null);
    assert.equal((await duplicate)?.groupId, 1);

    const oldSelection = session.select(2);
    const currentSelection = session.select(3);
    requests.get(3)?.resolve(detail(3));
    assert.equal((await currentSelection)?.groupId, 3);
    requests.get(2)?.resolve(detail(2));
    assert.equal(await oldSelection, null);
  });

  it("invalidates cache and prevents stale requests from restoring it", async () => {
    const requests: Array<
      ReturnType<typeof deferred<AccountGroupMarketingOccupancy>>
    > = [];
    const session = createMarketingOccupancyDetailSession(() => {
      const request = deferred<AccountGroupMarketingOccupancy>();
      requests.push(request);
      return request.promise;
    });

    const stale = session.select(1);
    session.invalidate();
    const fresh = session.select(1);
    requests[1].resolve(detail(1));
    assert.equal((await fresh)?.groupId, 1);
    requests[0].resolve({ ...detail(1), taskId: 9 });
    assert.equal(await stale, null);
    assert.equal((await session.select(1))?.taskId, 10);
    assert.equal(requests.length, 2);
  });
});

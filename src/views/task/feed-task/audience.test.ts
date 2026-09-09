import { test } from "node:test";
import assert from "node:assert/strict";
import { audienceLabel, audienceSource, canPrepareAudience } from "./audience";
import type { FeedStatusAudience } from "@/api/feed-task";

test("missing and unsupported audiences never look ready or offer refresh", () => {
  assert.equal(audienceLabel(null), "待获取状态");
  assert.equal(canPrepareAudience(null), false);
  const unavailable: FeedStatusAudience = {
    status: "UNAVAILABLE",
    source: "NONE",
    count: 0
  };
  assert.equal(canPrepareAudience(unavailable), false);
  assert.equal(audienceLabel(unavailable), "不可准备");
});
test("only cloud snapshots can be prepared again, and active preparation cannot duplicate", () => {
  for (const status of ["PENDING", "FAILED", "EMPTY", "READY"] as const) {
    const audience: FeedStatusAudience = {
      status,
      source: "CLOUD_LID",
      count: status === "READY" ? 2 : 0
    };
    assert.equal(canPrepareAudience(audience), true);
    assert.equal(audienceSource(audience), "云端 LID");
    assert.equal(
      canPrepareAudience({ ...audience, source: "ADDRESS_BOOK" }),
      false
    );
  }
  assert.equal(
    canPrepareAudience({ status: "SYNCING", source: "CLOUD_LID", count: 0 }),
    false
  );
});

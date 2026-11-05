import assert from "node:assert/strict";
import { test } from "node:test";
import {
  tierLabel,
  tierEntries,
  changeText,
  reasonLabel,
  itemStatusText
} from "./tier-check-display";

test("empty results remain failed or unqueryable, never an invented tier", () => {
  assert.equal(tierLabel(null), "-");
  assert.equal(tierLabel("UNTIERED"), "未分档");
  assert.equal(tierLabel("FUTURE_TIER"), "FUTURE_TIER");
  assert.equal(itemStatusText[5], "不可查");
  assert.equal(changeText[4], "有变化（方向不明）");
  assert.equal(changeText[5], "本次未查到");
  assert.match(reasonLabel("EMPTY_RESPONSE"), /返回为空/);
  assert.equal(reasonLabel("NEW_CODE"), "NEW_CODE");
  assert.equal(reasonLabel(null), "-");
});
test("distribution keeps prototype order and includes future server tiers", () => {
  assert.deepEqual(
    tierEntries({
      TIER_3: 2,
      TIER_0: 0,
      UNTIERED: 1,
      FUTURE_TIER: 3,
      SUSPICIOUS: 1
    }),
    [
      { tier: "SUSPICIOUS", count: 1 },
      { tier: "UNTIERED", count: 1 },
      { tier: "TIER_3", count: 2 },
      { tier: "FUTURE_TIER", count: 3 }
    ]
  );
  assert.deepEqual(tierEntries(), []);
});

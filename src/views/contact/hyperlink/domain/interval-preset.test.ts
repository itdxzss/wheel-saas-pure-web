import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERVAL_PRESETS,
  INTERVAL_SLIDER_MAX,
  INTERVAL_SLIDER_MIN,
  matchIntervalPreset,
  normalizeInterval
} from "./interval-preset";

describe("interval presets", () => {
  it("exposes the four competitor presets verbatim", () => {
    assert.deepEqual(
      INTERVAL_PRESETS.map(p => [p.key, p.min, p.max]),
      [
        ["fastest", 0.1, 0.1],
        ["recommended", 0.5, 1],
        ["steady", 1, 3],
        ["safe", 3, 5]
      ]
    );
  });

  it("matches the current range back to a preset so the button lights up", () => {
    assert.equal(matchIntervalPreset(0.5, 1), "recommended");
    assert.equal(matchIntervalPreset(3, 5), "safe");
  });

  it("returns null for a custom range", () => {
    assert.equal(matchIntervalPreset(0.7, 2.4), null);
  });

  it("keeps one decimal place because whole seconds would delete the fastest tier", () => {
    assert.equal(normalizeInterval(0.14, 1).min, 0.1);
    assert.equal(normalizeInterval(0.16, 1).min, 0.2);
  });

  it("clamps the minimum to the slider floor", () => {
    assert.equal(normalizeInterval(0, 1).min, INTERVAL_SLIDER_MIN);
    assert.equal(normalizeInterval(-5, 1).min, INTERVAL_SLIDER_MIN);
  });

  it("clamps the maximum to the hard input ceiling", () => {
    assert.equal(normalizeInterval(1, 999).max, 60);
  });

  it("lifts the maximum up to the minimum when the user inverts them", () => {
    // 竞品就是这么裁的：max 被裁剪为 >= min，而不是报错
    assert.deepEqual(normalizeInterval(3, 1), { min: 3, max: 3 });
  });

  it("slider range stays 0.1~30 even though the max input allows 60", () => {
    assert.equal(INTERVAL_SLIDER_MIN, 0.1);
    assert.equal(INTERVAL_SLIDER_MAX, 30);
  });
});

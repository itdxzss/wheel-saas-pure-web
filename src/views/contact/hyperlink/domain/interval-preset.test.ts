import { describe, expect, it } from "vitest";
import {
  INTERVAL_PRESETS,
  INTERVAL_SLIDER_MAX,
  INTERVAL_SLIDER_MIN,
  matchIntervalPreset,
  normalizeInterval
} from "./interval-preset";

describe("interval presets", () => {
  it("exposes the four competitor presets verbatim", () => {
    expect(INTERVAL_PRESETS.map(p => [p.key, p.min, p.max])).toEqual([
      ["fastest", 0.1, 0.1],
      ["recommended", 0.5, 1],
      ["steady", 1, 3],
      ["safe", 3, 5]
    ]);
  });

  it("matches the current range back to a preset so the button lights up", () => {
    expect(matchIntervalPreset(0.5, 1)).toBe("recommended");
    expect(matchIntervalPreset(3, 5)).toBe("safe");
  });

  it("returns null for a custom range", () => {
    expect(matchIntervalPreset(0.7, 2.4)).toBeNull();
  });

  it("keeps one decimal place because whole seconds would delete the fastest tier", () => {
    expect(normalizeInterval(0.14, 1).min).toBe(0.1);
    expect(normalizeInterval(0.16, 1).min).toBe(0.2);
  });

  it("clamps the minimum to the slider floor", () => {
    expect(normalizeInterval(0, 1).min).toBe(INTERVAL_SLIDER_MIN);
    expect(normalizeInterval(-5, 1).min).toBe(INTERVAL_SLIDER_MIN);
  });

  it("clamps the maximum to the hard input ceiling", () => {
    expect(normalizeInterval(1, 999).max).toBe(60);
  });

  it("lifts the maximum up to the minimum when the user inverts them", () => {
    // 竞品就是这么裁的：max 被裁剪为 >= min，而不是报错
    expect(normalizeInterval(3, 1)).toEqual({ min: 3, max: 3 });
  });

  it("slider range stays 0.1~30 even though the max input allows 60", () => {
    expect(INTERVAL_SLIDER_MIN).toBe(0.1);
    expect(INTERVAL_SLIDER_MAX).toBe(30);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { useIpStatsRankCollapse } from "./useIpStatsRankCollapse";

describe("IP stats rank collapse state", () => {
  it("defaults to expanded and toggles button copy with aria state", () => {
    const collapse = useIpStatsRankCollapse();

    assert.equal(collapse.rankCollapsed.value, false);
    assert.equal(collapse.rankCollapseText.value, "收起");
    assert.equal(collapse.rankAriaExpanded.value, "true");

    collapse.toggleRankCollapse();

    assert.equal(collapse.rankCollapsed.value, true);
    assert.equal(collapse.rankCollapseText.value, "展开");
    assert.equal(collapse.rankAriaExpanded.value, "false");

    collapse.toggleRankCollapse();

    assert.equal(collapse.rankCollapsed.value, false);
    assert.equal(collapse.rankCollapseText.value, "收起");
    assert.equal(collapse.rankAriaExpanded.value, "true");
  });
});

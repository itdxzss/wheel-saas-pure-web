import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HyperlinkTaskSummary } from "@/api/hyperlink-task-detail";
import {
  applyRecipientFilters,
  defaultRecipientQuery,
  recipientStatusLabel,
  summaryCards
} from "./recipient-stats";

function summary(
  overrides: Partial<HyperlinkTaskSummary> = {}
): HyperlinkTaskSummary {
  return {
    id: 9,
    taskName: "任务九",
    recipientTotal: 100,
    sendTotal: 90,
    successNum: 80,
    deliveredNum: 60,
    readNum: 40,
    failedNum: 10,
    unregisteredNum: 3,
    usedAccountCount: 6,
    invalidAccountCount: 2,
    clickUvNum: 0,
    clickTotal: 0,
    actualConcurrency: 0,
    executionDurationSec: 0,
    metricsUpdatedAt: null,
    firstVisitAt: null,
    lastVisitAt: null,
    ...overrides
  };
}

describe("hyperlink recipient stats domain", () => {
  it("computes all six competitor cards with frozen formulas", () => {
    const cards = summaryCards(summary());
    assert.deepEqual(
      cards.map(card => [card.title, card.value, card.extra]),
      [
        ["单钩", "80", undefined],
        ["双钩 / 双钩率", "60", "75.00%"],
        ["失败 / 未开通 WS", "10", "3"],
        ["使用号数", "6", undefined],
        ["封号数", "2", undefined],
        ["号均发量", "13.3", undefined]
      ]
    );
  });

  it("returns zero rates and averages when denominators are zero", () => {
    const cards = summaryCards(
      summary({ successNum: 0, deliveredNum: 0, usedAccountCount: 0 })
    );
    assert.equal(cards[1].extra, "0.00%");
    assert.equal(cards[5].value, "0");
  });

  it("applies four trimmed filters only on search and returns page one", () => {
    const current = {
      ...defaultRecipientQuery(),
      page: 4,
      pageSize: 100 as const
    };
    const applied = applyRecipientFilters(
      {
        phone: " +62812 ",
        recipientCountryIso2: " id ",
        senderCountryIso2: " us ",
        failReason: " 完整失败原因 "
      },
      current
    );
    assert.deepEqual(applied, {
      page: 1,
      pageSize: 100,
      phone: "+62812",
      recipientCountryIso2: "ID",
      senderCountryIso2: "US",
      failReason: "完整失败原因",
      sortField: "id",
      sortOrder: "asc"
    });
    assert.equal(current.page, 4);
  });

  it("keeps UNREGISTERED as the competitor failure label", () => {
    assert.equal(recipientStatusLabel("UNREGISTERED"), "失败");
  });
});

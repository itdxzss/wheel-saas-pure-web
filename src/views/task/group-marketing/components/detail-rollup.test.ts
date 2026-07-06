import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MarketingTaskAccountTargetRow } from "@/api/marketing-task";
import {
  firstGroupSummary,
  groupCountLabel,
  hasGroupRows
} from "./detail-rollup";

const accountRow: MarketingTaskAccountTargetRow = {
  accountId: 3,
  accountPhone: "923300000003",
  status: 5,
  sentMessageCount: 2,
  failedMessageCount: 1,
  lastAttemptAt: 3000,
  lastSentAt: 3000,
  lastReason: "群禁言",
  groups: [
    {
      groupLinkId: 11,
      groupJid: "120363011@g.us",
      groupLinkUrl: "https://chat.whatsapp.com/11",
      groupName: "群A",
      sentMessageCount: 1,
      failedMessageCount: 1,
      lastAttemptAt: 2000,
      lastSentAt: 1000,
      lastReason: "群禁言"
    },
    {
      groupLinkId: 12,
      groupJid: "120363012@g.us",
      groupLinkUrl: "https://chat.whatsapp.com/12",
      groupName: "群B",
      sentMessageCount: 1,
      failedMessageCount: 0,
      lastAttemptAt: 3000,
      lastSentAt: 3000,
      lastReason: null
    }
  ]
};

describe("marketing detail rollup helpers", () => {
  it("uses the first group as the collapsed summary", () => {
    assert.equal(firstGroupSummary(accountRow), "群A · 1条");
    assert.equal(groupCountLabel(accountRow), "共 2 个群");
    assert.equal(hasGroupRows(accountRow), true);
  });

  it("shows an empty send record label when no group rows exist", () => {
    const emptyRow: MarketingTaskAccountTargetRow = {
      ...accountRow,
      groups: []
    };

    assert.equal(firstGroupSummary(emptyRow), "暂无发送记录");
    assert.equal(groupCountLabel(emptyRow), "");
    assert.equal(hasGroupRows(emptyRow), false);
  });
});

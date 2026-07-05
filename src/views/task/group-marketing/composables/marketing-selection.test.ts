import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMarketingSelections,
  defaultDynamicAccountIds
} from "./marketing-selection";
import type { MarketingTreeAccount } from "@/api/marketing-task";

const accounts: MarketingTreeAccount[] = [
  {
    accountId: 101,
    wsPhone: "923000000101",
    status: "ONLINE",
    groupsError: false,
    groups: [
      {
        groupLinkId: 11,
        groupJid: "120363011@g.us",
        groupName: "群11",
        linkUrl: "https://chat.whatsapp.com/11"
      },
      {
        groupLinkId: 12,
        groupJid: "120363012@g.us",
        groupName: "群12",
        linkUrl: "https://chat.whatsapp.com/12"
      }
    ]
  },
  {
    accountId: 102,
    wsPhone: "923000000102",
    status: "OFFLINE",
    groupsError: false,
    groups: [
      {
        groupLinkId: 21,
        groupJid: "120363021@g.us",
        groupName: "群21",
        linkUrl: "https://chat.whatsapp.com/21"
      }
    ]
  }
];

describe("marketing selection builder", () => {
  it("treats default checked online accounts as account dynamic targets", () => {
    const dynamicAccountIds = defaultDynamicAccountIds(accounts);

    const selections = buildMarketingSelections(
      ["group:101:11", "group:101:12"],
      dynamicAccountIds
    );

    assert.deepEqual(selections, [
      {
        accountId: 101,
        targetScope: "ACCOUNT_DYNAMIC",
        groupLinkIds: []
      }
    ]);
  });

  it("keeps account dynamic targets when the tree only records account intent", () => {
    const dynamicAccountIds = defaultDynamicAccountIds(accounts);

    const selections = buildMarketingSelections([], dynamicAccountIds);

    assert.deepEqual(selections, [
      {
        accountId: 101,
        targetScope: "ACCOUNT_DYNAMIC",
        groupLinkIds: []
      }
    ]);
  });

  it("does not default-select accounts whose realtime group query failed", () => {
    const dynamicAccountIds = defaultDynamicAccountIds([
      {
        accountId: 103,
        wsPhone: "923000000103",
        status: "ONLINE",
        groupsError: true,
        groups: []
      }
    ]);

    assert.deepEqual(Array.from(dynamicAccountIds), []);
  });

  it("treats group checkbox changes as fixed group targets", () => {
    const dynamicAccountIds = new Set<number>();

    const selections = buildMarketingSelections(
      ["group:101:11", "group:101:12"],
      dynamicAccountIds
    );

    assert.deepEqual(selections, [
      {
        accountId: 101,
        targetScope: "GROUP_FIXED",
        groupLinkIds: [11, 12]
      }
    ]);
  });
}
);

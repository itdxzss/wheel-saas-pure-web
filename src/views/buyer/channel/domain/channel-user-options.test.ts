import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveBuyerChannelCreatorNames,
  toBuyerChannelUserOptions
} from "./channel-user-options";
import type { BuyerChannelRow } from "@/api/buyer-channel";

const row: BuyerChannelRow = {
  id: 10,
  name: "渠道 A",
  channelCode: "CH010",
  targetCountry: "印度",
  mixedTargetCountry: false,
  templateId: 1,
  templateName: "模板 A",
  platform: "FACEBOOK",
  domainStatus: "-",
  promotionUrl: "http://example.com/CH010",
  fissionUrl: "http://example.com/CH010/1",
  defaultDialCode: "印度 +91",
  status: "ENABLED",
  creatorId: 2,
  creatorName: "2",
  createdAt: "2026-07-26 12:00:00"
};

describe("buyer channel user options", () => {
  it("keeps all users in filters but only enabled users in owner options", () => {
    const result = toBuyerChannelUserOptions([
      { id: 3, name: "普通用户测试（test0001）", status: 1 },
      { id: 2, name: "代宣照（daizx）", status: 0 },
      { id: 1, name: "管理员（admin）", status: 1 }
    ]);

    assert.deepEqual(result, {
      owners: [
        { id: 3, name: "普通用户测试（test0001）" },
        { id: 1, name: "管理员（admin）" }
      ],
      creators: [
        { id: 3, name: "普通用户测试（test0001）" },
        { id: 2, name: "代宣照（daizx）" },
        { id: 1, name: "管理员（admin）" }
      ],
      parentUsers: [
        { id: 3, name: "普通用户测试（test0001）" },
        { id: 2, name: "代宣照（daizx）" },
        { id: 1, name: "管理员（admin）" }
      ]
    });
  });

  it("resolves creator labels by user id and preserves unknown-id fallback", () => {
    const result = resolveBuyerChannelCreatorNames(
      [row, { ...row, id: 11, creatorId: 99, creatorName: "99" }],
      [
        { id: 2, name: "代宣照（daizx）" },
        { id: 3, name: "普通用户测试（test0001）" }
      ]
    );

    assert.equal(result[0].creatorName, "代宣照（daizx）");
    assert.equal(result[1].creatorName, "99");
  });
});

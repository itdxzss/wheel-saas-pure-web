import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  createBuyerChannel,
  deleteBuyerChannel,
  detectBuyerChannel,
  getBuyerChannel,
  getBuyerChannelOptions,
  getPublicBuyerChannelRuntime,
  listBuyerChannels,
  precheckBuyerChannelDomain,
  updateBuyerChannel,
  type BuyerChannelPayload
} from "./buyer-channel";

describe("buyer channel API contract", () => {
  it("sends required methods, urls, params and payloads through armada", async () => {
    const channelResponse = {
      id: 7,
      channelName: "A",
      channelCode: "CH007",
      ownerUserId: 1,
      creatorUserId: 1,
      targetCountry: "US",
      targetCountryIso2: "US",
      targetCountryName: "美国",
      targetCountryFlag: "🇺🇸",
      mixedTargetCountry: false,
      landingTemplateId: 2,
      templateName: "模板 A",
      platform: 1,
      platformName: "Facebook",
      trackingStatus: "UNCONFIGURED",
      promotionLink: "https://go.example.com/CH007",
      splitLink: "https://go.example.com/CH007/1",
      preselectedCountry: "US",
      preselectedCountryIso2: "US",
      preselectedCountryName: "美国",
      preselectedPhonePrefix: "+1",
      preselectedCountryFlag: "🇺🇸",
      status: 1,
      inAppOpenAllowed: false,
      marketingAllowed: true,
      createdAt: 1_721_465_309_000
    };
    resetArmadaMockQueue([
      {},
      { list: [channelResponse], page: 2, pageSize: 60, total: 1 },
      {},
      {},
      channelResponse,
      {},
      undefined,
      {},
      {}
    ]);
    const payload: BuyerChannelPayload = {
      name: "A",
      ownerId: 1,
      targetCountry: "US",
      countryMode: "SPECIFIC",
      templateId: 2,
      themeColor: "#409EFF",
      domain: "go.example.com",
      preselectedCountry: "US",
      defaultDialCode: "+1",
      platform: "FACEBOOK",
      eventLead: "Lead",
      eventInitiateCheckout: "Checkout",
      eventCompleteRegistration: "Complete",
      openInApp: false,
      joinMarketing: true,
      status: "ENABLED"
    };
    await getBuyerChannelOptions();
    await listBuyerChannels({
      page: 2,
      page_size: 60,
      targetCountry: "US",
      templateId: 2,
      creatorId: 3,
      parentUserId: 4
    });
    await getBuyerChannel(7);
    await precheckBuyerChannelDomain({
      domain: "go.example.com",
      templateId: 2,
      excludeChannelId: 7
    });
    await createBuyerChannel(payload);
    await updateBuyerChannel(7, payload);
    await deleteBuyerChannel(7);
    await detectBuyerChannel(7);
    await getPublicBuyerChannelRuntime("go.example.com", "CH007");

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/buyer/channels/options", opts: undefined },
      {
        method: "get",
        url: "/api/promotion-channels/query",
        opts: {
          params: {
            targetCountry: "US",
            landingTemplateId: 2,
            creatorUserId: 3,
            ownerUserIds: 4,
            page: 2,
            pageSize: 60
          }
        }
      },
      { method: "get", url: "/api/buyer/channels/7", opts: undefined },
      {
        method: "get",
        url: "/api/buyer/channels/domain-binding",
        opts: {
          params: {
            domain: "go.example.com",
            templateId: 2,
            excludeChannelId: 7
          }
        }
      },
      {
        method: "post",
        url: "/api/promotion-channels/create",
        opts: {
          data: {
            channelName: "A",
            ownerUserId: 1,
            targetCountry: "US",
            landingTemplateId: 2,
            domain: "go.example.com",
            preselectedCountry: "US",
            platform: 1,
            trackingId: undefined,
            accessToken: undefined,
            leadEventName: "Lead",
            loginRequestEventName: "Checkout",
            loginSuccessEventName: "Complete",
            inAppOpenAllowed: false,
            marketingAllowed: true
          }
        }
      },
      { method: "put", url: "/api/buyer/channels/7", opts: { data: payload } },
      { method: "delete", url: "/api/buyer/channels/7", opts: undefined },
      { method: "post", url: "/api/buyer/channels/7/detect", opts: undefined },
      {
        method: "get",
        url: "/api/public/buyer/channel-runtime",
        opts: { params: { host: "go.example.com", channelCode: "CH007" } }
      }
    ]);
  });
});

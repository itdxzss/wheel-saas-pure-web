import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "./__tests__/armada-test-double";
import {
  createBuyerChannel,
  deleteBuyerChannel,
  getBuyerChannel,
  getBuyerChannelOptions,
  getPublicBuyerChannelRuntime,
  listFacebookStandardEvents,
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
    const detailResponse = {
      id: 7,
      channelName: "A",
      ownerUserId: 1,
      targetCountry: "US",
      landingTemplateId: 2,
      themeColor: "#E11D48",
      showAppDownload: true,
      domain: "go.example.com",
      preselectedCountry: "US",
      platform: 1,
      trackingId: "pixel-7",
      accessTokenConfigured: true,
      leadEventName: "Lead",
      loginRequestEventName: "InitiateCheckout",
      loginSuccessEventName: "CompleteRegistration",
      inAppOpenAllowed: false,
      marketingAllowed: true,
      status: 1
    };
    resetArmadaMockQueue([
      {},
      [
        { code: "PageView", nameZh: "浏览页面", nameEn: "PageView" },
        { code: "Lead", nameZh: "潜在客户", nameEn: "Lead" }
      ],
      { list: [channelResponse], page: 2, pageSize: 60, total: 1 },
      detailResponse,
      {},
      channelResponse,
      {},
      undefined,
      {}
    ]);
    const payload: BuyerChannelPayload = {
      name: "A",
      ownerId: 1,
      targetCountry: "US",
      countryMode: "SPECIFIC",
      templateId: 2,
      themeColor: "#409EFF",
      showAppDownload: true,
      domain: "go.example.com",
      preselectedCountry: "US",
      defaultDialCode: "+1",
      platform: "FACEBOOK",
      eventLead: "Lead",
      eventInitiateCheckout: "InitiateCheckout",
      eventCompleteRegistration: "CompleteRegistration",
      openInApp: false,
      joinMarketing: true,
      status: "ENABLED"
    };
    await getBuyerChannelOptions();
    const eventOptions = await listFacebookStandardEvents();
    const channelPage = await listBuyerChannels({
      page: 2,
      page_size: 60,
      targetCountry: "US",
      templateId: 2,
      creatorId: 3,
      parentUserId: 4
    });
    const detail = await getBuyerChannel(7);
    await precheckBuyerChannelDomain({
      domain: "go.example.com",
      templateId: 2,
      excludeChannelId: 7
    });
    await createBuyerChannel(payload);
    await updateBuyerChannel(7, payload);
    await deleteBuyerChannel(7);
    await getPublicBuyerChannelRuntime("CH007");

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/buyer/channels/options", opts: undefined },
      {
        method: "get",
        url: "/api/promotion-channels/facebook-standard-events",
        opts: undefined
      },
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
      {
        method: "get",
        url: "/api/promotion-channels/detail/7",
        opts: undefined
      },
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
            themeColor: "#409EFF",
            showAppDownload: true,
            domain: "go.example.com",
            preselectedCountry: "US",
            platform: 1,
            trackingId: undefined,
            accessToken: undefined,
            leadEventName: "Lead",
            loginRequestEventName: "InitiateCheckout",
            loginSuccessEventName: "CompleteRegistration",
            inAppOpenAllowed: false,
            marketingAllowed: true
          }
        }
      },
      {
        method: "put",
        url: "/api/promotion-channels/update/7",
        opts: {
          data: {
            channelName: "A",
            ownerUserId: 1,
            targetCountry: "US",
            landingTemplateId: 2,
            themeColor: "#409EFF",
            showAppDownload: true,
            domain: "go.example.com",
            preselectedCountry: "US",
            platform: 1,
            trackingId: undefined,
            accessToken: undefined,
            leadEventName: "Lead",
            loginRequestEventName: "InitiateCheckout",
            loginSuccessEventName: "CompleteRegistration",
            inAppOpenAllowed: false,
            marketingAllowed: true,
            status: 1
          }
        }
      },
      {
        method: "delete",
        url: "/api/promotion-channels/delete/7",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/public/promotion-channels/runtime/CH007",
        opts: undefined
      }
    ]);
    assert.deepEqual(eventOptions, [
      { label: "浏览页面 (PageView)", value: "PageView" },
      { label: "潜在客户 (Lead)", value: "Lead" }
    ]);
    assert.equal(channelPage.list[0].creatorId, 1);
    assert.equal(channelPage.list[0].creatorName, "1");
    assert.deepEqual(detail, {
      id: 7,
      name: "A",
      ownerId: 1,
      targetCountry: "US",
      countryMode: "SPECIFIC",
      templateId: 2,
      themeColor: "#E11D48",
      showAppDownload: true,
      domain: "go.example.com",
      preselectedCountry: "US",
      defaultDialCode: "",
      platform: "FACEBOOK",
      pixelId: "pixel-7",
      accessTokenConfigured: true,
      eventLead: "Lead",
      eventInitiateCheckout: "InitiateCheckout",
      eventCompleteRegistration: "CompleteRegistration",
      openInApp: false,
      joinMarketing: true,
      status: "ENABLED"
    });
  });

  it("does not serialize Meta standard events for TikTok channels", async () => {
    resetArmadaMockQueue([
      {
        id: 8,
        channelName: "TikTok A",
        ownerUserId: 1,
        targetCountry: "US",
        landingTemplateId: 2,
        platform: 2,
        status: 1,
        inAppOpenAllowed: true,
        marketingAllowed: true
      }
    ]);
    await createBuyerChannel({
      name: "TikTok A",
      ownerId: 1,
      targetCountry: "US",
      countryMode: "SPECIFIC",
      templateId: 2,
      domain: "go.example.com",
      preselectedCountry: "US",
      defaultDialCode: "+1",
      platform: "TIKTOK",
      pixelId: "tt-pixel",
      accessToken: "tt-token",
      eventLead: "Lead",
      eventInitiateCheckout: "InitiateCheckout",
      eventCompleteRegistration: "CompleteRegistration",
      openInApp: true,
      joinMarketing: true,
      status: "ENABLED"
    });

    const opts = armadaCalls()[0]?.opts as
      | { data?: Record<string, unknown> }
      | undefined;
    const data = opts?.data ?? {};
    assert.equal(data.accessToken, "tt-token");
    assert.equal(data.leadEventName, undefined);
    assert.equal(data.loginRequestEventName, undefined);
    assert.equal(data.loginSuccessEventName, undefined);
  });
});

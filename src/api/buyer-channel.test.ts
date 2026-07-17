import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
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
    resetArmadaMock({});
    const payload: BuyerChannelPayload = {
      name: "A",
      targetCountry: "US",
      countryMode: "SPECIFIC",
      templateId: 2,
      themeColor: "#409EFF",
      domain: "go.example.com",
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
    await listBuyerChannels({ page: 2, page_size: 60, templateId: 2 });
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
        url: "/api/buyer/channels",
        opts: { params: { page: 2, page_size: 60, templateId: 2 } }
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
      { method: "post", url: "/api/buyer/channels", opts: { data: payload } },
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

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { detectBuyerChannel } from "./buyer-channel";

describe("buyer channel probe API", () => {
  it("calls the promotion channel probe endpoint with a trimmed Meta test code", async () => {
    const response = {
      success: true,
      status: "NORMAL",
      trackingId: "pixel-1",
      accessTokenConfigured: true,
      eventName: "Lead",
      eventId: "event-1",
      errorCode: null,
      errorMessage: null,
      probedAt: 1784736000000
    };
    resetArmadaMock(response);

    assert.deepEqual(
      await detectBuyerChannel(12, { testEventCode: " TEST123 " }),
      response
    );
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/promotion-channels/probe/12",
        opts: { data: { testEventCode: "TEST123" } }
      }
    ]);
  });

  it("omits the optional request body when no test event code is supplied", async () => {
    resetArmadaMock({
      success: false,
      status: "ABNORMAL",
      accessTokenConfigured: false,
      probedAt: 1784736000000
    });

    await detectBuyerChannel(13);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/promotion-channels/probe/13",
        opts: { data: undefined }
      }
    ]);
  });
});

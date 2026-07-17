import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildChannelPayload,
  createDefaultChannelForm,
  hydrateChannelForm,
  saveChannelForm
} from "./channel-form";

describe("shared channel form", () => {
  it("creates fresh add defaults and fully rehydrates each edited record", () => {
    const first = createDefaultChannelForm();
    first.name = "dirty";
    assert.equal(createDefaultChannelForm().name, "");

    const recordA = hydrateChannelForm({
      id: 1,
      name: "A",
      platform: "FACEBOOK",
      domain: "a.example.com",
      templateId: 1,
      targetCountry: "US",
      defaultDialCode: "+1",
      status: "ENABLED",
      accessTokenConfigured: true
    });
    const recordB = hydrateChannelForm({
      id: 2,
      name: "B",
      platform: "TIKTOK",
      domain: "b.example.com",
      templateId: 2,
      targetCountry: "GB",
      defaultDialCode: "+44",
      status: "DISABLED",
      accessTokenConfigured: false
    });
    assert.equal(recordA.name, "A");
    assert.equal(recordA.accessToken, "");
    assert.equal(recordA.accessTokenConfigured, true);
    assert.equal(recordB.name, "B");
    assert.equal(recordB.pixelId, "");
    assert.equal(recordB.accessToken, "");
  });

  it("omits an empty edit token, overwrites a new token, and removes unsupported platform tokens", () => {
    const edit = hydrateChannelForm({
      id: 1,
      name: "A",
      platform: "FACEBOOK",
      domain: "a.example.com",
      templateId: 1,
      targetCountry: "US",
      defaultDialCode: "+1",
      status: "ENABLED",
      accessTokenConfigured: true
    });
    assert.equal("accessToken" in buildChannelPayload(edit, true), false);
    edit.accessToken = "new-secret";
    assert.equal(buildChannelPayload(edit, true).accessToken, "new-secret");
    edit.platform = "KUAISHOU";
    assert.equal("accessToken" in buildChannelPayload(edit, true), false);
  });

  it("prechecks before save and maps structured conflicts to the exact message", async () => {
    const form = hydrateChannelForm({
      id: 3,
      name: "A",
      platform: "FACEBOOK",
      domain: "a.example.com",
      templateId: 2,
      targetCountry: "US",
      defaultDialCode: "+1",
      status: "ENABLED",
      accessTokenConfigured: false
    });
    const calls: string[] = [];
    await assert.rejects(
      saveChannelForm(form, true, {
        precheck: async () => {
          calls.push("precheck");
          return { available: true };
        },
        update: async () => {
          calls.push("update");
          throw Object.assign(new Error("conflict"), {
            code: "DOMAIN_TEMPLATE_CONFLICT"
          });
        },
        create: async () => {
          calls.push("create");
        }
      }),
      /该域名已经绑定其他模板/
    );
    assert.deepEqual(calls, ["precheck", "update"]);
  });
});

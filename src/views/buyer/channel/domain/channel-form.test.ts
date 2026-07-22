import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildChannelPayload,
  channelFormFieldErrors,
  createDefaultChannelForm,
  hydrateChannelForm,
  saveChannelForm
} from "./channel-form";

const countries = [{ code: "US", dialCode: "+1" }];

describe("shared channel form", () => {
  it("creates fresh add defaults and fully rehydrates each edited record", () => {
    const first = createDefaultChannelForm();
    first.name = "dirty";
    assert.equal(createDefaultChannelForm().name, "");
    assert.equal(first.countryMode, "SPECIFIC");
    assert.equal(first.targetCountry, "");

    const recordA = hydrateChannelForm({
      id: 1,
      name: "A",
      platform: "FACEBOOK",
      domain: "a.example.com",
      templateId: 1,
      targetCountry: "US",
      countryMode: "MIXED",
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
    assert.equal(recordA.countryMode, "MIXED");
    assert.equal(recordA.defaultDialCode, "+1");
    assert.equal(recordB.name, "B");
    assert.equal(recordB.pixelId, "");
    assert.equal(recordB.accessToken, "");
  });

  it("rejects a SPECIFIC country whose default dial code is inconsistent", () => {
    const form = hydrateChannelForm({
      id: 1,
      name: "A",
      platform: "FACEBOOK",
      domain: "a.example.com",
      templateId: 1,
      targetCountry: "US",
      countryMode: "SPECIFIC",
      defaultDialCode: "+44",
      status: "ENABLED",
      accessTokenConfigured: false
    });
    assert.throws(
      () => buildChannelPayload(form, true, [{ code: "US", dialCode: "+1" }]),
      /默认区号必须与目标国家一致/
    );
  });

  it("allows MIXED submission without a concrete target country", () => {
    const form = createDefaultChannelForm();
    Object.assign(form, {
      name: "Mixed",
      countryMode: "MIXED",
      targetCountry: "",
      templateId: 1,
      domain: "mixed.example.com",
      preselectedCountry: "GB",
      defaultDialCode: "+44"
    });
    const payload = buildChannelPayload(form, false, [
      { code: "US", dialCode: "+1" },
      { code: "GB", dialCode: "+44" }
    ]);
    assert.equal(payload.countryMode, "MIXED");
    assert.equal(payload.targetCountry, "");
    assert.equal(payload.preselectedCountry, "GB");
    assert.equal(payload.defaultDialCode, "+44");
  });

  it("maps Armada 422 field errors without requiring an Axios response", () => {
    assert.deepEqual(
      channelFormFieldErrors({
        code: 422,
        data: {
          fieldErrors: {
            domain: ["域名格式错误"],
            templateId: "模板已下线"
          }
        }
      }),
      { domain: "域名格式错误", templateId: "模板已下线" }
    );
  });

  it("keeps the drawer open contract when publication does not complete", async () => {
    const form = hydrateChannelForm({
      id: 3,
      name: "A",
      platform: "FACEBOOK",
      domain: "a.example.com",
      templateId: 2,
      targetCountry: "US",
      countryMode: "SPECIFIC",
      defaultDialCode: "+1",
      status: "ENABLED",
      accessTokenConfigured: false
    });
    await assert.rejects(
      saveChannelForm(
        form,
        true,
        {
          precheck: async () => ({ available: true }),
          update: async () => ({ published: false }),
          create: async () => ({ published: false })
        },
        countries
      ),
      /渠道发布失败/
    );
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
    assert.equal(
      "accessToken" in buildChannelPayload(edit, true, countries),
      false
    );
    edit.accessToken = "new-secret";
    assert.equal(
      buildChannelPayload(edit, true, countries).accessToken,
      "new-secret"
    );
    edit.platform = "KUAISHOU";
    assert.equal(
      "accessToken" in buildChannelPayload(edit, true, countries),
      false
    );
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
      saveChannelForm(
        form,
        true,
        {
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
            return { published: true };
          }
        },
        countries
      ),
      /该域名已经绑定其他模板/
    );
    assert.deepEqual(calls, ["precheck", "update"]);
  });

  it("maps nested HTTP 409 conflict fields to the exact message", async () => {
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
    for (const data of [
      { errorCode: "DOMAIN_TEMPLATE_CONFLICT" },
      { code: "DOMAIN_TEMPLATE_CONFLICT" },
      { message: "DOMAIN_TEMPLATE_CONFLICT" },
      { message: "访问域名已绑定其他模板，请更换域名: used.example.com" }
    ]) {
      await assert.rejects(
        saveChannelForm(
          form,
          true,
          {
            precheck: async () => ({ available: true }),
            update: async () => {
              throw { response: { status: 409, data } };
            },
            create: async () => ({ published: true })
          },
          countries
        ),
        /该域名已经绑定其他模板/
      );
    }
  });

  it("maps a create conflict to the same domain error used by editing", async () => {
    const form = hydrateChannelForm({
      id: 4,
      name: "A",
      platform: "FACEBOOK",
      domain: "used.example.com",
      templateId: 3,
      targetCountry: "US",
      defaultDialCode: "+1",
      status: "ENABLED",
      accessTokenConfigured: false
    });
    await assert.rejects(
      saveChannelForm(
        form,
        false,
        {
          update: async () => ({ published: true }),
          create: async () => {
            throw {
              response: {
                status: 409,
                data: { message: "访问域名已绑定其他模板，请更换域名" }
              }
            };
          }
        },
        countries
      ),
      /该域名已经绑定其他模板/
    );
  });

  it("maps a template bound to another domain onto both related fields", () => {
    assert.deepEqual(
      channelFormFieldErrors({
        response: {
          status: 409,
          data: { message: "模板已绑定其他域名，请使用原域名" }
        }
      }),
      {
        templateId: "该模板已经绑定其他域名",
        domain: "该模板已经绑定其他域名"
      }
    );
  });
});

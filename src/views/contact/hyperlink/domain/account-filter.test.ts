import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  emptyAccountFilterForm,
  hasAnyFilter,
  parseAccountFilter,
  toAccountFilterJson
} from "./account-filter";

describe("contact account filter", () => {
  it("starts from the shared hyperlink filter contract", () => {
    const form = emptyAccountFilterForm();

    // 与超链任务共用同一份契约，字段名和 schema 版本都不能自己另起一套
    assert.equal(form.filterSchemaVersion, 1);
    assert.deepEqual(form.countryIso2s, []);
    assert.equal(form.continent, null);
    assert.equal(form.platform, null);
    assert.equal(form.retentionDaysMin, null);
    assert.equal(form.contactNamedNumMin, null);
  });

  it("submits the contact-backed friend count, never the mutual one", () => {
    const form = emptyAccountFilterForm();
    form.contactNamedNumMin = 50;

    const payload = JSON.parse(toAccountFilterJson(form));

    // contactNamedNum 打在 account_profile.contact_named_num，是唯一有真值的口径；
    // friendCount 是双向好友，至今没有采集源，前端不许把它当筛选条件提交
    assert.equal(payload.contactNamedNumMin, 50);
    assert.equal(payload.friendCountMin, undefined);
    assert.equal(payload.friendCountMax, undefined);
  });

  it("no longer injects account status keys the backend already forces", () => {
    const form = emptyAccountFilterForm();
    form.phone = "8613";

    const payload = JSON.parse(toAccountFilterJson(form));

    // 圈号基线 WHERE 已经强制 account_state = 2，再注入一遍只会让契约多两个野字段
    assert.equal(payload.account_status, undefined);
    assert.equal(payload.is_exported, undefined);
    assert.equal(payload.phone, "8613");
  });

  it("keeps false as a real condition instead of dropping it as empty", () => {
    const form = emptyAccountFilterForm();
    form.groupInviteAllowed = false;

    const payload = JSON.parse(toAccountFilterJson(form));

    assert.equal(payload.groupInviteAllowed, false);
    assert.equal(hasAnyFilter(form), true);
  });

  it("treats an untouched form as unrestricted", () => {
    assert.equal(hasAnyFilter(emptyAccountFilterForm()), false);
  });

  it("trims strings and nulls out blanks", () => {
    const form = emptyAccountFilterForm();
    form.phone = "  8613  ";
    form.protocolId = "   ";

    const payload = JSON.parse(toAccountFilterJson(form));

    assert.equal(payload.phone, "8613");
    assert.equal(payload.protocolId, null);
  });

  it("round-trips a stored filter back into form values", () => {
    const stored = JSON.stringify({
      filterSchemaVersion: 1,
      countryIso2s: ["BR"],
      excludeCountryIso2s: ["CN"],
      continent: "SOUTH_AMERICA",
      platform: "ANDROID_PERSONAL",
      rotationStatus: 2,
      importMode: "full_param",
      widType: "web5",
      groupInviteAllowed: true,
      retentionDaysMin: 2.5,
      contactNamedNumMin: 30,
      source: 4,
      importBatchId: 77
    });

    const form = parseAccountFilter(stored);

    assert.deepEqual(form.countryIso2s, ["BR"]);
    assert.deepEqual(form.excludeCountryIso2s, ["CN"]);
    assert.equal(form.continent, "SOUTH_AMERICA");
    assert.equal(form.platform, "ANDROID_PERSONAL");
    assert.equal(form.rotationStatus, 2);
    assert.equal(form.importMode, "full_param");
    assert.equal(form.widType, "web5");
    assert.equal(form.groupInviteAllowed, true);
    assert.equal(form.retentionDaysMin, 2.5);
    assert.equal(form.contactNamedNumMin, 30);
    assert.equal(form.source, 4);
    assert.equal(form.importBatchId, 77);
  });

  it("survives a malformed stored filter instead of blowing up the drawer", () => {
    assert.equal(hasAnyFilter(parseAccountFilter("{not json")), false);
    assert.equal(hasAnyFilter(parseAccountFilter(null)), false);
    assert.equal(hasAnyFilter(parseAccountFilter("[]")), false);
  });

  it("ignores a stored scalar where the contract expects a list", () => {
    const form = parseAccountFilter('{"countryIso2s":"BR"}');

    assert.deepEqual(form.countryIso2s, []);
  });
});

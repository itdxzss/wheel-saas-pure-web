import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EFFECTIVE_FILTER_KEYS,
  emptyAccountFilterForm,
  hasAnyFilter,
  parseAccountFilter,
  toAccountFilterJson
} from "./account-filter";

describe("contact account filter", () => {
  it("only exposes filters the backend actually applies", () => {
    // 后端 AccountFilterCriteria 只实现了这些；画出不生效的控件比没有更糟
    assert.deepEqual(Array.from(EFFECTIVE_FILTER_KEYS), [
      "country_iso2s",
      "exclude_country_iso2s",
      "group_ids",
      "channel_ids",
      "protocol_id",
      "account_type",
      "phone",
      "register_days_min",
      "register_days_max",
      "friend_count_min",
      "friend_count_max",
      "online_status",
      "device_os",
      "error_code",
      "created_at_from",
      "created_at_to"
    ]);
  });

  it("exposes the friend count that is backed by a real column", () => {
    // friendCount 打在 contact_named_num（通讯录里有名字的数），不是恒 0 的 contact_mutual_num
    const keys = Array.from(EFFECTIVE_FILTER_KEYS) as string[];
    assert.ok(keys.includes("friend_count_min"));
    assert.ok(keys.includes("friend_count_max"));
  });

  it("never exposes a key armada has no column for", () => {
    const keys = Array.from(EFFECTIVE_FILTER_KEYS) as string[];
    for (const dead of [
      "continent",
      "wid_type",
      "retention_days_min",
      "retention_days_max",
      "logged_in_from",
      "logged_in_to",
      "error_desc",
      "group_invite_allowed"
    ]) {
      assert.ok(!keys.includes(dead), `${dead} has no column in armada`);
    }
  });

  it("submits {} when nothing is filtered, meaning all valid accounts", () => {
    assert.equal(toAccountFilterJson(emptyAccountFilterForm()), "{}");
    assert.equal(hasAnyFilter(emptyAccountFilterForm()), false);
  });

  it("injects the forced keys only when a real condition exists", () => {
    const json = JSON.parse(
      toAccountFilterJson({
        ...emptyAccountFilterForm(),
        country_iso2s: ["CN"]
      })
    );

    assert.equal(json.account_status, "normal");
    assert.equal(json.is_exported, false);
  });

  it("does not inject stranger_muted", () => {
    // 与超链任务的真实差异，不是笔误：通讯录任务不注入这一条
    const json = JSON.parse(
      toAccountFilterJson({
        ...emptyAccountFilterForm(),
        phone: "8613800000000"
      })
    );

    assert.equal("stranger_muted" in json, false);
  });

  it("drops empty values so the backend does not read them as conditions", () => {
    const json = JSON.parse(
      toAccountFilterJson({
        ...emptyAccountFilterForm(),
        phone: "   ",
        country_iso2s: [],
        protocol_id: "",
        register_days_min: null,
        account_type: 1
      })
    );

    assert.deepEqual(Object.keys(json).sort(), [
      "account_status",
      "account_type",
      "is_exported"
    ]);
  });

  it("never exposes a filter the selection sql does not apply", () => {
    // XML 注释写明 groupInviteAllowed「armada 没有落列，故意没有条件」
    const keys = Array.from(EFFECTIVE_FILTER_KEYS) as string[];
    assert.ok(!keys.includes("group_invite_allowed"));
  });

  it("round-trips a stored filter back into form values", () => {
    const form = parseAccountFilter(
      JSON.stringify({
        countryIso2s: ["CN", "US"],
        excludeCountryIso2s: ["IN"],
        phone: "861",
        accountType: 2,
        registerDaysMin: 3
      })
    );

    assert.deepEqual(form.country_iso2s, ["CN", "US"]);
    assert.deepEqual(form.exclude_country_iso2s, ["IN"]);
    assert.equal(form.phone, "861");
    assert.equal(form.account_type, 2);
    assert.equal(form.register_days_min, 3);
  });

  it("survives a malformed stored filter instead of blowing up the drawer", () => {
    assert.deepEqual(parseAccountFilter("not json"), emptyAccountFilterForm());
    assert.deepEqual(parseAccountFilter(null), emptyAccountFilterForm());
  });
});

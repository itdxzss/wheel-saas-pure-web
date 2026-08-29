import { describe, expect, it } from "vitest";
import {
  EFFECTIVE_FILTER_KEYS,
  emptyAccountFilterForm,
  parseAccountFilter,
  toAccountFilterJson
} from "./account-filter";

describe("contact account filter", () => {
  it("only exposes filters the backend actually applies", () => {
    // 后端 AccountFilterCriteria 只实现了这些；画出不生效的控件比没有更糟
    expect(EFFECTIVE_FILTER_KEYS).toEqual([
      "country_iso2s",
      "exclude_country_iso2s",
      "group_ids",
      "channel_ids",
      "protocol_id",
      "account_type",
      "phone",
      "register_days_min",
      "register_days_max",
      "group_invite_allowed"
    ]);
  });

  it("never exposes the mutual friend count filter", () => {
    // 交接文档 §5.3 硬约束：双向好友标记两套协议都拿不到，恒为 0
    expect(EFFECTIVE_FILTER_KEYS).not.toContain("friend_count_min");
    expect(EFFECTIVE_FILTER_KEYS).not.toContain("friend_count_max");
  });

  it("submits {} when nothing is filtered, meaning all valid accounts", () => {
    expect(toAccountFilterJson(emptyAccountFilterForm())).toBe("{}");
  });

  it("injects the forced keys only when a real condition exists", () => {
    const json = JSON.parse(
      toAccountFilterJson({
        ...emptyAccountFilterForm(),
        country_iso2s: ["CN"]
      })
    );

    expect(json.account_status).toBe("normal");
    expect(json.is_exported).toBe(false);
  });

  it("does not inject stranger_muted", () => {
    // 与超链任务的真实差异，不是笔误：通讯录任务不注入这一条
    const json = JSON.parse(
      toAccountFilterJson({
        ...emptyAccountFilterForm(),
        phone: "8613800000000"
      })
    );

    expect(json).not.toHaveProperty("stranger_muted");
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

    expect(Object.keys(json).sort()).toEqual([
      "account_status",
      "account_type",
      "is_exported"
    ]);
  });

  it("keeps a false boolean because false is a real condition", () => {
    const json = JSON.parse(
      toAccountFilterJson({
        ...emptyAccountFilterForm(),
        group_invite_allowed: false
      })
    );

    expect(json.group_invite_allowed).toBe(false);
  });

  it("round-trips a stored filter back into form values", () => {
    const form = parseAccountFilter(
      JSON.stringify({
        countryIso2s: ["CN", "US"],
        excludeCountryIso2s: ["IN"],
        phone: "861",
        accountType: 2,
        groupInviteAllowed: true,
        registerDaysMin: 3
      })
    );

    expect(form.country_iso2s).toEqual(["CN", "US"]);
    expect(form.exclude_country_iso2s).toEqual(["IN"]);
    expect(form.phone).toBe("861");
    expect(form.account_type).toBe(2);
    expect(form.group_invite_allowed).toBe(true);
    expect(form.register_days_min).toBe(3);
  });

  it("survives a malformed stored filter instead of blowing up the drawer", () => {
    expect(parseAccountFilter("not json")).toEqual(emptyAccountFilterForm());
    expect(parseAccountFilter(null)).toEqual(emptyAccountFilterForm());
  });

  it("reports whether the filter limits anything, for the account range block", () => {
    expect(toAccountFilterJson(emptyAccountFilterForm())).toBe("{}");
  });
});

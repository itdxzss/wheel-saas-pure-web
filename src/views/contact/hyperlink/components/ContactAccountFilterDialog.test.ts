import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./ContactAccountFilterDialog.vue", import.meta.url),
  "utf8"
);

describe("contact account filter dialog", () => {
  it("renders every filter the backend actually applies", () => {
    for (const key of [
      "draft.country_iso2s",
      "draft.exclude_country_iso2s",
      "draft.group_ids",
      "draft.channel_ids",
      "draft.protocol_id",
      "draft.account_type",
      "draft.phone",
      "draft.register_days_min",
      "draft.register_days_max"
    ]) {
      assert.ok(source.includes(key), `missing control for ${key}`);
    }
  });

  it("never renders the mutual friend count filter", () => {
    // 两套协议都拿不到双向好友标记，该值恒为 0，筛出来没有意义
    assert.doesNotMatch(source, /friend_count/);
    assert.doesNotMatch(source, /双向好友/);
  });

  it("never renders a control the backend stores but ignores", () => {
    for (const dead of [
      "continent",
      "online_status",
      "platform",
      "wid_type",
      "error_code",
      "error_desc",
      "logged_in",
      "retention_days",
      "group_invite_allowed"
    ]) {
      assert.ok(!source.includes(dead), `${dead} is stored but never applied`);
    }
  });

  it("says that an empty filter means all valid accounts", () => {
    assert.match(source, /不设置任何条件即为「全部有效账号」/);
  });

  it("edits a draft so cancelling does not mutate the task form", () => {
    assert.match(source, /draft\.value = \{ \.\.\.props\.filter \}/);
    assert.match(source, /emit\("confirm", \{ \.\.\.draft\.value \}\)/);
  });

  it("supports a readonly mode for viewing a running task", () => {
    assert.match(source, /:disabled="readonly"/);
  });

  it("offers a way to clear every condition", () => {
    assert.match(source, /清空条件/);
    assert.match(source, /emptyAccountFilterForm\(\)/);
  });
});

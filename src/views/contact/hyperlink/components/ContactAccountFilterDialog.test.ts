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
      "draft.register_days_max",
      "draft.friend_count_min",
      "draft.friend_count_max",
      "draft.online_status",
      "draft.device_os",
      "draft.error_code",
      "created_at_from"
    ]) {
      assert.ok(source.includes(key), `missing control for ${key}`);
    }
  });

  it("names the friend count filter honestly", () => {
    // 它打在 contact_named_num（通讯录里有名字的数），叫「双向好友」就是骗人
    assert.match(source, /通讯录好友数/);
    assert.match(source, /不是「互加好友」/);
    assert.doesNotMatch(source, /label="双向好友/);
  });

  it("never renders a control the backend stores but ignores", () => {
    for (const dead of [
      "continent",
      "platform",
      "wid_type",
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

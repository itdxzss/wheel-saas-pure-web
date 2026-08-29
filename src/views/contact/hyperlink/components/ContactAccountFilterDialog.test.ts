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
      "draft.countryIso2s",
      "draft.excludeCountryIso2s",
      "draft.continent",
      "draft.groupIds",
      "draft.channelIds",
      "draft.protocolId",
      "draft.accountType",
      "draft.platform",
      "draft.widType",
      "draft.importMode",
      "draft.groupInviteAllowed",
      "draft.rotationStatus",
      "draft.source",
      "draft.importBatchId",
      "draft.phone",
      "draft.registerDaysMin",
      "draft.registerDaysMax",
      "draft.retentionDaysMin",
      "draft.retentionDaysMax",
      "draft.contactNamedNumMin",
      "draft.contactNamedNumMax",
      "draft.onlineStatus",
      "createdAtFrom"
    ]) {
      assert.ok(source.includes(key), `missing control for ${key}`);
    }
  });

  it("names the friend count filter honestly", () => {
    // 它打在 account_profile.contact_named_num，叫「双向好友」就是骗人
    assert.match(source, /通讯录好友数/);
    assert.match(source, /不是「双向好友」/);
    assert.doesNotMatch(source, /label="双向好友/);
  });

  it("never offers the mutual friend count that has no collector", () => {
    // friendCount 打在 account_profile.friend_count，两套协议都不暴露互加关系，
    // 至今没有采集源；渲染它等于给用户一个任何下界都命中 0 个的控件
    assert.ok(!source.includes("draft.friendCountMin"));
    assert.ok(!source.includes("draft.friendCountMax"));
  });

  it("never renders a control the shared selection sql cannot apply", () => {
    // 圈号基线已强制账号状态正常，按封号码筛没有意义；
    // errorDesc / loggedIn 这两个键在共用的下推 SQL 里根本没有条件
    for (const dead of [
      "draft.errorCode",
      "draft.errorDesc",
      "draft.loggedInFrom",
      "draft.loggedInTo"
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("./GroupMemberDrawer.vue", import.meta.url),
  "utf8"
);
const profileSavingSource = readFileSync(
  new URL("../composables/useGroupProfileSaving.ts", import.meta.url),
  "utf8"
);

describe("group member drawer", () => {
  it("loads the aggregated group detail without optimistic permission defaults", () => {
    assert.doesNotMatch(source, /editGroupSettings:\s*true/);
    assert.doesNotMatch(source, /inviteViaLink:\s*true/);
    assert.match(source, /getGroupDetail\(group\.id\)/);
    assert.match(source, /permissions\.inviteViaLink/);
    assert.match(source, /permissions\.editGroupSettings\s*==\s*null/);
    assert.match(source, /capabilities\.inviteViaLink\.supported/);
    assert.match(source, /saveChangedGroupProfile/);
    assert.match(profileSavingSource, /updateGroupSubject/);
    assert.match(profileSavingSource, /updateGroupRemark/);
    assert.match(profileSavingSource, /Promise\.allSettled/);
    assert.match(source, /mirrorSynced/);
    assert.match(source, /ref="avatarUploadRef"/);
    assert.match(source, /avatarUploadRef\.value\?\.clearFiles\(\)/);
    assert.match(source, /loaded\.metadataSyncedAt\s*!==\s*previousSyncedAt/);
    assert.match(source, /群信息仍在同步，请稍后再试/);
    assert.doesNotMatch(
      source,
      /requestGroupMetadataSync\(group\.id\)[\s\S]{0,120}await loadDetail\(\)/
    );
    assert.match(source, /useGroupTimedMessage/);
    assert.match(source, /savingTimedMessage/);
    assert.match(source, /useGroupPermissions/);
    assert.doesNotMatch(source, /待接入|群组权限接口已降级/);
    assert.match(source, /:selectable="row => !row\.locked"/);
    assert.match(source, /ElMessageBox\.alert/);
    assert.match(source, /result\.partial/);
    assert.match(source, /item\.reason/);
  });

  it("does not invent controls that are absent from the current drawer", () => {
    assert.doesNotMatch(
      source,
      /复制邀请链接|重置邀请链接|添加成员按钮|退出群组/
    );
  });
});

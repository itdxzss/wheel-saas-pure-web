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
    assert.doesNotMatch(source, /permissions\.editGroupSettings\s*==\s*null/);
    assert.doesNotMatch(
      source,
      /permissions\.adminApproveNewMembers\s*==\s*null/
    );
    assert.doesNotMatch(
      source,
      /!detail\?\.capabilities\.inviteViaLink\.supported/
    );
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
    assert.match(source, /reconcileGroupMemberActionResult/);
    assert.doesNotMatch(source, /if\s*\(\s*result\.(?:ok|partial)\s*\)/);
    assert.match(source, /excludedMemberJids:\s*outcome\.succeededJids/);
    assert.match(source, /selectionJids:\s*outcome\.retryJids/);
    assert.match(source, /preserveCurrentOnError:\s*true/);
    assert.match(source, /item\.reason/);
  });

  it("keeps stale detail requests from overwriting the active drawer", () => {
    assert.match(source, /let detailLoadSession = 0/);
    assert.match(source, /const loadSession = \+\+detailLoadSession/);
    assert.match(source, /session === detailLoadSession/);
    assert.match(source, /props\.modelValue/);
    assert.match(source, /props\.group\?\.id === groupId/);
    assert.match(
      source,
      /function resetState\(\)[\s\S]*?invalidateDetailLoad\(\)/
    );
    assert.match(
      source,
      /applyGroupMemberActionResult\([\s\S]*?loaded\.members[\s\S]*?options\.excludedMemberJids/
    );
    assert.match(
      source,
      /if \(isCurrent\(\)\) \{\s*loading\.value = false;\s*\}/
    );
    assert.match(
      source,
      /restoreMemberSelection\(options\.selectionJids \?\? \[\], isCurrent\)/
    );
  });

  it("does not invent controls that are absent from the current drawer", () => {
    assert.doesNotMatch(
      source,
      /复制邀请链接|重置邀请链接|添加成员按钮|退出群组/
    );
  });
});

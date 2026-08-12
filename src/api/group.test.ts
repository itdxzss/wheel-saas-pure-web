import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  batchAssignGroupFolder,
  getGroupDetail,
  getGroupMembers,
  demoteGroupMembers,
  kickGroupMembers,
  listGroups,
  promoteGroupMembers,
  requestGroupMetadataSync,
  updateGroupRemark,
  updateGroupSetting,
  updateGroupSubject,
  updateTimedMessage,
  uploadGroupAvatar
} from "./group";

describe("group API", () => {
  it("filters and assigns group folders with camelCase params", async () => {
    resetArmadaMock({ list: [], total: 0 });

    await listGroups({ folderId: 8, page: 1, pageSize: 10 });
    await listGroups({ withoutFolder: true, page: 1, pageSize: 10 });
    await batchAssignGroupFolder([101, 102], null);

    assert.deepEqual(armadaCalls()[0]?.opts, {
      params: {
        page: 1,
        pageSize: 10,
        keyword: undefined,
        status: undefined,
        sourceFileName: undefined,
        origin: undefined,
        membershipState: undefined,
        folderId: 8,
        withoutFolder: undefined,
        groupType: undefined,
        availableAdmin: undefined,
        memberCountMin: undefined,
        memberCountMax: undefined,
        continentCode: undefined,
        countryIso2: undefined,
        ageDaysMin: undefined,
        ageDaysMax: undefined
      }
    });
    assert.deepEqual(armadaCalls()[1]?.opts, {
      params: {
        page: 1,
        pageSize: 10,
        keyword: undefined,
        status: undefined,
        sourceFileName: undefined,
        origin: undefined,
        membershipState: undefined,
        folderId: undefined,
        withoutFolder: true,
        groupType: undefined,
        availableAdmin: undefined,
        memberCountMin: undefined,
        memberCountMax: undefined,
        continentCode: undefined,
        countryIso2: undefined,
        ageDaysMin: undefined,
        ageDaysMax: undefined
      }
    });
    assert.deepEqual(armadaCalls()[2], {
      method: "post",
      url: "/api/group-links/batch-assign-folder",
      opts: { data: { ids: [101, 102], folderId: null } }
    });
  });

  it("submits combined history filters and requests metadata refresh", async () => {
    resetArmadaMock({ accepted: true, status: "PENDING" });

    await listGroups({
      groupType: "HISTORICAL",
      availableAdmin: false,
      memberCountMin: 51,
      continentCode: "ASIA",
      countryIso2: "IN",
      ageDaysMax: 365
    });
    const accepted = await requestGroupMetadataSync(42);

    const listOptions = armadaCalls()[0]?.opts as {
      params: Record<string, unknown>;
    };
    const params = listOptions.params;
    assert.equal(params.groupType, "HISTORICAL");
    assert.equal(params.availableAdmin, false);
    assert.equal(params.memberCountMin, 51);
    assert.equal(params.continentCode, "ASIA");
    assert.equal(params.countryIso2, "IN");
    assert.equal(params.ageDaysMax, 365);
    assert.deepEqual(armadaCalls()[1], {
      method: "post",
      url: "/api/group-links/42/metadata-sync",
      opts: undefined
    });
    assert.equal(accepted.status, "PENDING");
  });

  it("loads real-time group members from the armada members endpoint", async () => {
    resetArmadaMock({
      groupLinkId: 42,
      groupJid: "120363@test.g.us",
      total: 1,
      members: [
        {
          jid: "8613800000000@s.whatsapp.net",
          phone: "8613800000000",
          admin: false,
          owner: false,
          role: null
        }
      ]
    });

    const result = await getGroupMembers(42);

    assert.equal(result.total, 1);
    assert.equal(result.members[0].name, "8613800000000");
    assert.equal(result.members[0].roleText, "成员");
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-links/42/members",
        opts: undefined
      }
    ]);
  });

  it("loads and maps the aggregated group detail", async () => {
    resetArmadaMock({
      groupLinkId: 42,
      groupJid: "120363detail@g.us",
      groupName: "真实群名",
      remark: "本地备注",
      avatarUrl: "https://pps.whatsapp.net/current.jpg",
      liveStateAvailable: true,
      liveStateUnavailableReason: null,
      timedMessageMode: "7d",
      permissions: {
        editGroupSettings: true,
        sendMessages: false,
        addMembers: true,
        inviteViaLink: null,
        adminApproveNewMembers: true
      },
      capabilities: {
        inviteViaLink: {
          supported: false,
          reason: "Baileys 当前不支持"
        }
      },
      membersAvailable: true,
      membersUnavailableReason: null,
      members: [
        {
          jid: "8613800000000:7@s.whatsapp.net",
          phone: "8613800000000",
          admin: true,
          owner: true,
          role: "superadmin"
        }
      ]
    });

    const result = await getGroupDetail(42);

    assert.equal(result.permissions.sendMessages, false);
    assert.equal(result.capabilities.inviteViaLink.supported, false);
    assert.equal(result.members[0].jid, "8613800000000:7@s.whatsapp.net");
    assert.equal(result.members[0].phone, "8613800000000");
    assert.equal(result.members[0].role, "OWNER");
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-links/42/detail",
        opts: undefined
      }
    ]);
  });

  it("submits subject, local remark and multipart avatar independently", async () => {
    resetArmadaMock({
      applied: true,
      mirrorSynced: true,
      avatarUrl: "https://pps.whatsapp.net/new.jpg"
    });
    const file = new File([new Uint8Array([1, 2, 3])], "avatar.jpg", {
      type: "image/jpeg"
    });

    await updateGroupSubject(42, "新群名");
    await updateGroupRemark(42, "本地备注");
    const avatarResult = await uploadGroupAvatar(42, file);

    const calls = armadaCalls();
    assert.deepEqual(calls[0], {
      method: "post",
      url: "/api/group-links/42/subject",
      opts: { data: { subject: "新群名" } }
    });
    assert.deepEqual(calls[1], {
      method: "patch",
      url: "/api/group-links/42",
      opts: { data: { remark: "本地备注" } }
    });
    const uploadOptions = calls[2].opts as {
      data: FormData;
      timeout: number;
    };
    assert.equal(calls[2].method, "post");
    assert.equal(calls[2].url, "/api/group-links/42/avatar");
    assert.ok(uploadOptions.data instanceof FormData);
    assert.equal(uploadOptions.data.get("file"), file);
    assert.equal(uploadOptions.timeout, 45000);
    assert.equal(avatarResult.mirrorSynced, true);
    assert.equal(avatarResult.avatarUrl, "https://pps.whatsapp.net/new.jpg");
  });

  it("submits a timed message mode without an execution account", async () => {
    resetArmadaMock(undefined);

    await updateTimedMessage(42, "7d");

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/42/timed-message",
        opts: { data: { mode: "7d" } }
      }
    ]);
  });

  it("submits one explicit group permission without an execution account", async () => {
    resetArmadaMock(undefined);

    await updateGroupSetting(42, "ADD_MEMBERS", true);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/group-links/42/settings",
        opts: { data: { key: "ADD_MEMBERS", enabled: true } }
      }
    ]);
  });

  it("submits each member batch action and preserves per-jid reasons", async () => {
    resetArmadaMock({
      ok: false,
      partial: true,
      message: "部分成员操作成功",
      results: [
        {
          jid: "member@s.whatsapp.net",
          status: "UNKNOWN",
          reason: "操作结果待确认，请刷新"
        }
      ]
    });

    const promote = await promoteGroupMembers(42, ["member@s.whatsapp.net"]);
    await demoteGroupMembers(42, ["member@s.whatsapp.net"]);
    await kickGroupMembers(42, ["member@s.whatsapp.net"]);

    assert.equal(promote.results?.[0].reason, "操作结果待确认，请刷新");
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/group-links/42/members/promote-batch",
        "/api/group-links/42/members/demote-batch",
        "/api/group-links/42/members/kick-batch"
      ]
    );
    for (const call of armadaCalls()) {
      assert.deepEqual(call.opts, {
        data: { jids: ["member@s.whatsapp.net"] }
      });
    }
  });
});

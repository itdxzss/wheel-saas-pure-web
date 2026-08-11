import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GroupMember } from "@/api/group";
import { applyGroupMemberActionResult } from "./memberActionResult";

const members: GroupMember[] = [
  {
    jid: "member-a@s.whatsapp.net",
    phone: "member-a",
    name: "member-a",
    role: "MEMBER",
    roleText: "成员",
    locked: false
  },
  {
    jid: "admin-b@s.whatsapp.net",
    phone: "admin-b",
    name: "admin-b",
    role: "ADMIN",
    roleText: "管理员",
    locked: false
  }
];

describe("group member action result", () => {
  it("updates only members explicitly confirmed as successful", () => {
    const updated = applyGroupMemberActionResult(members, "promote", {
      ok: false,
      partial: true,
      results: [
        { jid: "member-a@s.whatsapp.net", status: "OK", reason: null },
        { jid: "admin-b@s.whatsapp.net", status: "UNKNOWN", reason: "待确认" }
      ]
    });

    assert.equal(updated[0].role, "ADMIN");
    assert.equal(updated[0].roleText, "管理员");
    assert.equal(updated[1], members[1]);
  });

  it("updates demotion and removal without waiting for metadata refresh", () => {
    const demoted = applyGroupMemberActionResult(members, "demote", {
      ok: true,
      partial: false,
      results: [{ jid: "admin-b@s.whatsapp.net", status: "OK", reason: null }]
    });
    const removed = applyGroupMemberActionResult(demoted, "kick", {
      ok: true,
      partial: false,
      results: [{ jid: "member-a@s.whatsapp.net", status: "OK", reason: null }]
    });

    assert.equal(demoted[1].role, "MEMBER");
    assert.deepEqual(
      removed.map(member => member.jid),
      ["admin-b@s.whatsapp.net"]
    );
  });
});

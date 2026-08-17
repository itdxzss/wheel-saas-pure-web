import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GroupMember } from "@/api/group";
import {
  applyGroupMemberActionResult,
  reconcileGroupMemberActionResult
} from "./memberActionResult";

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
  it("accepts a full success only when every requested jid is explicitly OK", () => {
    const result = {
      ok: true,
      partial: false,
      results: [
        { jid: "member-a@s.whatsapp.net", status: "OK", reason: null },
        { jid: "admin-b@s.whatsapp.net", status: "OK", reason: null }
      ]
    };
    const outcome = reconcileGroupMemberActionResult(
      members.map(member => member.jid),
      result
    );
    const updated = applyGroupMemberActionResult(
      members,
      "kick",
      outcome.succeededJids
    );

    assert.equal(outcome.complete, true);
    assert.deepEqual(outcome.retryJids, []);
    assert.deepEqual(updated, []);
  });

  it("updates only members explicitly confirmed as successful", () => {
    const result = {
      ok: false,
      partial: true,
      results: [
        { jid: "member-a@s.whatsapp.net", status: "OK", reason: null },
        { jid: "admin-b@s.whatsapp.net", status: "UNKNOWN", reason: "待确认" }
      ]
    };
    const outcome = reconcileGroupMemberActionResult(
      members.map(member => member.jid),
      result
    );
    const updated = applyGroupMemberActionResult(
      members,
      "promote",
      outcome.succeededJids
    );

    assert.equal(updated[0].role, "ADMIN");
    assert.equal(updated[0].roleText, "管理员");
    assert.equal(updated[1], members[1]);
    assert.deepEqual(outcome.retryJids, ["admin-b@s.whatsapp.net"]);
    assert.equal(outcome.complete, false);
  });

  it("updates demotion and removal without waiting for metadata refresh", () => {
    const demoted = applyGroupMemberActionResult(members, "demote", [
      "admin-b@s.whatsapp.net"
    ]);
    const removed = applyGroupMemberActionResult(demoted, "kick", [
      "member-a@s.whatsapp.net"
    ]);

    assert.equal(demoted[1].role, "MEMBER");
    assert.deepEqual(
      removed.map(member => member.jid),
      ["admin-b@s.whatsapp.net"]
    );
  });

  it("keeps a confirmed kick excluded from a stale refreshed snapshot", () => {
    const staleRefresh = members.map(member => ({ ...member }));
    const reconciled = applyGroupMemberActionResult(staleRefresh, "kick", [
      "member-a@s.whatsapp.net"
    ]);

    assert.deepEqual(
      reconciled.map(member => member.jid),
      ["admin-b@s.whatsapp.net"]
    );
  });

  it("does not trust a top-level ok when per-member results are missing", () => {
    const outcome = reconcileGroupMemberActionResult(
      ["member-a@s.whatsapp.net"],
      { ok: true, partial: false }
    );

    assert.equal(outcome.complete, false);
    assert.deepEqual(outcome.succeededJids, []);
    assert.deepEqual(outcome.retryJids, ["member-a@s.whatsapp.net"]);
    assert.equal(outcome.failures[0].status, "MISSING");
  });

  it("requires an exact case-sensitive jid match", () => {
    const requestedJid = "Member-A@s.whatsapp.net";
    const outcome = reconcileGroupMemberActionResult([requestedJid], {
      ok: true,
      partial: false,
      results: [
        { jid: "member-a@s.whatsapp.net", status: "OK", reason: null },
        { jid: `${requestedJid}.extra`, status: "OK", reason: null }
      ]
    });

    assert.equal(outcome.complete, false);
    assert.deepEqual(outcome.succeededJids, []);
    assert.deepEqual(outcome.retryJids, [requestedJid]);
  });
});

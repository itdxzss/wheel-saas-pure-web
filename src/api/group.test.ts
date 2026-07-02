import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { getGroupMembers } from "./group";

describe("group API", () => {
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
});

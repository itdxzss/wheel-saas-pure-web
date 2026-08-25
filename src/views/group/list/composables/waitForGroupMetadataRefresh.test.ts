import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GroupDetail } from "@/api/group";
import { waitForGroupMetadataRefresh } from "./waitForGroupMetadataRefresh";

function detail(
  metadataSyncStatus: string,
  metadataSyncError: string | null = null
): GroupDetail {
  return {
    groupLinkId: 42,
    groupJid: "120363000@g.us",
    groupName: "测试群",
    remark: null,
    avatarUrl: null,
    liveStateAvailable: true,
    liveStateUnavailableReason: null,
    timedMessageMode: null,
    permissions: {
      editGroupSettings: null,
      sendMessages: null,
      addMembers: null,
      inviteViaLink: null,
      adminApproveNewMembers: null
    },
    capabilities: {
      inviteViaLink: { supported: false, reason: null }
    },
    membersAvailable: true,
    membersUnavailableReason: null,
    members: [],
    metadataSyncStatus,
    metadataSyncedAt: null,
    metadataSyncError
  };
}

describe("wait for group metadata refresh", () => {
  it("polls at most twice by default", async () => {
    let loads = 0;

    const result = await waitForGroupMetadataRefresh({
      previousSyncedAt: null,
      isCurrent: () => true,
      intervalMs: 0,
      load: async () => {
        loads += 1;
        return detail("PENDING");
      }
    });

    assert.equal(result, null);
    assert.equal(loads, 2);
  });

  it("stops immediately when the task is deferred", async () => {
    let loads = 0;

    await assert.rejects(
      waitForGroupMetadataRefresh({
        previousSyncedAt: null,
        isCurrent: () => true,
        intervalMs: 0,
        load: async () => {
          loads += 1;
          return detail("DEFERRED", "暂无在线且仍在群内的可用账号");
        }
      }),
      /暂无在线且仍在群内的可用账号/
    );
    assert.equal(loads, 1);
  });
});

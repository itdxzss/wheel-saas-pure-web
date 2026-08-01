import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ref } from "vue";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import type { PullTaskGroupCandidateRow } from "@/api/pull-task";
import { createEmptyPullTaskMarketingDraft } from "./create-draft";
import { usePullTaskGroupCandidates } from "./usePullTaskGroupCandidates";

function candidate(groupJid: string): PullTaskGroupCandidateRow {
  return {
    groupLinkId: 1,
    groupJid,
    groupName: "印度群",
    source: "HISTORICAL",
    ownerPhone: "919900000001",
    countryIso2: "IN",
    countryName: "印度",
    countryFlag: "🇮🇳",
    groupCreatedAt: 1_700_000_000,
    memberSize: 120,
    announceOnly: false,
    avatarUrl: null,
    lastSyncedAt: 1_700_000_000_000,
    sourceJoinTaskId: null,
    sourceJoinTaskName: null,
    sourceJoinedAt: null,
    sourcePromotedAt: null,
    operableAccounts: [],
    eligibleAccountCount: 1,
    onlineAccountCount: 1,
    status: "NORMAL",
    selectable: true,
    inCurrentWaitingPool: false,
    occupiedTaskName: null,
    disabledReason: null,
    lastValidatedAt: null
  };
}

describe("pull task marketing group candidates", () => {
  it("restores an existing server waiting pool before candidate loading", async () => {
    const group = candidate("120363002@g.us");
    resetArmadaMockQueue([
      {
        reservationToken: "saved-token",
        groups: [group],
        rejected: []
      }
    ]);
    const draft = ref(createEmptyPullTaskMarketingDraft());
    draft.value.waitingPoolToken = "saved-token";
    const state = usePullTaskGroupCandidates(draft);

    await state.restoreWaitingPool();

    assert.deepEqual(draft.value.selectedGroupJids, ["120363002@g.us"]);
    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/pull-tasks/group-marketing/waiting-pool",
        opts: { params: { reservationToken: "saved-token" } }
      }
    ]);
  });

  it("loads real candidates and only treats server waiting rows as task groups", async () => {
    const group = candidate("120363001@g.us");
    resetArmadaMockQueue([
      { list: [group], total: 1, page: 1, pageSize: 10 },
      {
        reservationToken: "pool-token",
        groups: [{ ...group, inCurrentWaitingPool: true, selectable: false }],
        rejected: []
      },
      { list: [], total: 0, page: 1, pageSize: 10 }
    ]);
    const draft = ref(createEmptyPullTaskMarketingDraft());
    draft.value.taskName = "印度营销";
    draft.value.groupNameKeyword = " 游戏群 ";
    const state = usePullTaskGroupCandidates(draft);

    await state.loadCandidates();
    state.updateCandidateSelection([group]);
    assert.deepEqual(draft.value.selectedGroupJids, []);

    await state.addSelectedToWaitingPool();

    assert.deepEqual(draft.value.selectedGroupJids, ["120363001@g.us"]);
    assert.equal(draft.value.waitingPoolToken, "pool-token");
    assert.deepEqual(state.selectedCandidateJids.value, []);
    assert.equal(
      armadaCalls()[0].url,
      "/api/pull-tasks/group-marketing/candidate-groups"
    );
    assert.deepEqual(armadaCalls()[1], {
      method: "post",
      url: "/api/pull-tasks/group-marketing/waiting-pool",
      opts: {
        data: {
          reservationToken: null,
          taskName: "印度营销",
          plannedStartAt: null,
          groupJids: ["120363001@g.us"]
        }
      }
    });
    assert.equal(
      (armadaCalls()[2].opts as { params: { reservationToken: string } }).params
        .reservationToken,
      "pool-token"
    );
  });
});

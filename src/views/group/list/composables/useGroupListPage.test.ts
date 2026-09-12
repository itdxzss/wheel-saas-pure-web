import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { useGroupListPage } from "./useGroupListPage";
import type { GroupListRow } from "@/api/group";

const summary = {
  totalGroupCount: 12,
  unassignedGroupCount: 2,
  folders: [
    { id: 7, name: "9-8", groupCount: 8 },
    { id: 8, name: "空分组", groupCount: 0 }
  ]
};

describe("group list folder counts", () => {
  it("shows global counts and zero folders independently of table filters", async () => {
    const state = useGroupListPage();
    state.searchForm.status = "AVAILABLE";
    state.searchForm.folderFilter = 7;
    resetArmadaMockQueue([{ list: [], total: 3 }, summary]);

    await state.refreshGroups();

    assert.equal(state.total.value, 3);
    assert.deepEqual(state.folderFilterOptions.value, [
      { value: "", label: "全部分组（12）" },
      { value: "UNASSIGNED", label: "未分组（2）" },
      { value: 7, label: "9-8（8）" },
      { value: 8, label: "空分组（0）" }
    ]);
    assert.equal(state.searchForm.folderFilter, 7);
    assert.deepEqual(armadaCalls()[1], {
      method: "get",
      url: "/api/group-folders/filter-options",
      opts: undefined
    });
  });

  it("refreshes counts after assignment and deletion", async () => {
    const state = useGroupListPage();
    const row: GroupListRow = {
      id: 101,
      groupName: "测试群",
      status: "AVAILABLE",
      url: "chat.whatsapp.com/test",
      groupClassification: "POST_CONTROL"
    };
    state.onSelectionChange([row]);
    resetArmadaMockQueue([1, { list: [], total: 1 }, summary]);
    await state.assignSelectedFolder(7);
    assert.equal(state.folderFilterOptions.value[2].label, "9-8（8）");

    resetArmadaMockQueue([
      1,
      { list: [], total: 0 },
      {
        ...summary,
        totalGroupCount: 11,
        folders: [{ id: 7, name: "9-8", groupCount: 7 }]
      }
    ]);
    await state.deleteGroup(row);
    assert.equal(state.folderFilterOptions.value[0].label, "全部分组（11）");
    assert.equal(state.folderFilterOptions.value[2].label, "9-8（7）");
  });

  it("clears a deleted folder selection and refreshes the renamed options", async () => {
    const state = useGroupListPage();
    state.searchForm.folderFilter = 7;
    state.page.value = 3;
    resetArmadaMockQueue([
      { list: [], total: 12 },
      {
        ...summary,
        folders: [{ id: 8, name: "改名分组", groupCount: 0 }]
      }
    ]);
    await state.onGroupFoldersChanged([7]);
    assert.equal(state.searchForm.folderFilter, "");
    assert.equal(state.page.value, 1);
    assert.equal(state.folderFilterOptions.value[2].label, "改名分组（0）");
  });

  it("does not invent zero counts on load failure and accepts a later reload", async () => {
    const state = useGroupListPage();
    resetArmadaMockFailure(new Error("load failed"));
    await state.reloadFolderOptions();
    assert.equal(state.folderFilterOptions.value[0].label, "全部分组");
    assert.equal(state.folderOptionsLoading.value, false);

    resetArmadaMock({
      totalGroupCount: 0,
      unassignedGroupCount: 0,
      folders: []
    });
    await state.reloadFolderOptions();
    assert.equal(state.folderFilterOptions.value[0].label, "全部分组（0）");
    assert.equal(state.folderFilterOptions.value[1].label, "未分组（0）");
  });

  it("ignores a stale response that finishes after a newer count refresh", async () => {
    const state = useGroupListPage();
    let finishOlder: (value: typeof summary) => void;
    const older = new Promise<typeof summary>(resolve => {
      finishOlder = resolve;
    });
    resetArmadaMockQueue([older, { ...summary, totalGroupCount: 15 }]);
    const firstReload = state.reloadFolderOptions();
    await state.reloadFolderOptions();
    finishOlder(summary);
    await firstReload;
    assert.equal(state.folderFilterOptions.value[0].label, "全部分组（15）");
  });
});

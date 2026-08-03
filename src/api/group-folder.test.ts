import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  batchDeleteGroupFolders,
  createGroupFolder,
  listGroupFolderOptions,
  listGroupFolders,
  updateGroupFolder
} from "./group-folder";

describe("group folder API", () => {
  it("submits group folder management requests with camelCase payloads", async () => {
    resetArmadaMock({ deletedFolderCount: 1, ungroupedGroupCount: 3 });

    await listGroupFolders({ page: 2, pageSize: 20, keyword: "印度" });
    await listGroupFolderOptions();
    await createGroupFolder({ name: "印度组" });
    await updateGroupFolder(7, { name: "印度组-新" });
    await batchDeleteGroupFolders([7]);

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/group-folders",
        opts: { params: { page: 2, pageSize: 20, keyword: "印度" } }
      },
      {
        method: "get",
        url: "/api/group-folders/options",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/group-folders",
        opts: { data: { name: "印度组" } }
      },
      {
        method: "patch",
        url: "/api/group-folders/7",
        opts: { data: { name: "印度组-新" } }
      },
      {
        method: "post",
        url: "/api/group-folders/batch-delete",
        opts: { data: { ids: [7] } }
      }
    ]);
  });
});

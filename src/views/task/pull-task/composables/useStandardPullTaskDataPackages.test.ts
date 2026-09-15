import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import { useStandardPullTaskCreate } from "./useStandardPullTaskCreate";
import type { PullTaskStandardDraft } from "@/api/pull-task";

function packageDraft(): PullTaskStandardDraft {
  return {
    draftTaskId: 11,
    creationMode: "NEW_GROUP",
    rows: [
      {
        rowId: 5,
        seq: 1,
        normalizedLink: null,
        sourceLinkLineNo: null,
        sourceFileName: "泰国.txt",
        sourceDataPackageId: 37,
        sourceDataPackageGeneration: 2,
        totalLineCount: 2,
        validMemberCount: 2,
        invalidLineCount: 0,
        duplicateLineCount: 0
      }
    ],
    linkLines: [],
    fileResults: [],
    matchedCount: 1,
    remainingLinkCount: 0,
    ignoredFileCount: 0
  };
}

describe("standard pull task data package planning", () => {
  it("preserves selection order and updates the actual server draft", async () => {
    resetArmadaMock(packageDraft());
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "NEW_GROUP";
    assert.equal(await state.planDataPackages([37, 8]), true);
    assert.deepEqual(armadaCalls()[0], {
      method: "post",
      url: "/api/pull-tasks/standard/draft/data-packages",
      opts: {
        data: {
          creationMode: "NEW_GROUP",
          packageIds: [37, 8],
          groupFolderId: null,
          linksText: ""
        },
        timeout: 45_000
      }
    });
    assert.equal(state.draft.value.rows[0].sourceDataPackageGeneration, 2);
    assert.equal(state.planning.value, false);
  });

  it("includes pasted links and the resource group in the same request", async () => {
    resetArmadaMock(packageDraft());
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.groupFolderId = 28;
    state.linksText.value = "https://chat.whatsapp.com/example";
    await state.planDataPackages([37]);
    assert.deepEqual((armadaCalls()[0].opts as { data: unknown }).data, {
      creationMode: "PASTED_LINK",
      packageIds: [37],
      groupFolderId: 28,
      linksText: "https://chat.whatsapp.com/example"
    });
  });

  it("prevents duplicate packages already frozen in the draft", async () => {
    resetArmadaMock(packageDraft());
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "NEW_GROUP";
    state.draft.value = packageDraft();
    assert.equal(await state.planDataPackages([37]), false);
    assert.equal(armadaCalls().length, 0);
    assert.match(state.resourceError.value, /已在当前执行计划/);
  });

  it("leaves existing draft and pending files intact after a stale package conflict", async () => {
    resetArmadaMockFailure(new Error("数据包代次已变化，请重新选择"));
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "NEW_GROUP";
    state.draft.value = packageDraft();
    const file = new File(["66812345678A"], "additional.txt");
    state.addFiles([file]);
    assert.equal(await state.planDataPackages([8]), false);
    assert.equal(state.draft.value.rows[0].sourceDataPackageId, 37);
    assert.equal(state.pendingFiles.value[0], file);
    assert.match(state.resourceError.value, /代次已变化/);
    assert.equal(state.planning.value, false);
  });

  it("requires a group source in link mode and rejects empty or oversized selection", async () => {
    resetArmadaMock({});
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    assert.equal(await state.planDataPackages([37]), false);
    assert.match(state.resourceError.value, /群链接/);
    state.form.creationMode = "NEW_GROUP";
    assert.equal(await state.planDataPackages([]), false);
    assert.equal(
      await state.planDataPackages(
        Array.from({ length: 51 }, (_, index) => index + 1)
      ),
      false
    );
    assert.equal(armadaCalls().length, 0);
  });
});

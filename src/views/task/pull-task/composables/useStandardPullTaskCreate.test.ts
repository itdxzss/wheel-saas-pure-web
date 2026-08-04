import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type { PullTaskStandardDraft } from "@/api/pull-task";
import { useStandardPullTaskCreate } from "./useStandardPullTaskCreate";

function draft(
  overrides: Partial<PullTaskStandardDraft> = {}
): PullTaskStandardDraft {
  return {
    draftTaskId: 7,
    version: 3,
    rows: [
      {
        rowId: 19,
        seq: 1,
        normalizedLink: "chat.whatsapp.com/code",
        sourceLinkLineNo: 1,
        sourceFileName: "material.txt",
        totalLineCount: 1,
        validMemberCount: 1,
        invalidLineCount: 0,
        duplicateLineCount: 0
      }
    ],
    linkLines: [],
    fileResults: [],
    matchedCount: 1,
    remainingLinkCount: 0,
    ignoredFileCount: 0,
    ...overrides
  };
}

function validState(onCreated: () => Promise<void> = async () => undefined) {
  const state = useStandardPullTaskCreate({ onCreated });
  state.form.taskName = "普通群链接";
  state.form.managerGroupId = 11;
  state.form.pullerGroupId = 12;
  state.form.stationGroupId = 13;
  state.draft.value = draft();
  return state;
}

describe("standard normal-link pull task create state", () => {
  it("loads account groups and the current server draft", async () => {
    resetArmadaMockQueue([{ list: [{ id: 11, name: "管理组" }] }, draft()]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });

    await state.open();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/account-groups", "/api/pull-tasks/standard/draft"]
    );
    assert.equal(state.accountGroups.value[0]?.name, "管理组");
    assert.equal(state.draft.value.rows[0]?.rowId, 19);
  });

  it("requires a complete frozen plan and all three account groups", async () => {
    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const empty = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    empty.form.taskName = "普通群链接";

    await empty.create();

    assert.equal(armadaCalls().length, 0);
    assert.equal(
      elementPlusCalls().at(-1)?.text,
      "请先完成链接与 TXT 匹配预览"
    );

    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const missingGroups = validState();
    missingGroups.form.stationGroupId = "";
    await missingGroups.create();
    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择管理、拉手和站台分组");
  });

  it("plans with full links and keeps unmatched accepted TXT for retry", async () => {
    resetArmadaMock(
      draft({
        rows: [],
        matchedCount: 0,
        remainingLinkCount: 0,
        ignoredFileCount: 1,
        fileResults: [
          {
            fileName: "extra.txt",
            accepted: true,
            validMemberCount: 1,
            invalidLineCount: 0,
            duplicateLineCount: 0,
            rejectReason: null,
            lineErrors: []
          }
        ]
      })
    );
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.linksText.value = "https://chat.whatsapp.com/code";
    const file = new File(["8613900000000"], "extra.txt", {
      type: "text/plain"
    });
    state.addFiles([file]);

    await state.plan();

    const payload = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(payload.get("linksText"), state.linksText.value);
    assert.deepEqual(
      state.pendingFiles.value.map(item => item.name),
      ["extra.txt"]
    );
  });

  it("sends TXT files in the user-adjusted order", async () => {
    resetArmadaMock(draft({ rows: [], matchedCount: 0, ignoredFileCount: 2 }));
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    const first = new File(["8613900000000"], "first.txt");
    const second = new File(["8613900000001"], "second.txt");
    state.addFiles([first, second]);

    state.movePendingFile("second.txt", -1);
    await state.plan();

    const payload = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.deepEqual(
      payload.getAll("files").map(file => (file as File).name),
      ["second.txt", "first.txt"]
    );
  });

  it("posts only the approved frozen-create fields", async () => {
    resetArmadaMock({
      id: 7,
      taskName: "普通群链接",
      status: "WAIT_START",
      groupCount: 1,
      expectedPullCount: 1
    });
    resetElementPlusMock();
    let refreshes = 0;
    const state = validState(async () => {
      refreshes += 1;
    });
    state.visible.value = true;

    await state.create();

    const payload = (armadaCalls()[0].opts as { data: Record<string, unknown> })
      .data;
    assert.equal(armadaCalls()[0].url, "/api/pull-tasks/standard");
    assert.deepEqual(Object.keys(payload).sort(), [
      "autoStart",
      "concurrentGroupCount",
      "draftTaskId",
      "managerGroupId",
      "materialAdminTiming",
      "pullCountMax",
      "pullCountMin",
      "pullIntervalSeconds",
      "pullerCountPerGroup",
      "pullerGroupId",
      "pullerRiskMinutes",
      "remark",
      "stationCountPerCall",
      "stationGroupId",
      "taskName",
      "version"
    ]);
    assert.equal(payload.managerGroupId, 11);
    assert.equal(payload.pullerGroupId, 12);
    assert.equal(payload.stationGroupId, 13);
    assert.equal(refreshes, 1);
    assert.equal(state.visible.value, false);
  });

  it("requires another preview after the link text changes", async () => {
    resetArmadaMock({ id: 7 });
    resetElementPlusMock();
    const state = validState();
    state.linksText.value = "https://chat.whatsapp.com/new-code";

    await state.create();

    assert.equal(armadaCalls().length, 0);
    assert.equal(
      elementPlusCalls().at(-1)?.text,
      "资源内容已变化，请重新预检并冻结执行计划"
    );
  });

  it("removes a discarded frozen link from the retained link text", async () => {
    resetArmadaMock(draft({ rows: [], matchedCount: 0 }));
    resetElementPlusMock();
    const state = validState();
    state.draft.value.rows[0].sourceLinkLineNo = 2;
    state.linksText.value = "https://chat.whatsapp.com/code";

    await state.removeRow(19);

    assert.equal(
      armadaCalls()[0]?.url,
      "/api/pull-tasks/standard/draft/rows/19"
    );
    assert.equal(state.linksText.value, "");
  });
});

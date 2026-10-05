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
import type {
  PullTaskStandardCreateRequest,
  PullTaskStandardDraft
} from "@/api/pull-task";
import { useStandardPullTaskCreate } from "./useStandardPullTaskCreate";

function draft(
  overrides: Partial<PullTaskStandardDraft> = {}
): PullTaskStandardDraft {
  return {
    draftTaskId: 7,
    creationMode: "PASTED_LINK",
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
  it("starts with the approved prototype defaults", () => {
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });

    assert.equal(state.form.autoStart, true);
    assert.equal(state.form.materialAdminTiming, 2);
    assert.equal(state.form.pullerJoinByLink, false);
    assert.equal(state.form.earlyPullCount, 1);
    assert.equal(state.form.earlyPullCallCount, 2);
    assert.equal(state.form.pullCountMin, 50);
    assert.equal(state.form.pullCountMax, 50);
    assert.equal(state.form.pullerCountPerGroup, 2);
    assert.equal(state.form.pullerSyncMode, "SINGLE");
    assert.equal(state.form.creationMode, "PASTED_LINK");
    assert.equal(state.form.creatorLeaveAfterPull, false);
    assert.equal(state.form.groupSettingEnabled, false);
    assert.equal(state.form.groupSettingTiming, "AFTER_PULL");
    assert.equal(state.form.linkPermission, "ADMIN_ONLY");
    assert.equal(state.form.disappearingMessage, "UNCHANGED");
  });

  it("loads account groups and the current server draft", async () => {
    resetArmadaMockQueue([
      { list: [{ id: 11, name: "管理组" }] },
      { list: [{ id: 21, name: "历史群分组", groupCount: 12 }] },
      draft()
    ]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });

    await state.open();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/account-groups",
        "/api/group-folders",
        "/api/pull-tasks/standard/draft"
      ]
    );
    assert.equal(state.accountGroups.value[0]?.name, "管理组");
    assert.equal(state.groupFolders.value[0]?.name, "历史群分组");
    assert.equal(state.draft.value.rows[0]?.rowId, 19);
  });

  it("restores new-group mode from a persisted server draft", async () => {
    resetArmadaMockQueue([
      { list: [] },
      { list: [] },
      draft({ creationMode: "NEW_GROUP" })
    ]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });

    await state.open();

    assert.equal(state.form.creationMode, "NEW_GROUP");
    assert.equal(state.form.groupSettingEnabled, true);
    assert.equal(state.form.groupSettingTiming, "BEFORE_PULL");
    assert.equal(state.form.useMaterialFileNameAsGroupName, false);
    assert.equal(state.form.earlyPullCallCount, 0);
    assert.equal(state.form.pullCountMin, 1);
    assert.equal(state.form.pullCountMax, 3);
    assert.equal(state.form.pullIntervalSeconds, 10);
    assert.equal(state.form.pullIntervalMaxSeconds, 15);
  });

  it("keeps each mode's pull settings when switching tabs", () => {
    const state = validState();
    state.form.pullCountMin = 20;
    state.form.pullCountMax = 30;
    state.form.pullIntervalSeconds = 22;
    state.form.groupSettingTiming = "AFTER_PULL";
    state.form.useMaterialFileNameAsGroupName = true;

    state.form.creationMode = "NEW_GROUP";

    assert.equal(state.form.groupSettingEnabled, true);
    assert.equal(state.form.groupSettingTiming, "BEFORE_PULL");
    assert.equal(state.form.useMaterialFileNameAsGroupName, false);
    assert.equal(state.form.earlyPullCallCount, 0);
    assert.equal(state.form.pullCountMin, 1);
    assert.equal(state.form.pullCountMax, 3);
    assert.equal(state.form.pullIntervalSeconds, 10);
    assert.equal(state.form.pullIntervalMaxSeconds, 15);
    state.form.pullCountMin = 2;
    state.form.pullIntervalSeconds = 11;
    state.form.pullIntervalMaxSeconds = 14;

    state.form.creationMode = "PASTED_LINK";

    assert.equal(state.form.groupSettingEnabled, false);
    assert.equal(state.form.groupSettingTiming, "AFTER_PULL");
    assert.equal(state.form.useMaterialFileNameAsGroupName, true);
    assert.equal(state.form.earlyPullCallCount, 2);
    assert.equal(state.form.pullCountMin, 20);
    assert.equal(state.form.pullCountMax, 30);
    assert.equal(state.form.pullIntervalSeconds, 22);

    state.form.creationMode = "NEW_GROUP";
    assert.equal(state.form.pullCountMin, 2);
    assert.equal(state.form.pullIntervalSeconds, 11);
    assert.equal(state.form.pullIntervalMaxSeconds, 14);
  });

  it("rejects invalid new-group profile, batch and interval settings before submission", async () => {
    const invalidCases: Array<
      [Partial<ReturnType<typeof validState>["form"]>, string]
    > = [
      [{ groupName: "  " }, "请填写群名称"],
      [{ groupName: "名".repeat(101) }, "群名称不能超过 100 个字符"],
      [{ groupDescription: " \n " }, "请填写群描述"],
      [{ groupDescription: "描".repeat(1025) }, "群描述不能超过 1024 个字符"],
      [
        { groupSettingEnabled: false },
        "新群模式必须在群名称和群描述设置成功后开始拉人"
      ],
      [
        { groupSettingTiming: "AFTER_PULL" },
        "新群模式必须在群名称和群描述设置成功后开始拉人"
      ],
      [
        { useMaterialFileNameAsGroupName: true },
        "新群模式请填写群名称，不能使用料子文件名"
      ],
      [{ earlyPullCallCount: 2 }, "新群模式从首次调用起使用单次拉人数范围"],
      [{ pullCountMax: 4 }, "新群模式单次拉人数必须在 1–3 人范围内"],
      [{ pullCountMin: 2.5 }, "新群模式单次拉人数必须在 1–3 人范围内"],
      [
        { pullCountMin: 3, pullCountMax: 2 },
        "新群模式单次拉人数必须在 1–3 人范围内"
      ],
      [{ pullIntervalSeconds: 9 }, "新群模式拉人间隔必须在 10–15 秒范围内"],
      [{ pullIntervalMaxSeconds: 16 }, "新群模式拉人间隔必须在 10–15 秒范围内"],
      [
        { pullIntervalSeconds: 14, pullIntervalMaxSeconds: 13 },
        "新群模式拉人间隔必须在 10–15 秒范围内"
      ],
      [
        { pullIntervalMaxSeconds: Number.NaN },
        "新群模式拉人间隔必须在 10–15 秒范围内"
      ]
    ];
    for (const [invalidValues, expectedWarning] of invalidCases) {
      resetArmadaMockQueue([
        { list: [] },
        { list: [] },
        draft({ creationMode: "NEW_GROUP" })
      ]);
      const state = validState();
      await state.open();
      Object.assign(state.form, {
        creatorGroupId: 10,
        groupName: "测试群",
        groupDescription: "第一行\n第二行",
        ...invalidValues
      });
      resetArmadaMock({ id: 7 });
      resetElementPlusMock();

      await state.create();

      assert.equal(armadaCalls().length, 0, expectedWarning);
      assert.equal(elementPlusCalls().at(-1)?.text, expectedWarning);
    }
  });

  it("keeps successful create data when one initial request fails", async () => {
    const failureMessages = [
      "account groups unavailable",
      "group folders unavailable",
      "draft unavailable"
    ];

    for (const failedIndex of [0, 1, 2]) {
      const responses: unknown[] = [
        { list: [{ id: 11, name: "管理组" }] },
        { list: [{ id: 21, name: "历史群分组", groupCount: 12 }] },
        draft()
      ];
      responses[failedIndex] = Promise.reject(
        new Error(failureMessages[failedIndex])
      );
      resetArmadaMockQueue(responses);
      resetElementPlusMock();
      const state = useStandardPullTaskCreate({
        onCreated: async () => undefined
      });

      await state.open();

      assert.equal(state.visible.value, true);
      assert.equal(state.loading.value, false);
      assert.equal(
        state.accountGroups.value[0]?.name,
        failedIndex === 0 ? undefined : "管理组"
      );
      assert.equal(
        state.groupFolders.value[0]?.name,
        failedIndex === 1 ? undefined : "历史群分组"
      );
      assert.equal(state.draft.value.draftTaskId, failedIndex === 2 ? null : 7);
      assert.equal(
        elementPlusCalls().at(-1)?.text,
        failureMessages[failedIndex]
      );
    }
  });

  it("requires one group source and TXT material before creating", async () => {
    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const empty = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    empty.form.taskName = "普通群链接";

    await empty.create();

    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择群组分组或粘贴群链接");

    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const missingTxt = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    missingTxt.form.taskName = "普通群链接";
    missingTxt.form.groupFolderId = 21;

    await missingTxt.create();

    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请上传 TXT 料子文件");
  });

  it("requires a folder only for resource-pool mode", async () => {
    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "RESOURCE_POOL";
    state.form.taskName = "资源池任务";

    await state.create();

    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择群组资源池");
  });

  it("plans resource-pool TXT without links and freezes the folder on create", async () => {
    resetArmadaMockQueue([
      draft({
        creationMode: "RESOURCE_POOL",
        rows: [
          {
            rowId: 19,
            seq: 1,
            normalizedLink: null,
            sourceLinkLineNo: null,
            sourceFileName: "material.txt",
            totalLineCount: 1,
            validMemberCount: 1,
            invalidLineCount: 0,
            duplicateLineCount: 0
          }
        ]
      }),
      {
        id: 7,
        taskName: "资源池任务",
        status: "WAIT_START",
        groupCount: 1,
        expectedPullCount: 1
      }
    ]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "RESOURCE_POOL";
    state.form.taskName = "资源池任务";
    state.form.groupFolderId = 21;
    state.form.managerGroupId = 11;
    state.form.pullerGroupId = 12;
    state.addFiles([
      new File(["8613900000000"], "material.txt", { type: "text/plain" })
    ]);

    await state.create();

    const planPayload = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(planPayload.get("creationMode"), "RESOURCE_POOL");
    assert.equal(planPayload.get("groupFolderId"), null);
    assert.equal(planPayload.get("linksText"), "");
    const createPayload = (
      armadaCalls()[1].opts as { data: PullTaskStandardCreateRequest }
    ).data;
    assert.equal(createPayload.creationMode, "RESOURCE_POOL");
    assert.equal(createPayload.groupFolderId, 21);
  });

  it("only requires a station group when stations are used", async () => {
    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const missingGroups = validState();
    missingGroups.form.managerGroupId = "";
    await missingGroups.create();
    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择管理和拉手分组");

    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const optionalStation = validState();
    optionalStation.form.stationGroupId = "";
    optionalStation.form.stationCountPerCall = 0;
    await optionalStation.create();
    assert.equal(armadaCalls()[0]?.url, "/api/pull-tasks/standard");

    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const requiredStation = validState();
    requiredStation.form.stationGroupId = "";
    requiredStation.form.stationCountPerCall = 1;
    await requiredStation.create();
    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择站台分组");
  });

  it("creates one new group for each accepted TXT without a link source", async () => {
    resetArmadaMockQueue([
      draft({
        rows: [
          {
            rowId: 19,
            seq: 1,
            normalizedLink: null,
            sourceLinkLineNo: null,
            sourceFileName: "first-group.txt",
            totalLineCount: 1,
            validMemberCount: 1,
            invalidLineCount: 0,
            duplicateLineCount: 0
          },
          {
            rowId: 20,
            seq: 2,
            normalizedLink: null,
            sourceLinkLineNo: null,
            sourceFileName: "second-group.txt",
            totalLineCount: 1,
            validMemberCount: 1,
            invalidLineCount: 0,
            duplicateLineCount: 0
          }
        ],
        matchedCount: 2
      }),
      {
        id: 7,
        taskName: "新群任务",
        status: "WAIT_START",
        groupCount: 2,
        expectedPullCount: 2
      }
    ]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "NEW_GROUP";
    state.form.taskName = "新群任务";
    state.form.creatorGroupId = 10;
    state.form.managerGroupId = 11;
    state.form.pullerGroupId = 12;
    state.form.stationGroupId = 13;
    state.form.initialStationCount = 2;
    state.form.creatorLeaveAfterPull = true;
    state.form.groupSettingEnabled = true;
    state.form.groupName = "完整填写的群名";
    state.form.groupDescription = "第一行简介\n第二行简介";
    state.linksText.value = "https://chat.whatsapp.com/hidden-old-link";
    state.addFiles([
      new File(["8613900000000"], "first-group.txt", { type: "text/plain" }),
      new File(["8613900000001"], "second-group.txt", { type: "text/plain" })
    ]);

    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard/draft/plan", "/api/pull-tasks/standard"]
    );
    const planPayload = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(planPayload.get("creationMode"), "NEW_GROUP");
    assert.equal(planPayload.get("groupFolderId"), null);
    assert.equal(planPayload.get("linksText"), "");
    assert.deepEqual(
      planPayload.getAll("files").map(file => (file as File).name),
      ["first-group.txt", "second-group.txt"]
    );
    const createPayload = (
      armadaCalls()[1].opts as { data: PullTaskStandardCreateRequest }
    ).data;
    assert.equal(createPayload.creationMode, "NEW_GROUP");
    assert.equal(createPayload.creatorGroupId, 10);
    assert.equal(createPayload.initialStationCount, 2);
    assert.equal(createPayload.creatorLeaveAfterPull, true);
    assert.equal(createPayload.groupFolderId, null);
    assert.equal(createPayload.groupSetting.enabled, true);
    assert.equal(createPayload.groupSetting.settingTiming, "BEFORE_PULL");
    assert.equal(createPayload.groupSetting.groupName, "完整填写的群名");
    assert.equal(
      createPayload.groupSetting.groupDescription,
      "第一行简介\n第二行简介"
    );
    assert.equal(
      createPayload.groupSetting.useMaterialFileNameAsGroupName,
      false
    );
    assert.equal(createPayload.earlyPullCallCount, 0);
    assert.equal(createPayload.pullCountMin, 1);
    assert.equal(createPayload.pullCountMax, 3);
    assert.equal(createPayload.pullIntervalSeconds, 10);
    assert.equal(createPayload.pullIntervalMaxSeconds, 15);
  });

  it("allows an omitted manager group only in new-group mode", async () => {
    for (const pullerGroupId of [12, ""] as const) {
      resetArmadaMockQueue([draft({ creationMode: "NEW_GROUP" }), { id: 7 }]);
      resetElementPlusMock();
      const state = validState();
      state.form.creationMode = "NEW_GROUP";
      state.form.creatorGroupId = 10;
      state.form.managerGroupId = "";
      state.form.pullerGroupId = pullerGroupId;
      state.form.groupName = "客户群";
      state.form.groupDescription = "群简介";
      state.addFiles([new File(["8613900000000"], "new-group.txt")]);

      await state.create();

      if (pullerGroupId === "") {
        assert.equal(armadaCalls().length, 1);
        assert.equal(elementPlusCalls().at(-1)?.text, "请选择拉手分组");
      } else {
        assert.equal(armadaCalls().length, 2);
        assert.equal(armadaCalls()[1].url, "/api/pull-tasks/standard");
        const payload = (
          armadaCalls()[1].opts as {
            data: PullTaskStandardCreateRequest;
          }
        ).data;
        assert.equal(payload.managerGroupId, null);
        assert.equal(payload.creatorGroupId, 10);
        assert.equal(payload.pullerGroupId, 12);
      }
    }
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
    state.form.groupFolderId = 21;
    state.linksText.value = "https://chat.whatsapp.com/code";
    const file = new File(["8613900000000"], "extra.txt", {
      type: "text/plain"
    });
    state.addFiles([file]);

    await state.plan();

    const payload = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(payload.get("groupFolderId"), "21");
    assert.equal(payload.get("linksText"), state.linksText.value);
    assert.deepEqual(
      state.pendingFiles.value.map(item => item.name),
      ["extra.txt"]
    );
  });

  it("automatically plans combined folder and pasted-link sources before create", async () => {
    resetArmadaMockQueue([
      draft(),
      {
        id: 7,
        taskName: "普通群链接",
        status: "WAIT_START",
        groupCount: 1,
        expectedPullCount: 1
      }
    ]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.taskName = "普通群链接";
    state.form.groupFolderId = 21;
    state.form.managerGroupId = 11;
    state.form.pullerGroupId = 12;
    state.linksText.value = "https://chat.whatsapp.com/manual-code";
    state.addFiles([
      new File(["8613900000000"], "material.txt", { type: "text/plain" })
    ]);

    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard/draft/plan", "/api/pull-tasks/standard"]
    );
    const planPayload = (armadaCalls()[0].opts as { data: FormData }).data;
    assert.equal(planPayload.get("groupFolderId"), "21");
    assert.equal(
      planPayload.get("linksText"),
      "https://chat.whatsapp.com/manual-code"
    );
    assert.deepEqual(
      planPayload.getAll("files").map(file => (file as File).name),
      ["material.txt"]
    );
  });

  it("sends TXT files in the user-adjusted order", async () => {
    resetArmadaMock(draft({ rows: [], matchedCount: 0, ignoredFileCount: 2 }));
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.linksText.value = "https://chat.whatsapp.com/code";
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

  it("posts every approved execution and group-setting field", async () => {
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
    state.form.pullerSyncMode = "BATCH";
    state.form.creatorLeaveAfterPull = true;
    state.form.clearExistingMembers = true;
    state.form.pullerJoinByLink = true;
    state.form.managerFinishGroupId = 31;
    state.form.pullerFinishGroupId = 32;
    state.form.groupSettingEnabled = true;
    state.form.groupSettingTiming = "BEFORE_PULL";
    state.form.groupName = "前端验收群名";
    state.form.useMaterialFileNameAsGroupName = true;
    state.form.groupDescription = "前端验收群描述";
    state.form.autoCloseMuteAfterTask = true;
    state.form.autoCloseInviteAfterTask = true;
    state.form.editPermission = "ALLOW";
    state.form.muteMode = "MUTE";
    state.form.linkPermission = "ALL";
    state.form.disappearingMessage = "ONE_DAY";

    await state.create();

    const payload = (armadaCalls()[0].opts as { data: Record<string, unknown> })
      .data;
    assert.equal(armadaCalls()[0].url, "/api/pull-tasks/standard");
    assert.deepEqual(Object.keys(payload).sort(), [
      "autoStart",
      "clearExistingMembers",
      "concurrentGroupCount",
      "creationMode",
      "creatorLeaveAfterPull",
      "draftTaskId",
      "earlyPullCallCount",
      "earlyPullCount",
      "groupFolderId",
      "groupSetting",
      "managerFinishGroupId",
      "managerGroupId",
      "materialAdminTiming",
      "pullCountMax",
      "pullCountMin",
      "pullIntervalMaxSeconds",
      "pullIntervalSeconds",
      "pullerCountPerGroup",
      "pullerFinishGroupId",
      "pullerGroupId",
      "pullerJoinByLink",
      "pullerSyncMode",
      "remark",
      "stationCountPerCall",
      "stationGroupId",
      "taskName"
    ]);
    assert.equal("version" in payload, false);
    assert.equal(payload.managerGroupId, 11);
    assert.equal(payload.pullerGroupId, 12);
    assert.equal(payload.stationGroupId, 13);
    assert.equal(payload.creationMode, "PASTED_LINK");
    assert.equal(payload.creatorLeaveAfterPull, true);
    assert.equal("creatorGroupId" in payload, false);
    assert.equal("initialStationCount" in payload, false);
    assert.equal(payload.earlyPullCount, 1);
    assert.equal(payload.earlyPullCallCount, 2);
    assert.equal(payload.pullIntervalMaxSeconds, payload.pullIntervalSeconds);
    assert.equal(payload.pullerJoinByLink, true);
    assert.deepEqual(payload.groupSetting, {
      enabled: true,
      settingTiming: "BEFORE_PULL",
      groupName: null,
      useMaterialFileNameAsGroupName: true,
      avatarFileKey: null,
      groupDescription: "前端验收群描述",
      autoCloseMuteAfterTask: true,
      autoCloseInviteAfterTask: true,
      editPermission: "ALLOW",
      muteMode: "MUTE",
      linkPermission: "ALL",
      disappearingMessage: "ONE_DAY"
    });
    assert.equal(refreshes, 1);
    assert.equal(state.visible.value, false);
  });

  it("uploads a valid avatar once and reuses its key after create failure", async () => {
    resetArmadaMockQueue([
      {
        avatarFileKey: "stored-avatar.png",
        originalFileName: "avatar.png",
        previewUrl: "/api/pull-tasks/standard/group-avatars/stored-avatar.png"
      },
      Promise.reject(new Error("create failed"))
    ]);
    resetElementPlusMock();
    const state = validState();
    const avatar = new File([new Uint8Array([1])], "avatar.PNG", {
      type: "image/png"
    });

    await state.setGroupAvatarFile(avatar);
    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard/group-avatars", "/api/pull-tasks/standard"]
    );
    assert.equal(state.groupAvatarFile.value, avatar);
    assert.equal(
      state.uploadedAvatar.value?.avatarFileKey,
      "stored-avatar.png"
    );

    resetArmadaMock({ id: 7 });
    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard"]
    );
    const payload = (
      armadaCalls()[0].opts as {
        data: { groupSetting: { avatarFileKey: string | null } };
      }
    ).data;
    assert.equal(payload.groupSetting.avatarFileKey, "stored-avatar.png");
    assert.equal(state.groupAvatarFile.value, null);
    assert.equal(state.uploadedAvatar.value, null);
  });

  it("does not create when avatar upload fails", async () => {
    resetArmadaMockQueue([Promise.reject(new Error("upload failed"))]);
    resetElementPlusMock();
    const state = validState();
    const avatar = new File([new Uint8Array([1])], "avatar.jpg", {
      type: "image/jpeg"
    });

    await state.setGroupAvatarFile(avatar);
    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard/group-avatars"]
    );
    assert.equal(state.groupAvatarFile.value, avatar);
    assert.equal(state.uploadedAvatar.value, null);
  });

  it("deletes an uploaded unbound avatar when replacing or clearing it", async () => {
    resetArmadaMockQueue([
      {
        avatarFileKey: "first.png",
        originalFileName: "first.png",
        previewUrl: "/preview/first.png"
      },
      Promise.reject(new Error("create failed"))
    ]);
    resetElementPlusMock();
    const state = validState();
    const first = new File([new Uint8Array([1])], "first.png", {
      type: "image/png"
    });
    const second = new File([new Uint8Array([2])], "second.jpg", {
      type: "image/jpeg"
    });
    await state.setGroupAvatarFile(first);
    await state.create();

    resetArmadaMock(undefined);
    await state.setGroupAvatarFile(second);

    assert.equal(
      armadaCalls()[0]?.url,
      "/api/pull-tasks/standard/group-avatars/first.png"
    );
    assert.equal(state.groupAvatarFile.value, second);
    assert.equal(state.uploadedAvatar.value, null);

    state.uploadedAvatar.value = {
      avatarFileKey: "second.jpg",
      originalFileName: "second.jpg",
      previewUrl: "/preview/second.jpg"
    };
    resetArmadaMock(undefined);
    await state.clearGroupAvatar();
    assert.equal(
      armadaCalls()[0]?.url,
      "/api/pull-tasks/standard/group-avatars/second.jpg"
    );
    assert.equal(state.groupAvatarFile.value, null);
    assert.equal(state.uploadedAvatar.value, null);
  });

  it("blocks unsupported or oversized avatar files locally", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    const state = validState();

    await state.setGroupAvatarFile(
      new File([new Uint8Array([1])], "avatar.gif", { type: "image/gif" })
    );
    await state.setGroupAvatarFile(
      new File([new Uint8Array(512_001)], "avatar.png", {
        type: "image/png"
      })
    );

    assert.equal(state.groupAvatarFile.value, null);
    assert.equal(armadaCalls().length, 0);
    assert.equal(
      elementPlusCalls().filter(call => call.type === "warning").length,
      2
    );
  });

  it("accepts JPG, JPEG and PNG avatars up to exactly 500K", async () => {
    resetArmadaMock(undefined);
    resetElementPlusMock();
    const state = validState();
    const files = [
      new File([new Uint8Array([1])], "first.JPG", { type: "image/jpeg" }),
      new File([new Uint8Array([1])], "second.jpeg", {
        type: "image/jpeg"
      }),
      new File([new Uint8Array(512_000)], "limit.png", {
        type: "image/png"
      })
    ];

    for (const file of files) {
      await state.setGroupAvatarFile(file);
      assert.equal(state.groupAvatarFile.value, file);
    }

    assert.equal(elementPlusCalls().length, 0);
    assert.equal(armadaCalls().length, 0);
  });

  it("automatically refreshes the plan after the source folder changes", async () => {
    resetArmadaMockQueue([
      draft(),
      draft(),
      {
        id: 7,
        taskName: "普通群链接",
        status: "WAIT_START",
        groupCount: 1,
        expectedPullCount: 1
      }
    ]);
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.groupFolderId = 21;

    await state.plan();
    state.form.groupFolderId = 22;
    state.form.taskName = "普通群链接";
    state.form.managerGroupId = 11;
    state.form.pullerGroupId = 12;
    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/pull-tasks/standard/draft/plan",
        "/api/pull-tasks/standard/draft/plan",
        "/api/pull-tasks/standard"
      ]
    );
  });

  it("allows creation from frozen rows when valid links remain unmatched", async () => {
    resetArmadaMock({
      id: 7,
      taskName: "普通群链接",
      status: "WAIT_START",
      groupCount: 1,
      expectedPullCount: 1
    });
    resetElementPlusMock();
    const state = validState();
    state.draft.value = draft({ remainingLinkCount: 2 });

    await state.create();

    assert.equal(armadaCalls()[0]?.url, "/api/pull-tasks/standard");
  });

  it("automatically refreshes the plan after pasted links change", async () => {
    resetArmadaMockQueue([
      draft(),
      {
        id: 7,
        taskName: "普通群链接",
        status: "WAIT_START",
        groupCount: 1,
        expectedPullCount: 1
      }
    ]);
    resetElementPlusMock();
    const state = validState();
    state.linksText.value = "https://chat.whatsapp.com/new-code";

    await state.create();

    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/pull-tasks/standard/draft/plan", "/api/pull-tasks/standard"]
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

  it("posts enabled=false inside the group setting when the switch stays off", async () => {
    resetArmadaMock({
      id: 7,
      taskName: "普通群链接",
      status: "WAIT_START",
      groupCount: 1,
      expectedPullCount: 1
    });
    resetElementPlusMock();
    const state = validState();

    await state.create();

    const payload = (
      armadaCalls()[0].opts as {
        data: { groupSetting: { enabled: boolean } };
      }
    ).data;
    assert.equal(armadaCalls()[0].url, "/api/pull-tasks/standard");
    assert.equal(payload.groupSetting.enabled, false);
  });

  it("rejects a non-integer or negative initial station count", async () => {
    for (const invalidCount of [-1, 1.5]) {
      resetArmadaMockQueue([
        draft({
          creationMode: "NEW_GROUP",
          rows: [
            {
              rowId: 19,
              seq: 1,
              normalizedLink: null,
              sourceLinkLineNo: null,
              sourceFileName: "new-group.txt",
              totalLineCount: 1,
              validMemberCount: 1,
              invalidLineCount: 0,
              duplicateLineCount: 0
            }
          ]
        })
      ]);
      resetElementPlusMock();
      const state = useStandardPullTaskCreate({
        onCreated: async () => undefined
      });
      state.form.creationMode = "NEW_GROUP";
      state.form.taskName = "新群任务";
      state.form.creatorGroupId = 10;
      state.form.managerGroupId = 11;
      state.form.pullerGroupId = 12;
      state.form.stationGroupId = 13;
      state.form.initialStationCount = invalidCount;
      state.addFiles([new File(["8613900000000"], "new-group.txt")]);

      await state.create();

      assert.deepEqual(
        armadaCalls().map(call => call.url),
        ["/api/pull-tasks/standard/draft/plan"]
      );
      assert.equal(
        elementPlusCalls().at(-1)?.text,
        "建群时初始站台数必须是非负整数"
      );
    }
  });

  it("keeps draft planning errors available inside the create drawer", async () => {
    resetArmadaMock(Promise.reject(new Error("TXT 不是纯文本")));
    resetElementPlusMock();
    const state = useStandardPullTaskCreate({
      onCreated: async () => undefined
    });
    state.form.creationMode = "NEW_GROUP";
    state.addFiles([new File(["\0"], "binary.txt")]);

    assert.equal(await state.plan(), false);
    assert.equal(state.resourceError.value, "TXT 不是纯文本");
    assert.equal(
      elementPlusCalls().some(call => call.type === "error"),
      false
    );
  });
});

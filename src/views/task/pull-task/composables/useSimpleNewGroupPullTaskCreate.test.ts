import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { useSimpleNewGroupPullTaskCreate } from "./useSimpleNewGroupPullTaskCreate";
import { useDirectLinkPullTaskCreate } from "./useDirectLinkPullTaskCreate";

function validState() {
  const state = useSimpleNewGroupPullTaskCreate({
    onCreated: async () => undefined
  });
  state.form.creatorGroupId = 11;
  state.form.managerGroupId = 12;
  state.form.pullerGroupId = 13;
  state.form.groupName = "  测试群  ";
  state.addFiles([new File(["12345678900"], "members.txt")]);
  return state;
}
async function sentRequest() {
  const call = armadaCalls().at(-1)!;
  assert.equal(call.url, "/api/pull-tasks/standard/simple-new-group");
  const data = (call.opts as { data: FormData }).data;
  const request = data.get("request") as Blob;
  assert.equal(request.type, "application/json");
  return {
    request: JSON.parse(await request.text()) as Record<string, unknown>,
    data
  };
}

describe("simple new-group immediate creation", () => {
  it("starts without deletion or early calls and loads no draft or target groups", async () => {
    resetArmadaMock({ list: [] });
    const state = validState();
    assert.equal(state.form.creatorDeleteAfterTakeover, false);
    assert.equal(state.form.earlyPullCallCount, 0);
    assert.equal(state.form.pullCountMin, 1);
    assert.equal(state.form.pullCountMax, 3);
    assert.equal(state.form.pullIntervalSeconds, 10);
    assert.equal(state.form.pullIntervalMaxSeconds, 15);
    await state.load();
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/account-groups"]
    );
  });

  it("sends only the contracted fields, retaining both roles and archive groups", async () => {
    resetArmadaMock({ id: 8 });
    const state = validState();
    state.form.taskName = "  简化新群  ";
    state.form.autoStart = false;
    state.form.managerFinishGroupId = 21;
    state.form.pullerFinishGroupId = 22;
    state.form.creatorDeleteAfterTakeover = true;
    state.form.groupDescription = "  群公告  ";
    // Even if a stale UI object is supplied, legacy options must never cross the API.
    Object.assign(state.form, {
      draftTaskId: 99,
      clearExistingMembers: true,
      groupFolderId: 66
    });
    state.addPackages([31]);
    await state.create();
    const { request, data } = await sentRequest();
    assert.deepEqual(
      Object.keys(request).sort(),
      [
        "requestId",
        "taskName",
        "remark",
        "autoStart",
        "packageIds",
        "earlyPullCount",
        "earlyPullCallCount",
        "pullCountMin",
        "pullCountMax",
        "pullIntervalSeconds",
        "pullIntervalMaxSeconds",
        "pullerCountPerGroup",
        "stationCountPerCall",
        "concurrentGroupCount",
        "pullerGroupId",
        "stationGroupId",
        "pullerFinishGroupId",
        "creatorGroupId",
        "managerGroupId",
        "managerFinishGroupId",
        "creatorDeleteAfterTakeover",
        "groupName",
        "avatarFileKey",
        "groupDescription"
      ].sort()
    );
    assert.equal(request.taskName, "简化新群");
    assert.equal(request.autoStart, 0);
    assert.equal(request.creatorGroupId, 11);
    assert.equal(request.managerGroupId, 12);
    assert.equal(request.pullerGroupId, 13);
    assert.equal(request.managerFinishGroupId, 21);
    assert.equal(request.pullerFinishGroupId, 22);
    assert.equal(request.creatorDeleteAfterTakeover, true);
    assert.equal(request.groupName, "测试群");
    assert.equal(request.groupDescription, "群公告");
    assert.equal(request.stationGroupId, null);
    assert.equal(request.avatarFileKey, null);
    assert.deepEqual(request.packageIds, [31]);
    assert.equal(data.getAll("files").length, 1);
    assert.equal(armadaCalls().length, 1);
  });

  it("accepts package-only creation with optional announcement and avatar omitted", async () => {
    resetArmadaMock({ id: 8 });
    const state = validState();
    state.removeFile("members.txt");
    state.addPackages([21, 21]);
    await state.create();
    const { request, data } = await sentRequest();
    assert.deepEqual(request.packageIds, [21]);
    assert.equal(request.groupDescription, null);
    assert.equal(request.avatarFileKey, null);
    assert.equal(data.getAll("files").length, 0);
  });

  it("requires creator and manager even when creator deletion is disabled", async () => {
    for (const field of [
      "creatorGroupId",
      "managerGroupId",
      "pullerGroupId"
    ] as const) {
      resetArmadaMock({ id: 8 });
      const state = validState();
      state.form[field] = "";
      await state.create();
      assert.equal(armadaCalls().length, 0, field);
      assert.match(state.error, /分组/);
    }
  });

  it("enforces new-group pull limits and requires a station group only when needed", async () => {
    for (const change of [
      { pullCountMin: 0 },
      { pullCountMax: 51 },
      { pullCountMin: 2.5 },
      { pullCountMin: 3, pullCountMax: 2 },
      { pullIntervalSeconds: -1 },
      { pullIntervalMaxSeconds: Number.NaN },
      { pullIntervalMaxSeconds: 20.5 },
      { pullIntervalSeconds: 15, pullIntervalMaxSeconds: 10 },
      { earlyPullCallCount: 1 },
      { stationCountPerCall: 1 },
      { groupName: " " }
    ]) {
      resetArmadaMock({ id: 8 });
      const state = validState();
      Object.assign(state.form, change);
      await state.create();
      assert.equal(armadaCalls().length, 0, JSON.stringify(change));
      assert.notEqual(state.error, "");
    }
    const state = validState();
    state.form.stationCountPerCall = 1;
    state.form.stationGroupId = 14;
    await state.create();
    assert.equal((await sentRequest()).request.stationGroupId, 14);
  });

  it("submits up to 50 members with custom intervals without clamping", async () => {
    for (const [
      pullCountMin,
      pullCountMax,
      pullIntervalSeconds,
      pullIntervalMaxSeconds
    ] of [
      [10, 15, 5, 8],
      [1, 50, 20, 30],
      [50, 50, 0, 0]
    ]) {
      resetArmadaMock({ id: 8 });
      const state = validState();
      const parameters = {
        pullCountMin,
        pullCountMax,
        pullIntervalSeconds,
        pullIntervalMaxSeconds
      };
      Object.assign(state.form, parameters);
      await state.create();
      assert.equal(state.error, "");
      const { request } = await sentRequest();
      for (const [key, value] of Object.entries(parameters)) {
        assert.equal(request[key], value, key);
      }
    }
  });

  it("preserves retry identity and keeps independent state from direct-link mode", async () => {
    resetArmadaMockFailure(new Error("timeout"));
    const state = validState();
    const direct = useDirectLinkPullTaskCreate({
      onCreated: async () => undefined
    });
    direct.form.linksText = "https://chat.whatsapp.com/old";
    direct.addPackages([99]);
    await state.create();
    const first = (await sentRequest()).request;
    await state.create();
    assert.equal((await sentRequest()).request.requestId, first.requestId);
    state.form.groupName = "修改群名";
    await state.create();
    assert.notEqual((await sentRequest()).request.requestId, first.requestId);
    assert.deepEqual(direct.packageIds, [99]);
    assert.equal(state.files.length, 1);
  });

  it("uploads the avatar through the existing endpoint before one final creation", async () => {
    resetArmadaMockQueue([
      {
        avatarFileKey: "avatar-key",
        originalFileName: "group.png",
        previewUrl: "/avatar"
      },
      { id: 8 }
    ]);
    const state = validState();
    state.setAvatar(
      new File(["avatar bytes"], "group.png", { type: "image/png" })
    );
    await state.create();
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/pull-tasks/standard/group-avatars",
        "/api/pull-tasks/standard/simple-new-group"
      ]
    );
    assert.equal((await sentRequest()).request.avatarFileKey, "avatar-key");
    assert.equal(state.avatar.file, null);
  });
});

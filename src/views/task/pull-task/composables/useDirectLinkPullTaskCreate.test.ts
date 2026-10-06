import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { useDirectLinkPullTaskCreate } from "./useDirectLinkPullTaskCreate";

function validState(onCreated: () => Promise<void> = async () => undefined) {
  const state = useDirectLinkPullTaskCreate({ onCreated });
  state.form.taskName = "群链接模式（新）";
  state.form.pullerGroupId = 12;
  state.form.linksText = "https://chat.whatsapp.com/example";
  state.addFiles([new File(["12345678900"], "members.txt")]);
  return state;
}

async function sentRequest(): Promise<Record<string, unknown>> {
  const call = armadaCalls().at(-1)!;
  assert.equal(call.url, "/api/pull-tasks/standard/direct-link");
  const data = (call.opts as { data: FormData }).data;
  assert.equal(data.getAll("files").length, 1);
  const request = data.get("request") as Blob;
  assert.equal(request.type, "application/json");
  return JSON.parse(await request.text());
}

describe("direct-link creation without server drafts", () => {
  it("loads only reference lists and keeps resource edits in memory", async () => {
    resetArmadaMockQueue([{ list: [] }, { list: [] }]);
    const state = validState();
    await state.load();
    state.addPackages([21, 22, 21]);
    state.removePackage(22);
    assert.deepEqual(state.packageIds, [21]);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/account-groups", "/api/group-folders"]
    );
  });

  it("creates once without manager, draft, strategy or group-setting fields", async () => {
    resetArmadaMock({ id: 7 });
    let created = 0;
    const state = validState(async () => {
      created += 1;
    });
    await state.create();
    const request = await sentRequest();
    assert.equal(armadaCalls().length, 1);
    assert.equal(request.pullerGroupId, 12);
    assert.equal(request.stationGroupId, null);
    assert.match(String(request.requestId), /^[0-9a-f-]{36}$/);
    for (const forbidden of [
      "draftTaskId",
      "managerGroupId",
      "managerFinishGroupId",
      "materialAdminTiming",
      "groupSetting",
      "pullerSyncMode"
    ]) {
      assert.equal(forbidden in request, false, forbidden);
    }
    assert.equal(created, 1);
    assert.equal(state.files.length, 0);
  });

  it("preserves the request id and inputs after an uncertain failure", async () => {
    resetArmadaMockFailure(new Error("timeout"));
    const state = validState();
    await state.create();
    const first = await sentRequest();
    assert.equal(state.files.length, 1);
    resetArmadaMock({ id: 7 });
    await state.create();
    const retried = await sentRequest();
    assert.equal(retried.requestId, first.requestId);
  });

  it("uses a different request id when failed input is changed", async () => {
    resetArmadaMockFailure(new Error("invalid group"));
    const state = validState();
    await state.create();
    const first = await sentRequest();
    state.form.linksText = "https://chat.whatsapp.com/another";
    await state.create();
    const changed = await sentRequest();
    assert.notEqual(changed.requestId, first.requestId);
  });

  it("requires stations only when station count is nonzero", async () => {
    resetArmadaMock({ id: 7 });
    const state = validState();
    state.form.stationCountPerCall = 1;
    await state.create();
    assert.equal(armadaCalls().length, 0);
    assert.match(state.error, /站台分组/);
    state.form.stationGroupId = 14;
    await state.create();
    assert.equal((await sentRequest()).stationGroupId, 14);
  });
});

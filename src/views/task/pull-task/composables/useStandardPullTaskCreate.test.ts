import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMock
} from "@/api/__tests__/armada-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import { useStandardPullTaskCreate } from "./useStandardPullTaskCreate";

function validState(onCreated: () => Promise<void> = async () => undefined) {
  const state = useStandardPullTaskCreate({ onCreated });
  state.form.taskName = "普通拉群";
  state.form.pullerGroupId = 22;
  state.form.materialText = "8613900000000";
  return state;
}

describe("standard pull task create state", () => {
  it("requires a group link only in OLD_LINK mode", async () => {
    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const oldLink = validState();

    await oldLink.create();

    assert.equal(armadaCalls().length, 0);
    assert.deepEqual(elementPlusCalls().at(-1), {
      type: "warning",
      text: "老群链接任务请选择或粘贴群链接"
    });

    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const createNew = validState();
    createNew.form.subMode = "CREATE_NEW";
    await createNew.create();
    assert.equal(armadaCalls()[0]?.url, "/api/pull-tasks");
  });

  it("requires puller accounts and material", async () => {
    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const missingPuller = validState();
    missingPuller.form.subMode = "CREATE_NEW";
    missingPuller.form.pullerGroupId = "";
    await missingPuller.create();
    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请选择拉手分组");

    resetArmadaMock({ id: 1 });
    resetElementPlusMock();
    const missingMaterial = validState();
    missingMaterial.form.subMode = "CREATE_NEW";
    missingMaterial.form.materialText = "  ";
    await missingMaterial.create();
    assert.equal(armadaCalls().length, 0);
    assert.equal(elementPlusCalls().at(-1)?.text, "请粘贴或上传料子数据");
  });

  it("posts the preserved payload and refreshes after success", async () => {
    resetArmadaMock({ id: 7 });
    resetElementPlusMock();
    let refreshes = 0;
    const state = validState(async () => {
      refreshes += 1;
    });
    state.visible.value = true;
    state.form.groupLinkIds = [11];
    state.form.pastedLinks = " https://chat.whatsapp.com/a \n\n";

    await state.create();

    const payload = (
      armadaCalls()[0]?.opts as { data: Record<string, unknown> }
    ).data;
    assert.equal(armadaCalls()[0]?.method, "post");
    assert.equal(armadaCalls()[0]?.url, "/api/pull-tasks");
    assert.equal(payload.taskName, "普通拉群");
    assert.equal(payload.subMode, "OLD_LINK");
    assert.deepEqual(payload.groupLinkIds, [11]);
    assert.deepEqual(payload.pastedLinks, ["https://chat.whatsapp.com/a"]);
    assert.equal(payload.pullerGroupId, 22);
    assert.equal(payload.materialText, "8613900000000");
    assert.deepEqual(payload.groupProfile, {
      groupName: null,
      mute: false,
      linkPermission: "所有成员可邀请",
      editPermission: "仅管理员可编辑",
      autoCloseInvite: false
    });
    assert.equal(refreshes, 1);
    assert.equal(state.visible.value, false);
  });
});

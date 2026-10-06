import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isNewGroupCreationMode,
  pullTaskCreationModeLabel,
  stageLabelForCreationMode,
  stagesForCreationMode
} from "./creation-mode-display";

describe("simple new-group workflow display", () => {
  it("distinguishes the new mode from both existing modes", () => {
    assert.equal(
      pullTaskCreationModeLabel("SIMPLE_NEW_GROUP"),
      "新群模式（新）"
    );
    assert.equal(pullTaskCreationModeLabel("NEW_GROUP"), "新群模式");
    assert.equal(pullTaskCreationModeLabel("DIRECT_LINK"), "群链接模式（新）");
    assert.equal(isNewGroupCreationMode("SIMPLE_NEW_GROUP"), true);
    assert.equal(isNewGroupCreationMode("NEW_GROUP"), true);
    assert.equal(isNewGroupCreationMode("DIRECT_LINK"), false);
  });
  it("keeps creation, management takeover and deletion while removing contact and material admin stages", () => {
    assert.deepEqual(
      stagesForCreationMode("SIMPLE_NEW_GROUP").map(stage => stage.value),
      [9, 2, 3, 11, 12, 10, 6, 8]
    );
    assert.equal(
      stageLabelForCreationMode(3, "SIMPLE_NEW_GROUP"),
      "管理员接管"
    );
    assert.equal(stageLabelForCreationMode(3, "PASTED_LINK"), "管理员设置");
    assert.equal(stageLabelForCreationMode(4, "SIMPLE_NEW_GROUP"), "准备拉手");
    assert.equal(
      stageLabelForCreationMode(4, "PASTED_LINK"),
      "管理—拉手联系人"
    );
    assert.equal(
      stageLabelForCreationMode(12, "SIMPLE_NEW_GROUP"),
      "等待创建者清理"
    );
    assert.deepEqual(
      stagesForCreationMode("DIRECT_LINK").map(stage => stage.value),
      [1, 10, 6, 8]
    );
  });
});

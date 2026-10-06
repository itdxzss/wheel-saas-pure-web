import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEditCreatorDeletion,
  creatorDeletionLabel
} from "./creator-deletion-display";
import { standardStageLabel } from "./standard-execution-display";

describe("creator deletion progress and frozen configuration", () => {
  it("keeps accepted deletion behind the cleanup verification gate", () => {
    assert.equal(
      creatorDeletionLabel({ creatorDeletionStatus: "ACCEPTED" }),
      "等待创建者清理"
    );
    assert.equal(creatorDeletionLabel({ stage: 12 }), "等待创建者清理");
    assert.equal(
      creatorDeletionLabel({ creatorDeletionStatus: "COMPLETE" }),
      "注销及创建者清理完成"
    );
    assert.equal(
      creatorDeletionLabel({ creatorDeletionStatus: "UNKNOWN" }),
      "注销结果未知"
    );
    assert.equal(
      creatorDeletionLabel({ creatorDeletionStatus: "FAILED" }),
      "注销失败"
    );
    assert.equal(
      creatorDeletionLabel({ creatorDeletionStatus: "FUTURE_STATUS" }),
      "注销状态待核实（FUTURE_STATUS）"
    );
    assert.equal(creatorDeletionLabel({ stage: 6 }), "");
    assert.equal(standardStageLabel(11), "注销建群账号");
    assert.equal(standardStageLabel(12), "等待创建者清理");
  });

  it("allows only confirmed never-started tasks to change configuration", () => {
    assert.equal(canEditCreatorDeletion("WAIT_START", null), true);
    assert.equal(canEditCreatorDeletion("WAIT_START", undefined), false);
    assert.equal(canEditCreatorDeletion("WAIT_START", 1), false);
    for (const status of [
      "EXECUTING",
      "PAUSED",
      "INTERRUPTED",
      "COMPLETED",
      "ENDED"
    ]) {
      assert.equal(canEditCreatorDeletion(status, null), false);
    }
  });
});

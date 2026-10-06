import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pullTaskCreationModeLabel,
  stagesForCreationMode
} from "./creation-mode-display";
import {
  standardStageLabel,
  standardExecutionStatus
} from "./standard-execution-display";

describe("direct-link task display", () => {
  it("keeps existing mode labels and labels the new workflow", () => {
    assert.equal(pullTaskCreationModeLabel("PASTED_LINK"), "群链接模式");
    assert.equal(pullTaskCreationModeLabel("NEW_GROUP"), "新群模式");
    assert.equal(pullTaskCreationModeLabel("DIRECT_LINK"), "群链接模式（新）");
  });
  it("uses direct join stage and excludes management from its stage filters", () => {
    assert.equal(standardStageLabel(10), "拉手进群");
    assert.deepEqual(
      stagesForCreationMode("DIRECT_LINK").map(item => item.value),
      [1, 10, 6, 8]
    );
    assert.equal(
      stagesForCreationMode("PASTED_LINK").some(item => item.value === 10),
      false
    );
    assert.equal(
      stagesForCreationMode("PASTED_LINK").some(item => item.value === 3),
      true
    );
  });
  it("shows pending approval for an ordinary puller's join request", () => {
    assert.equal(
      standardExecutionStatus({
        executionStatus: 3,
        stage: 10,
        waitResourceType: 4,
        reasonCode: "PULLER_JOIN_PENDING_APPROVAL"
      }),
      "WAITING_APPROVAL"
    );
  });
});

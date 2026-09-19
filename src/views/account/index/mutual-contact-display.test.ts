import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validMutualForm,
  mutualItemStatus,
  mutualReason
} from "./mutual-contact-display";
test("requires distinct groups and accepts zero but not fractional or negative intervals", () => {
  assert.equal(validMutualForm(1, 2, 0), true);
  for (const args of [
    [1, 1, 0],
    [1, 2, -1],
    [1, 2, 0.5],
    [1, 2, 3601],
    [undefined, 2, 0]
  ]) {
    assert.equal(validMutualForm(...(args as [number, number, number])), false);
  }
});
test("unknown results are displayed distinctly and raw error codes remain diagnosable", () => {
  assert.equal(mutualItemStatus[5], "结果待确认");
  assert.match(mutualReason("RESULT_TIMEOUT"), /等待确认/);
  assert.equal(mutualReason("NEW_CODE"), "NEW_CODE");
});

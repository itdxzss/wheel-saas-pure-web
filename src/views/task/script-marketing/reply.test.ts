import { test } from "node:test";
import assert from "node:assert/strict";
import { moveStep, validateReplies } from "./reply";
import {
  cloneScriptSteps,
  hydrateScriptSteps,
  copyStep,
  mayRemove,
  newStep,
  toScriptSave
} from "./form";

function conversation() {
  const steps = [newStep("ADMIN"), newStep(), newStep("ADMIN")];
  steps[1].replyToStepId = steps[0].stepId;
  return steps;
}
test("save and reopen preserve reply identity while individual copies receive new IDs", () => {
  const steps = conversation();
  const wire = toScriptSave({
    steps,
    taskName: "test",
    accountGroupId: 1,
    intervalSeconds: 10,
    startAt: null,
    endAt: null,
    groupLinkIds: [1]
  }).steps;
  const reopened = hydrateScriptSteps(wire);
  assert.equal(reopened[1].replyToStepId, reopened[0].stepId);
  assert.equal(reopened[0].stepId, steps[0].stepId);
  const copied = copyStep(reopened[1]);
  assert.notEqual(copied.stepId, reopened[1].stepId);
  assert.equal(copied.replyToStepId, reopened[0].stepId);
});
test("whole-script clone remaps references and isolates edits", () => {
  const original = conversation();
  const cloned = cloneScriptSteps(original);
  assert.notEqual(cloned[0].stepId, original[0].stepId);
  assert.equal(cloned[1].replyToStepId, cloned[0].stepId);
  cloned[0].message.content = "changed";
  assert.notEqual(original[0].message.content, cloned[0].message.content);
});
test("referenced source cannot be deleted or moved behind its reply", () => {
  const steps = conversation();
  assert.equal(mayRemove(steps, 0), false);
  const before = steps.map(s => s.stepId);
  assert.equal(moveStep(steps, 0, 2), false);
  assert.deepEqual(
    steps.map(s => s.stepId),
    before
  );
  assert.equal(moveStep(steps, 2, 0), true);
  assert.equal(validateReplies(steps), undefined);
});
test("self, forward, missing and duplicate references are rejected", () => {
  const steps = conversation();
  for (const target of [steps[1].stepId, steps[2].stepId, "missing"]) {
    steps[1].replyToStepId = target;
    assert.match(validateReplies(steps)!, /回复目标/);
  }
  steps[1].replyToStepId = null;
  steps[1].stepId = steps[0].stepId;
  assert.match(validateReplies(steps)!, /标识/);
});
test("legacy steps receive deterministic IDs without inventing replies", () => {
  const legacy = [newStep("ADMIN"), newStep()].map(
    ({ stepId: _stepId, replyToStepId: _replyToStepId, ...step }) => step
  );
  const first = hydrateScriptSteps(legacy);
  const second = hydrateScriptSteps(legacy);
  assert.deepEqual(
    first.map(s => s.stepId),
    second.map(s => s.stepId)
  );
  assert.equal(first[1].replyToStepId, null);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newStep,
  copyStep,
  mayRemove,
  validateScript,
  toScriptSave
} from "./form";

const validForm = () => {
  const steps = [newStep("ADMIN"), newStep()];
  steps.forEach((step, index) => {
    step.accountId = index + 1;
    step.message.content = `message ${index}`;
  });
  return {
    taskName: "test",
    intervalSeconds: 10,
    startAt: null,
    endAt: null,
    groupLinkIds: [1],
    steps
  };
};
test("minimum admin/promoter stays present when deleting", () => {
  const form = validForm();
  assert.equal(mayRemove(form.steps, 0), false);
  assert.equal(mayRemove(form.steps, 1), false);
  form.steps.push(copyStep(form.steps[1]));
  assert.equal(mayRemove(form.steps, 2), true);
});
test("copy keeps account and role but edits do not change original content", () => {
  const original = validForm().steps[1];
  const copy = copyStep(original);
  copy.message.content = "changed";
  assert.notEqual(copy.key, original.key);
  assert.equal(copy.accountId, original.accountId);
  assert.equal(original.message.content, "message 1");
});
test("wire order follows screen order without UI keys; repeated same role account is allowed", () => {
  const form = validForm();
  form.steps.push(copyStep(form.steps[1]));
  assert.equal(validateScript(form), undefined);
  const payload = toScriptSave(form);
  assert.deepEqual(
    payload.steps.map(s => s.accountId),
    [1, 2, 2]
  );
  assert.equal("key" in payload.steps[0], false);
  form.steps[1].accountId = 1;
  assert.match(validateScript(form)!, /不同账号/);
});

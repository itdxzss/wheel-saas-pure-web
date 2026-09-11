import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newStep,
  copyStep,
  mayRemove,
  validateScript,
  toScriptSave,
  estimatedWait
} from "./form";

const validForm = () => {
  const steps = [newStep("ADMIN"), newStep()];
  steps.forEach((step, index) => {
    step.accountId = null;
    step.message.content = `message ${index}`;
  });
  return {
    taskName: "test",
    accountGroupId: 30,
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
test("wire order leaves administrators and promoters unbound until startup", () => {
  const form = validForm();
  form.steps.push(copyStep(form.steps[1]));
  assert.equal(validateScript(form), undefined);
  const payload = toScriptSave(form);
  assert.deepEqual(
    payload.steps.map(s => s.accountId),
    [null, null, null]
  );
  assert.equal("key" in payload.steps[0], false);
  form.steps[1].accountId = 1;
  assert.match(validateScript(form)!, /无需手动/);
});
test("copying an old draft clears fixed administrator accounts without changing its content", () => {
  const source = validForm().steps[0];
  source.accountId = 1;
  const copy = copyStep(source);
  assert.equal(copy.accountId, null);
  assert.equal(source.accountId, 1);
  assert.deepEqual(copy.message, source.message);
});
test("first interval is excluded and repeated promoter messages do not create extra roles", () => {
  const form = validForm();
  form.steps[0].waitMinSeconds = 900;
  form.steps[0].waitMaxSeconds = 1000;
  form.steps[1].waitMinSeconds = 10;
  form.steps[1].waitMaxSeconds = 20;
  form.steps.push(copyStep(form.steps[1]));
  assert.deepEqual(estimatedWait(form.steps), [20, 40]);
  assert.equal(form.steps[1].roleKey, form.steps[2].roleKey);
  form.steps[2].role = "ADMIN";
  form.steps[2].accountId = null;
  assert.match(validateScript(form)!, /同一角色/);
});
test("image-only content and zero delay are allowed, missing group and inverted intervals are blocked", () => {
  const form = validForm();
  form.steps[1].message.content = "";
  form.steps[1].message.linkMode = 3;
  form.steps[1].message.imageFileId = 50;
  form.steps[1].waitMinSeconds = 0;
  form.steps[1].waitMaxSeconds = 0;
  assert.equal(validateScript(form), undefined);
  form.accountGroupId = 0;
  assert.match(validateScript(form)!, /分组/);
  form.accountGroupId = 30;
  form.steps[1].waitMinSeconds = 10;
  assert.match(validateScript(form)!, /最大值/);
});

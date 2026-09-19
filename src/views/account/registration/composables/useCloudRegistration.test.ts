import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { useCloudRegistration } from "./useCloudRegistration";
const scopes: EffectScope[] = [];
const devices = [1, 2].map(n => ({
  deviceId: `10000000-0000-4000-8000-00000000000${n}`,
  cloudPhoneId: String(n),
  displayName: `CP-${n}`
}));
async function settle() {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}
async function setup() {
  resetArmadaMockQueue([
    devices,
    [{ cost: "0.88", count: 2, providerIds: ["196"] }]
  ]);
  const scope = effectScope();
  scopes.push(scope);
  const state = scope.run(() => useCloudRegistration(ref(true)))!;
  await settle();
  // Initial current-task requests must be confirmed absent before selection.
  resetArmadaMockFailure(
    Object.assign(new Error("absent"), { businessCode: 40401 })
  );
  await state.refresh();
  state.selected.value = devices.map(d => d.deviceId);
  state.form.unitPrice = "0.88";
  await settle();
  state.form.providerId = "196";
  return state;
}
afterEach(() => scopes.splice(0).forEach(s => s.stop()));
it("multi-select saves one distinct permit per device and never purchases from UI", async () => {
  const s = await setup();
  resetArmadaMockQueue([
    { requestId: "one", state: "NOT_STARTED" },
    { requestId: "two", state: "NOT_STARTED" }
  ]);
  await s.queue();
  const calls = armadaCalls();
  assert.equal(calls.length, 2);
  assert.ok(calls.every(c => c.url === "/api/account-registrations/devices"));
  const bodies = calls.map(
    c => (c.opts as { data: { deviceId: string; requestId: string } }).data
  );
  assert.deepEqual(
    bodies.map(b => b.deviceId),
    devices.map(d => d.deviceId)
  );
  assert.notEqual(bodies[0].requestId, bodies[1].requestId);
  await s.queue();
  assert.equal(armadaCalls().length, 2);
});
it("partial ambiguity retries only unresolved device with its original payload", async () => {
  const s = await setup();
  resetArmadaMockQueue([{ requestId: "one", state: "NOT_STARTED" }, undefined]);
  await s.queue();
  const original = armadaCalls()[1].opts;
  assert.equal(s.rows.value[0].error, "");
  assert.ok(s.rows.value[1].error);
  s.selected.value = [];
  s.form.unitPrice = "99";
  resetArmadaMockQueue([{ requestId: "two", state: "NOT_STARTED" }]);
  await s.queue();
  assert.equal(armadaCalls().length, 1);
  assert.deepEqual(armadaCalls()[0].opts, original);
});
it("unknown selection and unresolved current state cannot be queued", async () => {
  const s = await setup();
  s.selected.value = ["unknown"];
  resetArmadaMockQueue([]);
  await s.queue();
  assert.equal(armadaCalls().length, 0);
  s.selected.value = [devices[0].deviceId];
  s.rows.value[0].checked = false;
  await s.queue();
  assert.equal(armadaCalls().length, 0);
});
it("empty inventory disables queue and active task is not replaced", async () => {
  const s = await setup();
  s.rows.value[0].current = { state: "REGISTERING" } as never;
  s.selected.value = [devices[0].deviceId];
  resetArmadaMockQueue([]);
  await s.queue();
  assert.equal(armadaCalls().length, 0);
  s.rows.value = [];
  await s.queue();
  assert.equal(armadaCalls().length, 0);
});

it("leaving the page during a batch does not submit the remaining devices", async () => {
  const s = await setup();
  let complete: (value: unknown) => void;
  const first = new Promise(resolve => {
    complete = resolve;
  });
  resetArmadaMockQueue([first, { requestId: "two", state: "NOT_STARTED" }]);
  const work = s.queue();
  scopes.at(-1)!.stop();
  complete!({ requestId: "one", state: "NOT_STARTED" });
  await work;
  assert.equal(armadaCalls().length, 1);
  assert.ok(s.rows.value[1].pending);
});

it("an ambiguous request cannot overwrite a different current permit", async () => {
  const s = await setup();
  s.selected.value = [devices[0].deviceId];
  resetArmadaMockFailure(new Error("timeout"));
  await s.queue();
  s.rows.value[0].current = {
    requestId: "another-permit",
    state: "NOT_STARTED"
  } as never;
  resetArmadaMockQueue([]);
  await s.queue();
  assert.equal(armadaCalls().length, 0);
  assert.ok(s.rows.value[0].error);
});

it("batch budget preserves the supplier's decimal precision", async () => {
  const s = await setup();
  s.form.unitPrice = "0.000000000001";
  assert.equal(s.total.value, "0.000000000002");
  s.form.unitPrice = "1e-7";
  assert.equal(s.total.value, "0.0000002");
});

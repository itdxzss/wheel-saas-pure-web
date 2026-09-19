import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import { useDeviceRegistration } from "./useDeviceRegistration";

const scopes: EffectScope[] = [];
const device = "10000000-0000-4000-8000-000000000001";
const tier = {
  country: "187",
  service: "wa",
  cost: "0.88",
  count: 20,
  providerIds: ["196", "62"]
};
const snapshot = {
  requestId: "10000000-0000-4000-8000-000000000002",
  state: "NOT_STARTED",
  phoneNumber: "",
  unitPrice: "0.88",
  countryId: "187",
  purchaseBefore: 9999999999999,
  failureCode: "",
  providerId: "196",
  replacesRequestId: null,
  actualCost: null,
  currency: null
};
async function settle() {
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
async function setup() {
  resetArmadaMockQueue([{ countries: [{ id: "187", name: "美国" }] }, [tier]]);
  const active = ref(true),
    scope = effectScope();
  scopes.push(scope);
  const state = scope.run(() => useDeviceRegistration(active))!;
  await settle();
  state.form.deviceId = device;
  state.form.unitPrice = "0.88";
  await settle();
  state.form.providerId = "196";
  return { state, active };
}
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()));

it("saving a selected merchant authorizes one attempt without starting purchase", async () => {
  const { state } = await setup();
  resetArmadaMockQueue([snapshot]);
  await state.prepare();
  assert.equal(armadaCalls().length, 1);
  assert.equal(armadaCalls()[0].url, "/api/account-registrations/devices");
  const data = (armadaCalls()[0].opts as { data: Record<string, unknown> })
    .data;
  assert.equal(data.providerId, "196");
  assert.equal(data.deviceId, device);
  assert.equal(state.current.value?.state, "NOT_STARTED");
});
it("historical merchant missing from the current tier is rejected without any API call", async () => {
  const { state } = await setup();
  state.form.providerId = "222";
  resetArmadaMockQueue([]);
  await state.prepare();
  assert.equal(armadaCalls().length, 0);
  assert.match(state.error.value, /有效/);
});
it("uncertain save retries the same immutable request even if draft is changed", async () => {
  const { state } = await setup();
  resetArmadaMockFailure(new Error("network"));
  await state.prepare();
  const original = (armadaCalls()[0].opts as { data: unknown }).data;
  state.form.providerId = "62";
  resetArmadaMockQueue([snapshot]);
  await state.prepare();
  assert.deepEqual((armadaCalls()[0].opts as { data: unknown }).data, original);
});
it("only explicit start sends the confirmed request and merchant", async () => {
  const { state } = await setup();
  state.current.value = snapshot;
  resetArmadaMockQueue([{ ...snapshot, state: "PENDING" }]);
  await state.start(snapshot);
  assert.equal(
    armadaCalls()[0].url,
    `/api/account-registrations/devices/${device}/start`
  );
  assert.deepEqual(armadaCalls()[0].opts, {
    data: { requestId: snapshot.requestId, providerId: "196" }
  });
  await state.start(snapshot);
  assert.equal(armadaCalls().length, 1);
});
it("refreshing current task never sends start or prepare", async () => {
  const { state } = await setup();
  resetArmadaMockQueue([{ ...snapshot, state: "FAILED" }]);
  await state.refresh();
  assert.equal(armadaCalls().length, 1);
  assert.equal(armadaCalls()[0].method, "get");
});

import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import type { AccountRegistrationDetail } from "@/api/account-registration";
import { useAccountRegistration } from "./useAccountRegistration";

const scopes: EffectScope[] = [];
const catalog = {
  serviceCode: "wa",
  serviceName: "WhatsApp",
  countries: [{ id: "channel-us", name: "USA channel" }],
  orderingEnabled: true
};
const tier = {
  country: "channel-us",
  service: "wa",
  cost: "0.3500",
  count: 20,
  providerIds: ["5"]
};
const task = {
  id: 8,
  requestId: "existing",
  countryId: "channel-us",
  unitPrice: "0.3500",
  quantity: 2,
  accountGroupId: 9,
  accountType: 1 as const,
  ipAllocationMode: "smart" as const,
  cancelRequested: false,
  status: "PENDING" as const,
  createdAt: 1,
  updatedAt: 1,
  counts: {
    pending: 2,
    processing: 0,
    succeeded: 0,
    failed: 0,
    unknown: 0,
    cancelled: 0
  }
};
const detail: AccountRegistrationDetail = { task, items: [] };

async function settle(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

async function setup() {
  const visible = ref(false);
  const scope = effectScope();
  scopes.push(scope);
  const state = scope.run(() => useAccountRegistration(visible))!;
  resetArmadaMockQueue([catalog, { list: [], total: 0 }, [tier]]);
  visible.value = true;
  await settle();
  Object.assign(state.form, {
    countryId: "channel-us",
    unitPrice: "0.3500",
    quantity: 2,
    accountGroupId: 9,
    accountType: 1
  });
  return { state, visible, scope };
}

afterEach(() => {
  scopes.splice(0).forEach(scope => scope.stop());
  mock.timers.reset();
});

describe("新号注册请求与观察生命周期", () => {
  it("freezes the original request and reuses its UUID after an uncertain response", async () => {
    const { state } = await setup();
    resetArmadaMockFailure(new Error("network disconnected"));
    await state.submit();
    const original = state.submittedRequest.value!;
    assert.match(original.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(state.submitState.value, "unknown");
    assert.equal(state.resetDraft(), false);
    assert.ok(Object.isFrozen(original));
    Object.assign(state.form, {
      quantity: 99,
      countryId: "other",
      unitPrice: "1.00"
    });
    resetArmadaMockQueue([
      { ...detail, task: { ...task, requestId: original.requestId } },
      { list: [], total: 0 }
    ]);
    await state.submit();
    assert.deepEqual(
      (armadaCalls()[0].opts as { data: unknown }).data,
      original
    );
    assert.equal(original.quantity, 2);
    assert.equal(original.unitPrice, "0.3500");
    assert.equal(state.submitState.value, "confirmed");
  });

  it("does not create twice while the first submission is in flight", async () => {
    const { state } = await setup();
    let resolve!: (value: AccountRegistrationDetail) => void;
    resetArmadaMockQueue([
      new Promise(value => {
        resolve = value;
      }),
      { list: [], total: 0 }
    ]);
    const first = state.submit();
    await state.submit();
    assert.equal(
      armadaCalls().filter(call => call.method === "post").length,
      1
    );
    resolve(detail);
    await first;
    assert.equal(state.resetDraft(), true);
    assert.equal(state.submittedRequest.value, null);
  });

  it("permits an explicit new draft only after a confirmed pre-transaction rejection", async () => {
    const { state } = await setup();
    resetArmadaMockFailure({ businessCode: 40001, message: "库存已变化" });
    await state.submit();
    assert.equal(state.submitState.value, "rejected");
    assert.equal(state.resetDraft(), true);
    await settle();
    Object.assign(state.form, {
      unitPrice: "0.3500",
      quantity: 2,
      accountGroupId: 9,
      accountType: 1
    });
    state.tiers.value = [tier];
    state.priceError.value = "";
    resetArmadaMockFailure({ businessCode: 40901, message: "请求冲突" });
    await state.submit();
    assert.equal(state.submitState.value, "unknown");
    assert.equal(state.resetDraft(), false);
  });

  it("keeps the request frozen across close and ignores its late successful response", async () => {
    const { state, visible } = await setup();
    let resolve!: (value: AccountRegistrationDetail) => void;
    resetArmadaMockQueue([
      new Promise(value => {
        resolve = value;
      })
    ]);
    const pending = state.submit();
    const id = state.submittedRequest.value!.requestId;
    visible.value = false;
    assert.equal(state.submitState.value, "unknown");
    resolve(detail);
    await pending;
    assert.equal(state.detail.value, null);
    assert.equal(state.submittedRequest.value!.requestId, id);
    resetArmadaMockQueue([catalog, { list: [], total: 0 }, [tier]]);
    visible.value = true;
    await settle();
    assert.equal(state.submittedRequest.value!.requestId, id);
    assert.equal(state.frozen.value, true);
  });

  it("reconciles an unknown submission from the task list using requestId", async () => {
    const { state } = await setup();
    resetArmadaMockFailure(new Error("timeout"));
    await state.submit();
    resetArmadaMockQueue([
      {
        list: [{ ...task, requestId: state.submittedRequest.value!.requestId }],
        total: 1
      }
    ]);
    await state.refreshTasks();
    assert.equal(state.submitState.value, "confirmed");
    assert.equal(state.submitError.value, "");
  });

  it("polls only while open and clears timers when the scope is disposed", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const { visible, scope } = await setup();
    resetArmadaMockQueue([{ list: [], total: 0 }]);
    mock.timers.tick(5000);
    await settle();
    assert.equal(armadaCalls().length, 1);
    visible.value = false;
    resetArmadaMockQueue([]);
    mock.timers.tick(10000);
    await settle();
    assert.equal(armadaCalls().length, 0);
    resetArmadaMockQueue([catalog, { list: [], total: 0 }, [tier]]);
    visible.value = true;
    await settle();
    scope.stop();
    resetArmadaMockQueue([]);
    mock.timers.tick(10000);
    await settle();
    assert.equal(armadaCalls().length, 0);
  });

  it("ignores stale price and detail responses when the operator changes selection", async () => {
    const { state } = await setup();
    let resolvePrices!: (value: unknown) => void;
    resetArmadaMockQueue([
      new Promise(resolve => {
        resolvePrices = resolve;
      }),
      [{ ...tier, country: "other" }]
    ]);
    const oldPrice = state.loadPrices();
    state.form.countryId = "other";
    await state.loadPrices();
    resolvePrices([tier]);
    await oldPrice;
    assert.equal(state.tiers.value[0].country, "other");
    let resolveDetail!: (value: unknown) => void;
    resetArmadaMockQueue([
      new Promise(resolve => {
        resolveDetail = resolve;
      }),
      { ...detail, task: { ...task, id: 2 } }
    ]);
    const oldDetail = state.loadDetail(1);
    await state.loadDetail(2);
    resolveDetail(detail);
    await oldDetail;
    assert.equal(state.detail.value!.task.id, 2);
  });

  it("never sends a purchase for invalid quantity or disabled ordering", async () => {
    const { state } = await setup();
    resetArmadaMockQueue([]);
    state.form.quantity = 101;
    await state.submit();
    assert.equal(armadaCalls().length, 0);
    state.form.quantity = 2;
    state.catalog.value = {
      ...catalog,
      orderingEnabled: false,
      disabledReason: "未启用"
    };
    await state.submit();
    assert.equal(armadaCalls().length, 0);
    assert.equal(state.submitError.value, "未启用");
  });
});

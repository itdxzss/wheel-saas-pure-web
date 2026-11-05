import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import type { SmsActivation } from "@/api/sms-activation";
import { SMS_POLL_INTERVAL_MS, useSmsActivation } from "./useSmsActivation";

const scopes: EffectScope[] = [];
const options = {
  serviceCode: "wa",
  countries: [
    { id: "12", name: "美国（虚拟）" },
    { id: "187", name: "美国" }
  ],
  balance: "3.5",
  purchaseEnabled: true
};
const tier = {
  country: "187",
  service: "wa",
  cost: "0.5",
  count: 9,
  providerIds: ["196"]
};

function row(
  id: number,
  state: SmsActivation["state"],
  smsCode?: string
): SmsActivation {
  return {
    id,
    activationId: `a${id}`,
    phoneNumber: "12025550123",
    countryId: "187",
    cost: "0.5",
    currency: 840,
    state,
    smsCode,
    cancelAfter: 0,
    expiresAt: Date.now() + 600_000,
    createdAt: 1,
    updatedAt: 1
  };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

async function setup(records: SmsActivation[]) {
  const visible = ref(false);
  const scope = effectScope();
  scopes.push(scope);
  const state = scope.run(() => useSmsActivation(visible))!;
  // watch 同步触发：options → records → price-tiers 依次出队。
  resetArmadaMockQueue([
    options,
    { list: records, total: records.length },
    [tier]
  ]);
  visible.value = true;
  await settle();
  return { state, visible };
}

afterEach(() => {
  scopes.splice(0).forEach(scope => scope.stop());
  mock.timers.reset();
});

describe("手动接码页面状态", () => {
  it("loads options, records and United States prices when shown", async () => {
    const { state } = await setup([row(1, "COMPLETED")]);
    assert.equal(state.form.countryId, "187");
    assert.equal(state.records.value.length, 1);
    assert.deepEqual(
      armadaCalls().find(call => call.url.endsWith("/price-tiers"))?.opts,
      { params: { countryId: "187" } }
    );
    state.form.maxPrice = "0.5";
    assert.deepEqual(state.providerOptions.value, ["196"]);
    assert.equal(state.canPurchase.value, true);
  });

  it("polls only waiting rows and stops once the code arrives or page hides", async () => {
    mock.timers.enable({ apis: ["setInterval"] });
    const { state, visible } = await setup([
      row(1, "WAITING_CODE"),
      row(2, "COMPLETED")
    ]);

    resetArmadaMockQueue([row(1, "RECEIVED", "004271")]);
    mock.timers.tick(SMS_POLL_INTERVAL_MS);
    await settle();
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/sms-activations/1"]
    );
    assert.equal(state.active.value[0].smsCode, "004271");

    resetArmadaMockQueue([]);
    mock.timers.tick(SMS_POLL_INTERVAL_MS);
    await settle();
    assert.equal(armadaCalls().length, 0);

    state.records.value = [row(3, "WAITING_CODE")];
    visible.value = false;
    await settle();
    mock.timers.tick(SMS_POLL_INTERVAL_MS * 3);
    await settle();
    assert.equal(armadaCalls().length, 0);
  });

  it("does not retry a failed purchase", async () => {
    const { state } = await setup([]);
    Object.assign(state.form, { maxPrice: "0.5", providerId: "196" });
    resetArmadaMockFailure(
      new Error("接码平台调用未完成：TRANSPORT_ERROR，操作结果待核对")
    );
    await assert.rejects(state.purchase());
    assert.equal(state.purchasing.value, false);
    const posts = armadaCalls().filter(call => call.method === "post");
    assert.equal(posts.length, 1);
    assert.deepEqual(posts[0].opts, {
      data: { countryId: "187", maxPrice: "0.5", providerId: "196" }
    });
  });
});

import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import type { SmsActivation } from "@/api/sms-activation";
import {
  canStartRegistration,
  registrationRunning
} from "../sms-activation-display";
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
  smsCode?: string,
  registrationState?: SmsActivation["registrationState"]
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
    updatedAt: 1,
    registrationState
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

  it("keeps refreshing an order while its registration runs, then stops", async () => {
    mock.timers.enable({ apis: ["setInterval"] });
    const { state } = await setup([
      row(1, "RECEIVED", "004271", "VERIFYING"),
      row(2, "RECEIVED", "111111")
    ]);

    // 订单 1 已收码但后台还在验码，必须继续刷新；订单 2 没有后台注册，不轮询。
    resetArmadaMockQueue([row(1, "RECEIVED", "004271", "REGISTERED")]);
    mock.timers.tick(SMS_POLL_INTERVAL_MS);
    await settle();
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/sms-activations/1"]
    );
    assert.equal(state.records.value[0].registrationState, "REGISTERED");

    resetArmadaMockQueue([]);
    mock.timers.tick(SMS_POLL_INTERVAL_MS);
    await settle();
    assert.equal(armadaCalls().length, 0);
  });

  it("starts registration with one post and shows the returned state", async () => {
    const { state } = await setup([row(1, "WAITING_CODE")]);
    resetArmadaMockQueue([row(1, "WAITING_CODE", undefined, "REQUESTING")]);

    await state.register(1);

    const posts = armadaCalls().filter(call => call.method === "post");
    assert.deepEqual(
      posts.map(call => call.url),
      ["/api/sms-activations/1/registration"]
    );
    assert.equal(state.records.value[0].registrationState, "REQUESTING");
    assert.equal(state.acting.value, null);
  });

  it("only offers registration for waiting orders without a code or a registration", () => {
    assert.equal(canStartRegistration(row(1, "WAITING_CODE")), true);
    assert.equal(canStartRegistration(row(1, "WAITING_CODE", "004271")), false);
    assert.equal(canStartRegistration(row(1, "RECEIVED")), false);
    assert.equal(
      canStartRegistration(
        row(1, "WAITING_CODE", undefined, "ACTION_REQUIRED")
      ),
      false
    );
    // 只有后台仍在推进的三个状态才占用订单。
    assert.equal(
      registrationRunning(row(1, "WAITING_CODE", undefined, "REQUESTING")),
      true
    );
    assert.equal(
      registrationRunning(row(1, "RECEIVED", "1", "VERIFYING")),
      true
    );
    assert.equal(
      registrationRunning(row(1, "RECEIVED", "1", "REGISTERED")),
      false
    );
    assert.equal(
      registrationRunning(row(1, "WAITING_CODE", undefined, "ACTION_REQUIRED")),
      false
    );
    assert.equal(registrationRunning(row(1, "WAITING_CODE")), false);
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

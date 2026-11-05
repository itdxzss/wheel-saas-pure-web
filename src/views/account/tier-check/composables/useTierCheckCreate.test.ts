import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import { useTierCheckCreate } from "./useTierCheckCreate";

const scopes: EffectScope[] = [];
async function settle(): Promise<void> {
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
async function setup(ids: number[] = []) {
  const open = ref(false);
  const selected = ref(ids);
  const scope = effectScope();
  scopes.push(scope);
  const state = scope.run(() => useTierCheckCreate(open, selected))!;
  resetArmadaMockQueue([
    { list: [{ id: 11, name: "夹具组", accountCount: 2 }], total: 1 },
    {
      list: [
        { id: 3, wsPhone: "00000000003", loginState: 1 },
        { id: 4, wsPhone: "00000000004", loginState: 2 }
      ],
      total: 2
    }
  ]);
  open.value = true;
  await settle();
  return { state, open, selected };
}
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()));

test("probe search requests online Web only and ignores offline rows", async () => {
  const { state } = await setup();
  const call = armadaCalls().find(c => c.url === "/api/accounts");
  assert.deepEqual((call?.opts as { params: object }).params, {
    page: 1,
    pageSize: 20,
    loginState: 1,
    protocolId: "WEB"
  });
  assert.deepEqual(state.probeOptions.value, [{ id: 3, phone: "00000000003" }]);
  assert.equal(state.valid.value, false);
});
test("selection sends accountIds exclusively; changing draft invalidates preview", async () => {
  const { state } = await setup([1, 2, 1]);
  resetArmadaMockQueue([
    { eligible: 2, excluded: 0, excludedReasons: [], previewToken: "token" }
  ]);
  await state.check();
  assert.equal(state.canStart.value, true);
  const data = (
    armadaCalls()[0].opts as {
      data: { accountIds: number[]; accountGroupIds: number[] };
    }
  ).data;
  assert.deepEqual(data.accountIds, [1, 2]);
  assert.deepEqual(data.accountGroupIds, []);
  state.form.value.name = "new draft";
  assert.equal(state.preview.value, null);
  assert.equal(state.canStart.value, false);
});
test("create is single flight and retains idempotency key for unchanged retry", async () => {
  const { state } = await setup([1]);
  resetArmadaMockQueue([
    { eligible: 1, excluded: 0, excludedReasons: [], previewToken: "token" }
  ]);
  await state.check();
  resetArmadaMockFailure(new Error("failed fixture"));
  assert.equal(await state.start(), false);
  const first = (armadaCalls()[0].opts as { data: { requestId: string } }).data;
  let resolve!: (value: object) => void;
  resetArmadaMockQueue([
    new Promise(r => {
      resolve = r;
    })
  ]);
  const start = state.start();
  assert.equal(await state.start(), false);
  assert.equal(armadaCalls().length, 1);
  const retry = (
    armadaCalls()[0].opts as {
      data: { requestId: string; previewToken: string };
    }
  ).data;
  assert.equal(retry.requestId, first.requestId);
  assert.equal(retry.previewToken, "token");
  resolve({ id: 10 });
  assert.equal(await start, true);
});
test("ignores old preview after draft changes or drawer closes", async () => {
  const { state, open } = await setup([1]);
  let resolve!: (value: object) => void;
  resetArmadaMockQueue([
    new Promise(r => {
      resolve = r;
    })
  ]);
  const check = state.check();
  state.form.value.includePersonal = true;
  resolve({
    eligible: 1,
    excluded: 0,
    excludedReasons: [],
    previewToken: "old"
  });
  await check;
  assert.equal(state.preview.value, null);
  resetArmadaMockQueue([
    new Promise(r => {
      resolve = r;
    })
  ]);
  const next = state.check();
  open.value = false;
  resolve({
    eligible: 1,
    excluded: 0,
    excludedReasons: [],
    previewToken: "old"
  });
  await next;
  assert.equal(state.preview.value, null);
  assert.equal(state.busy.value, false);
});
test("self payload clears hidden probe selection and probe errors stay visible", async () => {
  const { state } = await setup([1]);
  state.form.value.probeAccountIds = [3];
  resetArmadaMockQueue([
    { eligible: 1, excluded: 0, excludedReasons: [], previewToken: "token" }
  ]);
  await state.check();
  assert.deepEqual(
    (armadaCalls()[0].opts as { data: { probeAccountIds: number[] } }).data
      .probeAccountIds,
    []
  );
  resetArmadaMockFailure(new Error("probe fixture failure"));
  await state.searchProbes("synthetic");
  assert.match(state.error.value, /probe fixture failure/);
  assert.equal(state.probeLoading.value, false);
});

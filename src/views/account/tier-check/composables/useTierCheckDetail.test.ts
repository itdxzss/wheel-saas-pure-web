import assert from "node:assert/strict";
import { afterEach, test, mock } from "node:test";
import { effectScope, ref, type EffectScope } from "vue";
import {
  armadaCalls,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";
import { TIER_DETAIL_POLL_MS, useTierCheckDetail } from "./useTierCheckDetail";

const scopes: EffectScope[] = [];
async function settle(): Promise<void> {
  for (let i = 0; i < 15; i++) await Promise.resolve();
}
async function setup(status = 3) {
  const scope = effectScope();
  scopes.push(scope);
  const open = ref(false);
  const id = ref<number | null>(1);
  const state = scope.run(() => useTierCheckDetail(open, id))!;
  resetArmadaMockQueue([
    { id: 1, status, tierCounts: { TIER_1: 1 } },
    { list: [{ id: 1 }], total: 40 }
  ]);
  open.value = true;
  await settle();
  return { state, open, id };
}
afterEach(() => {
  scopes.splice(0).forEach(s => s.stop());
  mock.timers.reset();
});

test("filter resets pagination and exposes load errors", async () => {
  const { state } = await setup();
  resetArmadaMockQueue([{ list: [{ id: 2 }], total: 40 }]);
  state.itemPage.value = 2;
  await settle();
  resetArmadaMockQueue([{ list: [], total: 0 }]);
  state.filter.value = "lost";
  await settle();
  assert.equal(state.itemPage.value, 1);
  assert.deepEqual(armadaCalls()[0].opts, {
    params: { page: 1, pageSize: 20, filter: "lost" }
  });
  resetArmadaMockFailure(new Error("fixture detail failed"));
  state.filter.value = "changed";
  await settle();
  assert.match(state.error.value, /fixture detail failed/);
});
test("polls GET progress only and stops on close or completed task", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const { state, open } = await setup(1);
  resetArmadaMockQueue([
    { id: 1, status: 3, tierCounts: { TIER_2: 1 } },
    { list: [], total: 0 }
  ]);
  mock.timers.tick(TIER_DETAIL_POLL_MS);
  await settle();
  assert.equal(state.task.value?.status, 3);
  assert.equal(armadaCalls().length, 2);
  assert.ok(armadaCalls().every(c => c.method === "get"));
  resetArmadaMockQueue([]);
  mock.timers.tick(TIER_DETAIL_POLL_MS * 2);
  await settle();
  assert.equal(armadaCalls().length, 0);
  open.value = false;
  mock.timers.tick(TIER_DETAIL_POLL_MS);
  assert.equal(armadaCalls().length, 0);
});
test("switching task discards delayed old task and item responses", async () => {
  const { state, id } = await setup();
  let oldTask!: (v: object) => void;
  let oldItems!: (v: object) => void;
  resetArmadaMockQueue([
    new Promise(r => {
      oldTask = r;
    }),
    new Promise(r => {
      oldItems = r;
    })
  ]);
  const old = state.refresh();
  resetArmadaMockQueue([
    { id: 2, status: 3, tierCounts: {} },
    { list: [{ id: 2 }], total: 1 }
  ]);
  id.value = 2;
  await settle();
  oldTask({ id: 1, status: 3, tierCounts: {} });
  oldItems({ list: [{ id: 1 }], total: 1 });
  await old;
  assert.equal(state.task.value?.id, 2);
  assert.equal(state.items.value[0].id, 2);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { useMessageCap, chunkIds } from "./useMessageCap";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";

function batch(ids: number[]) {
  return {
    requested: ids.length,
    succeeded: ids.length,
    failed: 0,
    items: ids.map(accountId => ({
      accountId,
      phone: `9190${accountId}`,
      backend: "ANDROID",
      queryStatus: "SUCCESS",
      errorCode: null,
      cap: null
    }))
  };
}

test("chunks selections at the backend limit and keeps order", () => {
  const ids = Array.from({ length: 250 }, (_, index) => index + 1);
  const chunks = chunkIds(ids);
  assert.deepEqual(
    chunks.map(chunk => chunk.length),
    [100, 100, 50]
  );
  assert.equal(chunks[2][49], 250);
});

test("queries in batches with debug on and merges results in order", async () => {
  const ids = Array.from({ length: 120 }, (_, index) => index + 1);
  resetArmadaMockQueue([batch(ids.slice(0, 100)), batch(ids.slice(100))]);
  const state = useMessageCap();
  await state.query([...ids, 1, 2]);
  const calls = armadaCalls();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "/api/accounts/message-cap/query");
  const first = (calls[0].opts as { data: { ids: number[]; debug: boolean } })
    .data;
  assert.equal(first.ids.length, 100);
  assert.equal(first.debug, true);
  assert.equal(state.rows.value.length, 120);
  assert.equal(state.rows.value[119].accountId, 120);
  assert.equal(state.loading.value, false);
  assert.ok(state.queriedAt.value);
  assert.equal(state.error.value, "");
});

test("a failed request surfaces an error and keeps rows already fetched", async () => {
  const ids = Array.from({ length: 150 }, (_, index) => index + 1);
  resetArmadaMockQueue([batch(ids.slice(0, 100))]);
  const state = useMessageCap();
  const pending = state.query(ids);
  await pending;
  // 第二批队列耗尽后返回 undefined，访问 items 失败，应转成可见错误而不是静默成功。
  assert.notEqual(state.error.value, "");
  assert.equal(state.rows.value.length, 100);
  assert.equal(state.queriedAt.value, undefined);
  assert.equal(state.loading.value, false);
});

test("request failure reports the API message", async () => {
  resetArmadaMockFailure(new Error("账号服务繁忙"));
  const state = useMessageCap();
  await state.query([1]);
  assert.match(state.error.value, /账号服务繁忙/);
  assert.equal(state.rows.value.length, 0);
});

test("reset discards results of an in-flight query", async () => {
  resetArmadaMock(batch([1]));
  const state = useMessageCap();
  const pending = state.query([1]);
  state.reset();
  await pending;
  assert.equal(state.rows.value.length, 0);
  assert.equal(state.queriedAt.value, undefined);
});

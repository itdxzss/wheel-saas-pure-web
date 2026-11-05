import { ElMessageBox } from "element-plus";
import type { MutualChatTask } from "@/api/account-mutual-chat";
import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { createRenderer, defineComponent, nextTick, ref } from "vue";
import { useMutualChats } from "./useMutualChats";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "@/api/__tests__/armada-test-double";

const renderer = createRenderer<object, object>({
  patchProp() {},
  insert() {},
  remove() {},
  setText() {},
  setElementText() {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  parentNode: () => null,
  nextSibling: () => null
});

function setup() {
  let state!: ReturnType<typeof useMutualChats>;
  const app = renderer.createApp(
    defineComponent({
      setup() {
        state = useMutualChats(ref(false));
        return () => null;
      }
    })
  );
  app.mount({});
  return { state, close: () => app.unmount() };
}

test("uncertain create response preserves request key; changing interval invalidates preview", async () => {
  const { state, close } = setup();
  try {
    state.form.leftText = "A text";
    state.form.rightText = "B text";
    state.form.leftGroupId = 11;
    state.form.rightGroupId = 12;
    await nextTick();
    resetArmadaMock({ operationCount: 12, previewToken: "frozen-scope" });
    await state.check();
    assert.equal(state.canStart.value, true);
    resetArmadaMockFailure(new Error("response lost"));
    await state.start();
    const first = (
      armadaCalls()[0].opts as {
        data: { requestId: string; intervalSeconds: number };
      }
    ).data;
    assert.equal(first.intervalSeconds, 10);
    resetArmadaMockFailure(new Error("response lost again"));
    await state.start();
    const second = (armadaCalls()[0].opts as { data: { requestId: string } })
      .data;
    assert.equal(second.requestId, first.requestId);
    state.form.intervalSeconds = 5;
    await nextTick();
    assert.equal(state.preview.value, undefined);
    assert.equal(state.canStart.value, false);
  } finally {
    close();
  }
});

test("clear or identical groups cannot preview or create a task", async () => {
  const { state, close } = setup();
  try {
    state.form.leftGroupId = state.form.rightGroupId = 11;
    resetArmadaMock(undefined);
    await state.check();
    await state.start();
    assert.equal(armadaCalls().length, 0);
  } finally {
    close();
  }
});

test("works on plain HTTP pages where crypto.randomUUID is unavailable", async () => {
  const original = globalThis.crypto.randomUUID;
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    value: undefined,
    configurable: true
  });
  try {
    const { state, close } = setup();
    try {
      state.form.leftText = "A text";
      state.form.rightText = "B text";
      state.form.leftGroupId = 11;
      state.form.rightGroupId = 12;
      await nextTick();
      resetArmadaMock({ operationCount: 12, previewToken: "http-scope" });
      await state.check();
      resetArmadaMockFailure(new Error("response lost"));
      await state.start();
      const sent = (armadaCalls()[0].opts as { data: { requestId: string } })
        .data;
      assert.match(
        sent.requestId,
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    } finally {
      close();
    }
  } finally {
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      value: original,
      configurable: true
    });
  }
});

test("default interval is 10 and rejects invalid interval or text", async () => {
  const { state, close } = setup();
  try {
    assert.equal(state.form.intervalSeconds, 10);
    state.form.leftGroupId = 11;
    state.form.rightGroupId = 12;
    state.form.leftText = "A";
    state.form.rightText = "B";
    await nextTick();
    assert.equal(state.valid.value, true);
    for (const interval of [0, -1, 3601, 1.5]) {
      state.form.intervalSeconds = interval;
      await nextTick();
      assert.equal(state.valid.value, false);
    }
    state.form.intervalSeconds = 10;
    for (const text of ["   ", "a".repeat(1001)]) {
      state.form.leftText = text;
      await nextTick();
      assert.equal(state.valid.value, false);
    }
    state.form.leftText = "A";
    state.form.rightText = " ";
    await nextTick();
    assert.equal(state.valid.value, false);
  } finally {
    close();
  }
});

test("changing text clears preview", async () => {
  const { state, close } = setup();
  try {
    state.form.leftGroupId = 11;
    state.form.rightGroupId = 12;
    state.form.leftText = "A";
    state.form.rightText = "B";
    await nextTick();
    resetArmadaMock({ operationCount: 12, previewToken: "frozen" });
    await state.check();
    assert.equal(state.canStart.value, true);
    state.form.rightText = "new B";
    await nextTick();
    assert.equal(state.preview.value, undefined);
    assert.equal(state.canStart.value, false);
  } finally {
    close();
  }
});

for (const unknown of [0, 1]) {
  test(`retry confirms risk only when unknown=${unknown}`, async () => {
    const { state, close } = setup();
    const confirm = mock.method(ElMessageBox, "confirm", async () => undefined);
    const task: MutualChatTask = {
      id: 81,
      leftGroupName: "A",
      rightGroupName: "B",
      leftCount: 2,
      rightCount: 3,
      leftText: "A",
      rightText: "B",
      intervalSeconds: 10,
      status: 2,
      createdAt: 1,
      stats: {
        total: 12,
        pending: 0,
        submitted: 0,
        success: 0,
        failed: 1,
        unknown,
        canceled: 11 - unknown,
        mutualPairs: 0,
        oneWayPairs: 0
      }
    };
    try {
      state.selected.value = task;
      resetArmadaMockQueue([
        task,
        12,
        { list: [], total: 0 },
        task,
        { list: [], total: 0 }
      ]);
      await state.retry();
      assert.equal(confirm.mock.callCount(), unknown);
      if (unknown)
        assert.equal(
          confirm.mock.calls[0].arguments[0],
          "该消息可能已经发出，重试可能让对方收到重复消息"
        );
      const retry = armadaCalls().find(call => call.url.endsWith("/retry"));
      assert.ok(retry);
      assert.equal(
        (retry.opts as { params: { confirmUnknown: boolean } }).params
          .confirmUnknown,
        unknown > 0
      );
      assert.equal(state.error.value, "");
    } finally {
      confirm.mock.restore();
      close();
    }
  });
}
test("canceling duplicate-risk confirmation does not retry", async () => {
  const { state, close } = setup();
  const confirm = mock.method(ElMessageBox, "confirm", async () => {
    throw new Error("cancel");
  });
  try {
    state.selected.value = { id: 81, stats: { unknown: 1 } } as MutualChatTask;
    resetArmadaMock({ id: 81, stats: { unknown: 1 } });
    await state.retry();
    assert.equal(
      armadaCalls().filter(call => call.url.endsWith("/retry")).length,
      0
    );
    assert.equal(state.busy.value, false);
  } finally {
    confirm.mock.restore();
    close();
  }
});

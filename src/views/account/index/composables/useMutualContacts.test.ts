import assert from "node:assert/strict";
import { test } from "node:test";
import { createRenderer, defineComponent, nextTick, ref } from "vue";
import { useMutualContacts } from "./useMutualContacts";
import {
  armadaCalls,
  resetArmadaMock,
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
  let state!: ReturnType<typeof useMutualContacts>;
  const app = renderer.createApp(
    defineComponent({
      setup() {
        state = useMutualContacts(ref(false));
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
    assert.equal(first.intervalSeconds, 0);
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

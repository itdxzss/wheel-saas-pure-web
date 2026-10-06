import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { it } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as vue from "vue";
import type { CommonGroupCreateState } from "./useCommonGroupCreate";

const require = createRequire(import.meta.url);
const source = readFileSync(
  new URL("./useCommonGroupCreate.ts", import.meta.url),
  "utf8"
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

function setup() {
  const creates: string[] = [];
  const reads: number[] = [];
  const timers = new Set<number>();
  let nextTimer = 0;
  let storageReads = 0;
  const storage = new Map([
    ["armada:normal-group-creation:active-task-id", "41"],
    [
      "armada:normal-group-creation:pending-submission",
      '{"payload":{"groupCount":5}}'
    ]
  ]);
  const summary = {
    id: 42,
    status: "RUNNING",
    totalCount: 1,
    successCount: 0,
    failedCount: 0,
    createdAt: 1,
    updatedAt: 1
  };
  let createResult: () => Promise<typeof summary> = async () => summary;
  const messages: unknown[] = [];
  const exports: { useCommonGroupCreate?: () => CommonGroupCreateState } = {};
  const dependencies: Record<string, unknown> = {
    vue: { ...vue, onBeforeUnmount: () => {} },
    "element-plus": {
      ElMessage: Object.fromEntries(
        ["error", "warning", "success", "info"].map(key => [
          key,
          (message: unknown) => messages.push(message)
        ])
      ),
      ElMessageBox: { confirm: async () => {} }
    },
    "@/api/common-group-task": {
      createCommonGroupTask: async (_payload: unknown, key: string) => {
        creates.push(key);
        return createResult();
      },
      getCommonGroupTask: async (id: number) => {
        reads.push(id);
        return { task: summary, items: [] };
      }
    },
    "@/api/account-group": { listAccountGroups: async () => ({ list: [] }) },
    "@/api/group-folder": { listGroupFolders: async () => ({ list: [] }) },
    "@/utils/api-error": {
      apiErrorMessage: (_error: unknown, fallback: string) => fallback
    }
  };
  runInNewContext(compiled, {
    exports,
    require: (id: string) =>
      dependencies[id] ?? require(id.startsWith(".") ? `${id}.ts` : id),
    clearTimeout: (id: number) => timers.delete(id),
    window: {
      sessionStorage: {
        getItem: (key: string) => {
          storageReads += 1;
          return storage.get(key);
        },
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key)
      },
      setTimeout: () => {
        timers.add(++nextTimer);
        return nextTimer;
      }
    }
  });
  const state = exports.useCommonGroupCreate!();
  function configure() {
    state.form.managerGroupId = 101;
    state.form.memberGroupId = 102;
    state.form.groupCount = 5;
  }
  return {
    state,
    configure,
    creates,
    reads,
    timers,
    messages,
    storageReads: () => storageReads,
    setCreateResult: (result: typeof createResult) => {
      createResult = result;
    },
    summary
  };
}

it("opens fresh configuration without reading or replaying legacy browser state", async () => {
  const h = setup();
  await h.state.open();
  h.configure();
  await h.state.cancel();
  await h.state.open();
  assert.equal(h.state.visible.value, true);
  assert.equal(h.state.form.managerGroupId, "");
  assert.equal(h.state.form.groupCount, 1);
  assert.equal(h.storageReads(), 0);
  assert.equal(h.creates.length, 0);
  assert.equal(h.reads.length, 0);
});

it("does not retry a rejected submission when opening new configuration", async () => {
  const h = setup();
  h.setCreateResult(async () => {
    throw new Error("管理员不足");
  });
  await h.state.open();
  h.configure();
  await h.state.confirmCreate();
  await h.state.open();
  assert.equal(h.creates.length, 1);
  assert.equal(h.state.visible.value, true);
  assert.equal(h.state.form.groupCount, 1);
  h.configure();
  await h.state.confirmCreate();
  assert.notEqual(h.creates[0], h.creates[1]);
});

it("opens a new form after a submitted task and stops its old polling", async () => {
  const h = setup();
  await h.state.open();
  h.configure();
  await h.state.confirmCreate();
  assert.equal(h.state.resultVisible.value, true);
  assert.equal(h.timers.size, 1);
  await h.state.open();
  assert.equal(h.timers.size, 0);
  assert.equal(h.state.task.value, null);
  assert.equal(h.state.resultVisible.value, false);
  assert.equal(h.state.visible.value, true);
  assert.equal(h.state.form.managerGroupId, "");
  assert.equal(h.creates.length, 1);
  assert.deepEqual(h.reads, [42]);
});

it("does not let a delayed previous submission replace the new form", async () => {
  const h = setup();
  let finish!: (value: typeof h.summary) => void;
  h.setCreateResult(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  await h.state.open();
  h.configure();
  const previous = h.state.confirmCreate();
  await h.state.open();
  finish(h.summary);
  await previous;
  assert.equal(h.state.visible.value, true);
  assert.equal(h.state.resultVisible.value, false);
  assert.equal(h.state.task.value, null);
  assert.equal(h.state.creating.value, false);
  assert.equal(h.reads.length, 0);
  assert.equal(h.messages.length, 0);
});

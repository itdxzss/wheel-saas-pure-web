# Pull Task Resource Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make group folders and pasted group links alternative, mergeable sources while generating the execution plan automatically during task creation.

**Architecture:** Keep the existing normal-link drawer and backend contract. Centralize resource freshness checks in `useStandardPullTaskCreate`, let `create()` call the existing plan API when needed, and update the drawer copy so implementation details such as “precheck” and “freeze” are not user-facing.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Node test runner, existing Armada API test doubles.

---

### Task 1: Lock the source and automatic-plan behavior with failing tests

**Files:**

- Modify: `src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts`

- [x] **Step 1: Replace the old explicit-precheck assertions**

Add tests that assert an empty form reports `请选择群组分组或粘贴群链接`, and that a selected source without TXT reports `请上传 TXT 料子文件` without issuing an API request.

- [x] **Step 2: Add a save-time automatic-plan test**

Queue a plan response followed by a create response, set both `groupFolderId` and `linksText`, add one TXT, call `create()`, and assert the first request is `/api/pull-tasks/standard/draft/plan` with both sources while the second is `/api/pull-tasks/standard`.

- [x] **Step 3: Run the composable test and verify RED**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts
```

Expected: the new automatic-plan and validation assertions fail against the current explicit-precheck implementation.

### Task 2: Implement automatic plan generation during create

**Files:**

- Modify: `src/views/task/pull-task/composables/useStandardPullTaskCreate.ts`

- [x] **Step 1: Make `plan()` report success**

Change the internal plan operation to return `Promise<boolean>`, returning `false` for missing sources or request failure and `true` after applying a successful draft response.

- [x] **Step 2: Add focused resource-state helpers**

Add helpers equivalent to:

```ts
function currentGroupFolderId(): number | null {
  return positiveId(form.groupFolderId) ? form.groupFolderId : null;
}

function hasGroupSource(): boolean {
  return currentGroupFolderId() !== null || Boolean(linksText.value.trim());
}

function resourcePlanChanged(): boolean {
  return (
    linksText.value !== plannedLinksText ||
    currentGroupFolderId() !== plannedGroupFolderId ||
    pendingFiles.value.length !== plannedPendingNames.size ||
    pendingFiles.value.some(file => !plannedPendingNames.has(file.name))
  );
}
```

- [x] **Step 3: Make `create()` ensure a current execution plan**

Before avatar upload and task creation, validate that a source exists and TXT/rows exist. If the draft is missing or resource state changed, await `plan()`. Continue only when the resulting draft has an id, version and at least one execution row.

- [x] **Step 4: Remove user-facing explicit-precheck gates**

Keep `createPayload()` responsible for ordinary form validation, but replace the “请先完成链接与 TXT 匹配预览” and “请重新预检并冻结执行计划” branches with the automatic `create()` flow.

- [x] **Step 5: Run the composable test and verify GREEN**

Run the Task 1 command. Expected: all tests pass with zero failures.

### Task 3: Align the drawer wording with the confirmed interaction

**Files:**

- Modify: `src/views/task/pull-task/components/PullTaskStandardResources.vue`
- Modify: `src/views/task/pull-task/components/PullTaskCreateDrawer.vue`
- Modify: `src/views/task/pull-task/components/PullTaskStandardPlanTable.vue`
- Modify: `src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts`

- [x] **Step 1: Write failing layout assertions**

Assert the combined source explanation is present, and that the create surface does not contain `预检`, `已冻结`, or `冻结并创建任务`.

- [x] **Step 2: Run the layout test and verify RED**

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts
```

Expected: failure because the old freeze/precheck copy is still rendered.

- [x] **Step 3: Update visible copy**

Use “群组分组和手工群链接任选其一；同时填写时合并使用”, “校验并生成执行计划”, “已匹配”, and “创建任务”. Preserve the existing inputs, parse-result tables and execution-order table.

- [x] **Step 4: Run the layout test and verify GREEN**

Run the Task 3 test command. Expected: all layout tests pass.

### Task 4: Record and verify the correction

**Files:**

- Modify: `.harness/changes/pull-task-normal-link-create/summary.md`

- [x] **Step 1: Update the change record**

Record the corrected source semantics, automatic create-time plan generation, unchanged backend contract, and actual verification outputs.

- [x] **Step 2: Run focused regression tests**

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts src/api/pull-task.test.ts
```

- [x] **Step 3: Run static and build verification**

```bash
pnpm typecheck
pnpm exec eslint --max-warnings 0 src/views/task/pull-task/components/PullTaskCreateDrawer.vue src/views/task/pull-task/components/PullTaskStandardResources.vue src/views/task/pull-task/components/PullTaskStandardPlanTable.vue src/views/task/pull-task/composables/useStandardPullTaskCreate.ts src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts
pnpm build
git diff --check
```

Expected: every command exits 0.

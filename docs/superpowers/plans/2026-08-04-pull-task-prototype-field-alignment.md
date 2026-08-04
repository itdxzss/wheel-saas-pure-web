# Pull Task Prototype Field Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the normal-link pull-task create form with every non-marketing, non-future field in the approved prototype while keeping the current backend request contract unchanged.

**Architecture:** Extend the existing `StandardPullTaskCreateForm` as the single front-end draft model, load group-folder options beside account groups, and split the added group-information controls into a focused child component. The submission mapper remains an explicit allowlist for the current backend DTO and the page tells reviewers which fields still await backend support.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Element Plus, Node test runner, pnpm.

---

### Task 1: Lock the prototype field contract in failing tests

**Files:**

- Modify: `src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts`
- Modify: `src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts`

- [ ] **Step 1: Add source-contract assertions for every included field**

Extend the layout test with the included labels and explicit exclusions:

```ts
for (const field of [
  "群组分组",
  "拉手同步料子方式",
  "是否清空群原成员",
  "任务完成的管理移至分组",
  "任务完成的拉手移至分组",
  "设置顺序",
  "群名称（可选）",
  "料子文件名为群名",
  "群头像（可选）",
  "群描述（可选）",
  "是否任务完成后自动关闭禁言",
  "是否任务完成后自动关闭拉人权限",
  "允许任何人编辑群组设置",
  "群禁言",
  "获取群链接权限",
  "限时消息"
]) {
  assert.match(allCreateSources, new RegExp(field));
}
assert.doesNotMatch(allCreateSources, /营销发送间隔|营销模板|营销开始方式/);
```

- [ ] **Step 2: Add default-state and payload-boundary assertions**

Assert `autoStart === true`, pull range `50..50`, puller count `2`, material timing `2`, and group-setting timing `AFTER_PULL`. Extend the existing payload test to assert that front-end-only keys are absent from the posted JSON.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts
```

Expected: FAIL because the new field labels and default-state keys do not exist yet.

### Task 2: Extend the front-end draft model and option loading

**Files:**

- Modify: `src/views/task/pull-task/composables/useStandardPullTaskCreate.ts`
- Modify: `src/views/task/pull-task/index.vue`
- Modify: `src/views/task/pull-task/components/PullTaskCreateDrawer.vue`

- [ ] **Step 1: Add the typed front-end-only fields**

Add the exact fields from the design document to `StandardPullTaskCreateForm`. Set prototype defaults in `emptyForm()`:

```ts
autoStart: true,
materialAdminTiming: 2,
pullCountMin: 50,
pullCountMax: 50,
pullerCountPerGroup: 2,
groupSettingTiming: "AFTER_PULL",
pullerSyncMode: "SINGLE",
editPermission: "UNCHANGED",
muteMode: "UNCHANGED",
linkPermission: "ADMIN_ONLY",
disappearingMessage: "UNCHANGED"
```

- [ ] **Step 2: Load real group-folder options**

Import `listGroupFolders` and expose a `groupFolders: Ref<GroupFolderRow[]>`. Add it to the existing `Promise.allSettled` load next to account groups and draft, with a visible API error on failure.

- [ ] **Step 3: Thread the options through the existing component boundary**

Pass `groupFolders` from `index.vue` to `PullTaskCreateDrawer`, then to `PullTaskStandardSettings`. Do not add a second store or direct API call inside a presentational component.

- [ ] **Step 4: Run the composable tests and verify GREEN for state behavior**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts
```

Expected: PASS, including the unchanged backend payload allowlist.

### Task 3: Add the missing prototype field controls

**Files:**

- Modify: `src/views/task/pull-task/components/PullTaskStandardSettings.vue`
- Create: `src/views/task/pull-task/components/PullTaskStandardGroupSettings.vue`
- Modify: `src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts`

- [ ] **Step 1: Add group source, execution, and archive controls**

Use Element Plus form controls bound to the typed model: `ElSelect` for group folder/archive groups, `ElRadioGroup` for sync mode, and `ElSwitch` for clearing existing members. Rename existing labels to the prototype wording and remove the visual required marker from station group.

- [ ] **Step 2: Add the focused group-information component**

Create `PullTaskStandardGroupSettings.vue` with three sections: setting order, basic profile, and permissions. Use `ElInput`, `ElSwitch`, `ElUpload` with `auto-upload=false`, and `ElRadioGroup`; store only the selected avatar filename until the backend upload contract is added.

- [ ] **Step 3: Add a backend-boundary notice**

Place an `ElAlert` above the new controls with title `新增配置待后端接入，本次仅用于前端字段验收` so reviewers cannot mistake the controls for persisted behavior.

- [ ] **Step 4: Run the layout tests and verify GREEN**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts
```

Expected: PASS with all included labels and excluded marketing labels verified.

### Task 4: Align the execution-order display vocabulary

**Files:**

- Modify: `src/views/task/pull-task/components/PullTaskStandardPlanTable.vue`
- Modify: `src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts`

- [ ] **Step 1: Add the prototype-facing columns without losing frozen-plan facts**

Label the TXT column `进群料子`, add a derived `状态` column that displays `待执行`, and keep the group link and validation counts because they are required to inspect the server-frozen plan.

- [ ] **Step 2: Run the layout test**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts
```

Expected: PASS with `序号 / 进群料子 / 状态 / 操作` present.

### Task 5: Verify the complete front-end slice

**Files:**

- Update: `.harness/changes/2026-08-04-pull-task-prototype-field-alignment/summary.md`

- [ ] **Step 1: Run focused pull-task tests**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/components/PullTaskStandardCreateLayout.test.ts src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts src/api/pull-task.test.ts
```

Expected: all tests PASS.

- [ ] **Step 2: Run static verification**

Run `pnpm typecheck` and then `pnpm build`.

Expected: both commands exit 0 without TypeScript or Vue template errors.

- [ ] **Step 3: Inspect the local page**

Start the existing Vite development server, open the pull-task list, open `新建拉群任务`, and verify every included prototype field is visible while marketing and future fields remain absent.

- [ ] **Step 4: Record evidence**

Update the change summary with changed files, test commands, results, and the explicit statement that the backend request contract was not expanded.

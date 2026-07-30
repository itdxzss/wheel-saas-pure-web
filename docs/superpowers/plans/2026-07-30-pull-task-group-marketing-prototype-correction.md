# Pull Task GROUP_MARKETING Prototype Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the independent group-pull-marketing menu and implement the supplied GROUP_MARKETING list/create prototype under the pull-task menu without calling the legacy create API.

**Architecture:** Keep `/task/pull-task` as the authorized menu route and derive a hidden `/task/pull-task/create` companion route from it. Preserve the existing pull-task list/detail/lifecycle logic, remove its legacy create-drawer state, add optional aggregate fields to `PullTaskRow`, and implement the prototype create form as five Element Plus sections backed by a frontend-only draft.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Element Plus, pure-admin-thin, Node test runner, pnpm/Vite

---

## File map

- Restore `src/views/task/group-pull-marketing/**`, its API/route files, mock route, tests, and mistaken docs to their state before `44a0aa03`.
- Modify `src/api/routes.ts` and create `src/router/pull-task-route.test.ts` for the hidden pull-task create route.
- Modify `src/api/pull-task.ts` and `src/views/task/pull-task/constants.ts`; create `task-list-display.ts` and its test for prototype aggregates.
- Modify `src/views/task/pull-task/index.vue` and `composables/usePullTaskPage.ts`; delete `components/PullTaskCreateDrawer.vue`; create `PullTaskIndex.test.ts`.
- Create `src/views/task/pull-task/create/` with pure draft/interaction modules, five section components, the page, and tests.
- Update `.harness/changes/pull-task-group-marketing-prototype-correction/summary.md` with verification evidence, leaving deployment undone.

### Task 1: Restore the mistakenly changed menu

**Files:**

- Restore: `src/views/task/group-pull-marketing/**`
- Restore: `src/api/group-pull-marketing.ts`
- Restore: `src/api/group-pull-marketing.test.ts`
- Restore: `src/api/routes.ts`
- Restore: `src/router/group-pull-marketing-route.test.ts`
- Restore: `mock/asyncRoutes.ts`
- Restore/delete: mistaken prototype docs and change summaries

- [ ] **Step 1: Capture the exact mistaken scope**

Run `git diff --name-status e809dc0c..718a580f`.

Expected: only the mistaken group-pull-marketing feature, API/routes, mock route, tests, and its records are listed.

- [ ] **Step 2: Revert only the mistaken commits without rewriting history**

```bash
git revert --no-commit 47374633 718a580f 384336b1 dbd2d755 a218563b 3bd149d9 43a20769 cb0c7e0d 9c75d397 5ea35065 25c97672 d9d9755c 10fa0ce6 44a0aa03
```

Expected: the staged diff restores the separate menu; unrelated group-list working-tree files remain untouched.

- [ ] **Step 3: Verify and commit**

Run `git diff --cached --check`, inspect `git diff --cached --name-status`, then commit `revert: restore group pull marketing menu`.

### Task 2: Add the correct hidden create route

**Files:**

- Create: `src/router/pull-task-route.test.ts`
- Modify: `src/api/routes.ts`

- [ ] **Step 1: Write the failing route contract test**

The test reads `src/api/routes.ts` and asserts:

```ts
assert.match(routeSource, /PULL_TASK_ROUTE_NAME = "TaskPull"/);
assert.match(routeSource, /path: "\/task\/pull-task\/create"/);
assert.match(routeSource, /component: "task\/pull-task\/create\/index"/);
assert.match(routeSource, /name: "TaskPullCreate"/);
assert.match(routeSource, /activePath: "\/task\/pull-task"/);
assert.match(routeSource, /title: "新建拉群任务"/);
assert.doesNotMatch(routeSource, /\/task\/group-pull-marketing\/create/);
```

- [ ] **Step 2: Run `node --test src/router/pull-task-route.test.ts` and verify RED**

Expected: FAIL because the correct companion route does not exist.

- [ ] **Step 3: Add the route companion**

For route name `TaskPull`, append:

```ts
{
  path: "/task/pull-task/create",
  component: "task/pull-task/create/index",
  name: "TaskPullCreate",
  meta: {
    ...route.meta,
    title: "新建拉群任务",
    showLink: false,
    activePath: "/task/pull-task"
  }
}
```

Retain the existing group-pull-marketing hidden detail companion only.

- [ ] **Step 4: Verify GREEN and commit**

Run both pull-task and group-pull-marketing route tests. Commit `feat: add pull task create route`.

### Task 3: Define aggregate fields and display behavior

**Files:**

- Modify: `src/api/pull-task.ts`
- Create: `src/views/task/pull-task/task-list-display.test.ts`
- Create: `src/views/task/pull-task/task-list-display.ts`
- Modify: `src/views/task/pull-task/constants.ts`

- [ ] **Step 1: Write failing display tests**

```ts
assert.equal(displayMetric(undefined), "--");
assert.equal(displayMetric(0), "0");
assert.equal(displayMetric(29886), "29,886");
assert.equal(displayRate(0), "0.0%");
assert.equal(progressPercentage(68, 100), 68);
assert.equal(progressPercentage(0, 0), null);
assert.equal(taskTypeLabel("GROUP_MARKETING"), "拉群营销");
assert.equal(groupSourceLabel("HISTORICAL"), "历史老群");
assert.equal(groupSourceLabel(undefined), "--");
assert.equal(
  resourceShortageLabel({ type: "PULLER", shortageCount: null }),
  "拉手不足"
);
```

Also assert the constants source has the ten labels from “任务信息” through “操作”.

- [ ] **Step 2: Run the test with the repository Node TypeScript loader and verify RED**

Expected: FAIL because `task-list-display.ts` does not exist.

- [ ] **Step 3: Add optional aggregate types**

Add task type/source/shortage types and these optional nullable fields to `PullTaskRow`:

```ts
taskType;
groupSource;
primaryStage;
processedGroupCount;
targetGroupCount;
joinedSuccessCount;
plannedTargetCount;
effectiveSuccessRate;
marketingRunningGroupCount;
marketingCompletedGroupCount;
messageSuccessCount;
messageFailedCount;
messageUnknownCount;
abnormalGroupCount;
replacementPendingGroupCount;
bannedAccountCount;
remainingTargetCount;
availablePullerCount;
resourceShortages;
lastExecutedAt;
```

All fields receive explicit TypeScript types; no existing required field is removed.

- [ ] **Step 4: Implement minimal pure formatters and columns**

Nullish metrics return `--`, zero remains `0`, rates use one decimal, progress clamps to 0–100, task type/source labels map only confirmed enum values, and shortage labels support all five resource types. Replace `pullTaskColumns` with exactly:

```ts
[
  "任务信息",
  "任务状态",
  "群组处理进度",
  "拉人结果",
  "营销进度",
  "消息发送",
  "异常情况",
  "剩余资源",
  "时间",
  "操作"
];
```

- [ ] **Step 5: Verify GREEN and commit `feat: add pull task prototype metrics`**

### Task 4: Align the pull-task list and remove the obsolete drawer

**Files:**

- Create: `src/views/task/pull-task/PullTaskIndex.test.ts`
- Modify: `src/views/task/pull-task/index.vue`
- Modify: `src/views/task/pull-task/composables/usePullTaskPage.ts`
- Delete: `src/views/task/pull-task/components/PullTaskCreateDrawer.vue`

- [ ] **Step 1: Write the failing list contract test**

Assert `index.vue` contains the ten grouped labels, uses `displayMetric`/`displayRate`, retains `tenant:pull_task:create`, `tenant:pull_task:delete`, detail/start/pause/stop controls, and navigates with `router.push("/task/pull-task/create")`. Assert the index/composable contains no `PullTaskCreateDrawer`, `openCreateDrawer`, `createPullTask`, `PullTaskCreateForm`, `subMode`, `createDrawerOpen`, or `loadGroupLinks`.

- [ ] **Step 2: Run the list test and verify RED**

Expected: FAIL on the drawer path and old columns.

- [ ] **Step 3: Render the grouped table**

Use Element Plus cells for task identity/type/source, status/stage, group progress, pull results/rate, marketing progress, message outcomes, exceptions, remaining resources/shortage tags, created/latest-executed time, and preserved operations. Missing new metrics stay `--`; no demo rows or inferred fallback counters.

- [ ] **Step 4: Remove only legacy create state**

Delete the old form/defaults/payload/file-reader code and group-link imports. Keep `accountGroups` for detail supplementation by loading it from `listAccountGroups` on mount. Delete the drawer SFC.

- [ ] **Step 5: Verify GREEN and commit `feat: align pull task list with prototype`**

### Task 5: Build the fixed GROUP_MARKETING draft with TDD

**Files:**

- Create: `src/views/task/pull-task/create/create-draft.test.ts`
- Create: `src/views/task/pull-task/create/create-draft.ts`
- Create: `src/views/task/pull-task/create/create-interactions.test.ts`
- Create: `src/views/task/pull-task/create/create-interactions.ts`

- [ ] **Step 1: Write failing domain tests**

```ts
assert.equal(first.taskType, "GROUP_MARKETING");
assert.equal("subMode" in first, false);
assert.equal(first.groupSource, "HISTORICAL");
assert.equal(first.sendMode, "ROUNDS");
assert.equal(first.startMode, "IMMEDIATE");
assert.deepEqual(Object.values(emptyTargetDataMetrics()), Array(9).fill(null));
assert.equal(PULL_TASK_LIST_PATH, "/task/pull-task");
```

Also test independent drafts, cross-page selection retention/deduplication, rate clamping, TXT-only file selection, and notification-only unconfirmed actions.

- [ ] **Step 2: Run both tests and verify RED**

Expected: FAIL because the two modules are missing.

- [ ] **Step 3: Implement the pure modules**

Define fixed `taskType: "GROUP_MARKETING"`, all prototype fields/defaults, nine null metrics, scheduled/round visibility helpers, selection reconciliation, threshold normalization, TXT validation, and `notifyUnconfirmedCreateAction`. Import no API module.

- [ ] **Step 4: Verify GREEN and commit `feat: add pull task marketing draft`**

### Task 6: Build the five-section create page

**Files:**

- Create: `src/views/task/pull-task/create/PullTaskCreatePage.test.ts`
- Create: `src/views/task/pull-task/create/components/CreateBaseInfoSection.vue`
- Create: `src/views/task/pull-task/create/components/CreateTargetGroupSection.vue`
- Create: `src/views/task/pull-task/create/components/CreateRoleConfigSection.vue`
- Create: `src/views/task/pull-task/create/components/CreateMarketingSection.vue`
- Create: `src/views/task/pull-task/create/components/CreateLaunchSection.vue`
- Create: `src/views/task/pull-task/create/index.vue`

- [ ] **Step 1: Write the failing page source contract**

Assert the five sources contain every approved prototype label, the page assembles all five components, includes 保存草稿/校验配置/预览任务/取消/创建并启动, returns through `PULL_TASK_LIST_PATH`, imports no `@/api/*`, and none of the seven files contains “子模式”.

- [ ] **Step 2: Run the page test and verify RED**

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement five focused Element Plus sections**

Use `defineModel<PullTaskMarketingCreateDraft>()` with `el-card`, `el-form-item`, inputs/selects/switches/radios/upload/table/date picker. Keep each SFC under 600 lines and use project theme variables.

- [ ] **Step 4: Assemble frontend-only actions**

Create local draft state, show the flow alert, return to `/task/pull-task`, and route 保存草稿/校验配置/预览任务/创建并启动 through:

```ts
notifyUnconfirmedCreateAction(action, message => ElMessage.info(message));
```

The page must not import or call any API.

- [ ] **Step 5: Verify page/domain/route tests and commit `feat: add pull task marketing create page`**

### Task 7: Verify, record, and stop before deployment

**Files:**

- Modify: `.harness/changes/pull-task-group-marketing-prototype-correction/summary.md`

- [ ] **Step 1: Run focused pull-task and restored group-pull-marketing tests**

Expected: all PASS.

- [ ] **Step 2: Run static and production checks**

```bash
pnpm typecheck
pnpm build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 3: Record evidence and commit**

Record exact outcomes and commit IDs. Leave deployment unchecked and write “按用户要求未部署”. Commit `docs: record pull task prototype implementation`.

- [ ] **Step 4: Confirm the handoff boundary**

Report the implementation commit range, preserved unrelated files, and that no deploy or SSH command was executed.

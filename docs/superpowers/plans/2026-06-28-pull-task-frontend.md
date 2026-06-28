# Pull Task Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the wheel pull-task list into `wheel-saas-pure-web` as a frontend-first page.

**Architecture:** Add a narrow `src/api/pull-task.ts` adapter for future armada endpoints, a focused page composable for state/actions, and one route page that uses existing pure-admin-thin and Element Plus controls. No local fake success is introduced; missing backend endpoints surface normal API errors.

**Tech Stack:** Vue 3, TypeScript, pure-admin-thin, Element Plus, `armadaRequest`.

---

### Task 1: Harness Verification

**Files:**
- Create: `scripts/verify-pull-task-menu.mjs`
- Create: `.harness/changes/pull-task-frontend/summary.md`

- [ ] Add route/API/page structure assertions for `/task/pull`.
- [ ] Run `node scripts/verify-pull-task-menu.mjs`.
- [ ] Expected first result: fail until API, page, and route files exist.

### Task 2: API Contract

**Files:**
- Create: `src/api/pull-task.ts`

- [ ] Define list/detail/group row/create payload types.
- [ ] Add `GET /api/pull-tasks`, `POST /api/pull-tasks`, detail, group row, start/pause/stop, batch-delete, supplement, and export helpers.
- [ ] Use `armadaRequest`; do not import axios/http directly from views.

### Task 3: Page State

**Files:**
- Create: `src/views/task/pull-task/constants.ts`
- Create: `src/views/task/pull-task/composables/usePullTaskPage.ts`

- [ ] Define status labels, table columns, and date formatting.
- [ ] Implement search, pagination, create drawer, detail drawer, group-row pagination, batch supplement, batch delete, and task action handlers.
- [ ] Load account groups and WS link groups from APIs; leave options empty and show API errors when endpoints are unavailable.

### Task 4: Route Page

**Files:**
- Create: `src/views/task/pull-task/index.vue`
- Modify: `mock/asyncRoutes.ts`

- [ ] Add the `/task/pull` route with `TaskPull`, `module_key=pull_task`, `perm_key=tenant:pull_task:view`.
- [ ] Build list/search/create/detail UI with `PureTableBar`, `WheelPagination`, `el-table`, `el-drawer`, `el-form`, `el-select`, and related Element Plus controls.
- [ ] Keep old-group-link mode as the phase-one default while still rendering later-phase fields as frontend form inputs.

### Task 5: Verification

**Files:**
- Verify only.

- [ ] Run `node scripts/verify-pull-task-menu.mjs`.
- [ ] Run `npm run typecheck`.
- [ ] Run targeted eslint/stylelint on pull-task files.
- [ ] Run `npm run build`.
- [ ] Restart or refresh local preview so `/task/pull` is visible.

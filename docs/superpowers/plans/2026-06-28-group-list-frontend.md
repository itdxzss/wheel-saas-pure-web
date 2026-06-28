# Group List Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the SaaS “群组列表” frontend into `wheel-saas-pure-web`.

**Architecture:** Use the existing pure-admin pattern: route + API facade + page composable + table component + drawer component. The list uses Armada `/api/group-links`; frontend-only operations that do not yet have backend support are exposed through `src/api/group.ts` and show real error messages instead of fake success.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, pure-admin `RePureTableBar`, Element Plus, `WheelPagination`, `armadaRequest`.

---

### Task 1: Red Verification

**Files:**
- Create: `scripts/verify-group-list-menu.mjs`
- Create: `.harness/changes/group-list-frontend/summary.md`

- [ ] Write a Node verification script that checks the route, API facade, page files, drawer/table controls, and no self-drawn table/select usage.
- [ ] Run `node scripts/verify-group-list-menu.mjs` and verify it fails because implementation files are missing.

### Task 2: API And Route

**Files:**
- Create: `src/api/group.ts`
- Modify: `mock/asyncRoutes.ts`

- [ ] Add `GroupListRow`, query/detail/member types, `listGroups`, `batchDeleteGroups`, `getGroupDetail`, profile/settings/member/avatar operation functions.
- [ ] Add `/group/list` under task center with `component: "group/list/index"`, `module_key: "ws_group"`, `perm_key: "tenant:group_link:view"`.
- [ ] Run `node scripts/verify-group-list-menu.mjs` and verify it now fails on missing page files.

### Task 3: Page Shell And Table

**Files:**
- Create: `src/views/group/list/constants.ts`
- Create: `src/views/group/list/composables/useGroupListPage.ts`
- Create: `src/views/group/list/components/GroupListTable.vue`
- Create: `src/views/group/list/index.vue`

- [ ] Implement search form, status/source/origin/membership filters, selection, delete confirm, detail expansion, pagination, and table actions.
- [ ] Use only `RePureTableBar`, `ElTable`, `ElForm`, `ElSelect`, `ElTag`, `ElMessageBox`, and `WheelPagination`.

### Task 4: Full Frontend Drawer

**Files:**
- Create: `src/views/group/list/components/GroupMemberDrawer.vue`
- Modify: `src/views/group/list/composables/useGroupListPage.ts`
- Modify: `src/views/group/list/components/GroupListTable.vue`

- [ ] Implement `ElDrawer` with group header, avatar upload entry, group name/remark editing fields, timed message controls, permission switches, member search, member table, and batch member action buttons.
- [ ] Missing backend operations call `src/api/group.ts` functions and show failure/to-be-connected messages; they must not mutate UI as if the operation succeeded.

### Task 5: Verification

**Files:**
- Modify as needed from previous tasks only.

- [ ] Run `node scripts/verify-group-list-menu.mjs`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.

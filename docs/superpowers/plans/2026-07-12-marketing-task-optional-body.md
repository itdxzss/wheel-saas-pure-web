# Marketing Task Optional Body Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a marketing task's referenced template to be updated when the body text is empty, matching material management.

**Architecture:** Keep the existing task-specific drawer and update endpoint. Remove only the stale frontend validation and required marker; the shared API and backend already accept an empty `bodyText`.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Node test runner

---

### Task 1: Align task-side template validation

**Files:**

- Modify: `src/views/task/group-marketing/composables/useGroupMarketingTaskPage.ts:178-189`
- Modify: `src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.vue:85-91`
- Test: `src/views/task/group-marketing/composables/useGroupMarketingTaskPage.test.ts`
- Test: `src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.test.ts`

- [x] **Step 1: Write failing regression tests**

Add a state test that opens a task's material drawer, clears `bodyText`, submits, and asserts a PUT to `/api/marketing-tasks/42/marketing-template` with `bodyText: ""`. Add a source-level component assertion that the body form item does not include `required`.

- [x] **Step 2: Run tests and verify RED**

```bash
node --import ./src/api/__tests__/node-test-alias.mjs --test src/views/task/group-marketing/composables/useGroupMarketingTaskPage.test.ts src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.test.ts
```

Expected: the state test reports no update request because `validateMaterialForm` rejects blank body text, and the component test finds the stale `required` marker.

- [x] **Step 3: Implement the minimal change**

Delete the `bodyText.trim()` validation from `validateMaterialForm`. Remove `required` from the `正文` form item and change its placeholder to `选填，作为补充说明展示`.

- [x] **Step 4: Verify the change**

```bash
node --import ./src/api/__tests__/node-test-alias.mjs --test src/views/task/group-marketing/composables/useGroupMarketingTaskPage.test.ts src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
git diff --check
```

Expected: all commands exit successfully. Do not commit the changes.

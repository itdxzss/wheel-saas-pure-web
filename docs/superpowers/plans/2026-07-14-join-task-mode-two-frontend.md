# Join Task Mode Two Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent mode-two task submission when the checked account count differs from the configured count or valid links exceed account capacity.

**Architecture:** A small pure validation module owns mode-two numeric and capacity rules. The existing composable supplies checked-account and valid-link counts, then displays the returned message through the existing Element Plus warning flow.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Node test runner, vue-tsc

---

**Constraint:** Work on `1.0.1-snapshot` in place and do not commit.

### Task 1: Add pure mode-two validation

**Files:**
- Create: `src/views/task/join-task/validation.ts`
- Create: `src/views/task/join-task/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Assert an account-count mismatch returns “勾选账号数量与填写的执行账号数量不一致，请重新填写”, capacity overflow returns a message asking the operator to add accounts or raise the per-account limit, and link counts from zero through capacity are accepted by the capacity rule.

- [ ] **Step 2: Verify tests fail**

Run: `node --test src/views/task/join-task/validation.test.ts`

Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Implement pure validation**

Export a typed `validateModeTwoDistribution` function that checks positive integers, exact account count, and `validLinkCount <= executorAccountCount * linksPerAccount`.

- [ ] **Step 4: Verify tests pass**

Run: `node --test src/views/task/join-task/validation.test.ts`

Expected: PASS.

### Task 2: Wire validation into the editor

**Files:**
- Modify: `src/views/task/join-task/composables/useJoinTaskPage.ts`
- Modify: `.harness/changes/join-task-mode-two/summary.md`

- [ ] **Step 1: Classify valid links consistently with the backend**

Count unique lines matching strict `https://chat.whatsapp.com/<alphanumeric-code>` format for capacity calculation while retaining the backend as final validation authority.

- [ ] **Step 2: Replace permissive mode-two validation**

Pass the checked account count and valid-link count to `validateModeTwoDistribution`; return its operator-facing message before calling the API.

- [ ] **Step 3: Verify focused tests and typecheck**

Run: `node --test src/views/task/join-task/validation.test.ts src/views/task/join-task/index.test.ts`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Verify production build**

Run: `npm run build`

Expected: Vite build succeeds.

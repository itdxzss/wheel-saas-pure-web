# Pull Task Create Compact Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the visual density of the “新建拉群营销任务” page without changing its fields, behavior, two-column layout, or responsive breakpoint.

**Architecture:** Keep the five existing section components unchanged and centralize all density overrides in the create page root component. Scoped `:deep(...)` selectors target only descendants of `.pull-task-create-page`, so other task pages and Element Plus components remain unaffected.

**Tech Stack:** Vue 3 SFC scoped CSS, Element Plus, Node test runner, TypeScript, Vite

---

### Task 1: Add conservative compact density to the create page

**Files:**

- Modify: `src/views/task/pull-task/create/PullTaskCreatePage.test.ts`
- Modify: `src/views/task/pull-task/create/index.vue`

- [x] **Step 1: Write the failing density test**

Append this test inside the existing `describe("pull task GROUP_MARKETING create page", ...)` block in `src/views/task/pull-task/create/PullTaskCreatePage.test.ts`:

```ts
it("uses conservative compact density and keeps the two-column form", () => {
  const pageSource = componentSource("./index.vue");
  const baseSectionSource = componentSource(
    "./components/CreateBaseInfoSection.vue"
  );

  assert.match(pageSource, /--el-font-size-base:\s*13px/);
  assert.match(pageSource, /--el-component-size:\s*30px/);
  assert.match(pageSource, /\.create-section > \.el-card__header/);
  assert.match(pageSource, /\.el-form-item\)\s*\{[^}]*margin-bottom:\s*12px/s);
  assert.match(pageSource, /\.action-bar\s*\{[^}]*padding:\s*8px 12px/s);
  assert.match(
    baseSectionSource,
    /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/
  );
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/create/PullTaskCreatePage.test.ts
```

Expected: FAIL because `index.vue` does not yet define the compact font, component size, card padding, form-item margin, or action-bar padding.

- [x] **Step 3: Add page-scoped compact styles**

Update the existing `<style scoped>` block in `src/views/task/pull-task/create/index.vue`. Preserve the current responsive layout and replace or extend the relevant rules with these density values:

```css
.pull-task-create-page {
  min-height: 100%;
  padding-bottom: 60px;
  font-size: 13px;
  --el-font-size-base: 13px;
  --el-font-size-small: 12px;
  --el-component-size: 30px;
  --el-component-size-small: 26px;
}

.page-header-card {
  margin-bottom: 10px;
}

.page-header-card :deep(.el-card__body) {
  padding: 12px 14px;
}

.page-header-card :deep(.el-page-header__title) {
  font-size: 13px;
}

.page-header-card :deep(.el-page-header__content),
.page-title {
  font-size: 14px;
}

.flow-alert {
  margin-top: 10px;
}

.pull-task-create-page :deep(.el-alert) {
  padding: 8px 12px;
}

.pull-task-create-page :deep(.el-alert__title) {
  font-size: 12px;
  line-height: 18px;
}

.pull-task-create-page :deep(.create-section) {
  margin-bottom: 10px;
}

.pull-task-create-page :deep(.create-section > .el-card__header) {
  padding: 9px 14px;
}

.pull-task-create-page :deep(.create-section > .el-card__body) {
  padding: 12px 14px;
}

.pull-task-create-page :deep(.section-header) {
  gap: 8px;
}

.pull-task-create-page :deep(.section-header strong),
.pull-task-create-page :deep(.resource-card strong) {
  font-size: 14px;
  line-height: 20px;
}

.pull-task-create-page :deep(.section-header p) {
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
}

.pull-task-create-page :deep(.el-form-item) {
  margin-bottom: 12px;
}

.pull-task-create-page :deep(.el-form-item__label) {
  height: auto;
  padding: 0;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 18px;
}

.pull-task-create-page :deep(.field-hint),
.pull-task-create-page :deep(.field-unit),
.pull-task-create-page :deep(.action-hint) {
  font-size: 12px;
  line-height: 18px;
}

.pull-task-create-page :deep(.field-hint) {
  margin-top: 3px;
}

.pull-task-create-page :deep(.metric-grid) {
  gap: 8px;
}

.pull-task-create-page :deep(.metric-card) {
  gap: 2px;
  padding: 9px 10px;
}

.pull-task-create-page :deep(.metric-card strong) {
  font-size: 15px;
}

.pull-task-create-page :deep(.resource-grid) {
  gap: 10px;
  margin-bottom: 12px;
}

.pull-task-create-page :deep(.resource-card) {
  padding: 10px 12px;
}

.pull-task-create-page :deep(.resource-counts) {
  margin-top: 8px;
}

.pull-task-create-page :deep(.resource-card .el-empty) {
  padding: 8px 0 0;
}

.pull-task-create-page :deep(.resource-card .el-empty__description) {
  margin-top: 4px;
}

.pull-task-create-page :deep(.section-alert) {
  margin: 4px 0 10px;
}

.pull-task-create-page :deep(.candidate-summary) {
  margin: 6px 0 10px;
}

.pull-task-create-page :deep(.target-tabs) {
  padding-top: 0;
}

.pull-task-create-page :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.pull-task-create-page :deep(.preview-empty) {
  min-height: 48px;
  padding: 8px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
}
```

Keep the existing `.page-title`, `.action-hint`, `.action-buttons`, button-margin fix, and `@media (width <= 900px)` rules. Do not add three-column form rules or collapse behavior.

- [x] **Step 4: Format and run the focused test**

Run:

```bash
./node_modules/.bin/prettier --write src/views/task/pull-task/create/index.vue src/views/task/pull-task/create/PullTaskCreatePage.test.ts
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/pull-task/create/PullTaskCreatePage.test.ts
```

Expected: all create-page tests PASS.

- [x] **Step 5: Run regression and compile verification**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs \
  src/router/pull-task-route.test.ts \
  src/views/task/pull-task/PullTaskIndex.test.ts \
  src/views/task/pull-task/task-list-display.test.ts \
  src/views/task/pull-task/create/create-draft.test.ts \
  src/views/task/pull-task/create/create-interactions.test.ts \
  src/views/task/pull-task/create/PullTaskCreatePage.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
./node_modules/.bin/vite build
git diff --check
```

Expected: all tests and type checks PASS, the Vite build completes successfully, and `git diff --check` reports no whitespace errors.

- [x] **Step 6: Commit the implementation**

```bash
git add src/views/task/pull-task/create/index.vue \
  src/views/task/pull-task/create/PullTaskCreatePage.test.ts \
  docs/superpowers/plans/2026-07-30-pull-task-create-compact-density.md
git commit -m "style: compact pull task create page"
```

# Marketing Account Group Online Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each account group's existing online-account count after its name in the new marketing-task drawer.

**Architecture:** Reuse the `onlineAccounts` value already returned by `listAccountGroups`; do not add an API call or backend field. Change only the Element Plus option label and protect the display contract with the existing source-level component test.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Node test runner

---

### Task 1: Display the existing online count in account-group options

**Files:**
- Modify: `src/views/task/group-marketing/components/GroupMarketingCreateDrawer.vue:296-301`
- Test: `src/views/task/group-marketing/components/GroupMarketingCreateDrawer.test.ts`

- [ ] **Step 1: Write the failing test**

Add this case to `GroupMarketingCreateDrawer.test.ts`:

```ts
it("shows the account-group online count in option labels", () => {
  assert.match(
    source,
    /:label="`\$\{group\.name\}（\$\{group\.onlineAccounts\}）`"/
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node --test src/views/task/group-marketing/components/GroupMarketingCreateDrawer.test.ts
```

Expected: one failure for the missing account-group online-count label.

- [ ] **Step 3: Implement the minimal display change**

Change the account-group option to:

```vue
<el-option
  v-for="group in accountGroups"
  :key="group.id"
  :label="`${group.name}（${group.onlineAccounts}）`"
  :value="group.id"
/>
```

- [ ] **Step 4: Run focused and type-level verification**

Run:

```bash
node --test src/views/task/group-marketing/components/GroupMarketingCreateDrawer.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
git diff --check
```

Expected: all commands exit successfully; no backend files or API request paths change.


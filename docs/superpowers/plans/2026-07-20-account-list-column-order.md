# Account List Column Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将账号列表的分组、账号状态、登录三列依次移动到账号列之后。

**Architecture:** 同步调整静态列配置和 `AccountListTable.vue` 中显式列模板，保持 `dynamicColumns` 索引与实际渲染完全一致。不修改接口、数据模型和公共表格组件。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Node test runner。

## Global Constraints

- 最终开头顺序为：头像、账号、分组、账号状态、登录、国家。
- 其余字段相对顺序不变。
- 不修改公共组件或接口。

---

### Task 1: 调整账号列表列顺序

**Files:**

- Modify: `src/views/account/index/constants.ts`
- Modify: `src/views/account/index/components/AccountListTable.vue`
- Modify: `src/views/account/index/components/AccountListTable.test.ts`

**Interfaces:**

- Consumes: `accountListColumns: TableColumnList`
- Produces: 与 `dynamicColumns[0..18]` 顺序一致的表格列模板

- [ ] **Step 1: Write the failing test**

  读取 `constants.ts` 和 `AccountListTable.vue`，分别断言“账号 < 分组 < 账号状态 < 登录 < 国家”的源码位置顺序。

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test --experimental-strip-types src/views/account/index/components/AccountListTable.test.ts`

  Expected: FAIL，当前“国家”位于“分组”之前。

- [ ] **Step 3: Implement the minimal reorder**

  将三个列配置和三个模板块移动到账号之后，并把国家至渠道/来源的索引顺延为 `5..10`；后续风控至操作保持 `11..18`。

- [ ] **Step 4: Verify tests and static checks**

  Run: 账号表格测试、`pnpm typecheck`、三个改动文件的 ESLint。

- [ ] **Step 5: Commit**

  `git commit -m "fix(account): reorder core account columns"`

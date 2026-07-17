# Historical Group Normal Online Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 历史群操作账号仅展示所选分组内账号状态正常且登录状态在线的账号。

**Architecture:** 保留现有分组账号分页聚合、请求失效保护和 loading 复位逻辑。唯一行为调整是在每一页 `/api/accounts` 请求中恢复 `accountState=2` 与 `loginState=1`，由 Armada SQL 下推执行严格筛选。

**Tech Stack:** Vue 3、TypeScript、Node test runner

---

### Task 1: 锁定严格筛选请求

**Files:**

- Modify: `src/views/group/history/HistoricalGroupPage.test.ts`

- [x] **Step 1: 写入失败断言**

  首屏和跨页请求都必须精确匹配以下参数：

  ```ts
  {
    accountGroupId: 8,
    accountState: 2,
    loginState: 1,
    page: 1,
    pageSize: 500
  }
  ```

  第 2 页只把 `page` 改为 `2`。同时把离线异常账号用例恢复为正常在线账号，避免测试继续表达错误业务口径。

- [x] **Step 2: 运行测试确认 RED**

  Run: `node --import ./src/api/__tests__/node-test-alias.mjs --test src/views/group/history/HistoricalGroupPage.test.ts`

  Expected: FAIL，实际请求缺少 `accountState/loginState`。

### Task 2: 恢复生产查询条件

**Files:**

- Modify: `src/views/group/history/composables/useHistoricalGroupPage.ts`

- [x] **Step 1: 定义筛选常量**

  ```ts
  const NORMAL_ACCOUNT_STATE = 2;
  const ONLINE_LOGIN_STATE = 1;
  ```

- [x] **Step 2: 每页请求携带严格筛选**

  在 `listAccountGroupAccounts` 的首屏和后续分页请求中都加入：

  ```ts
  accountState: NORMAL_ACCOUNT_STATE,
  loginState: ONLINE_LOGIN_STATE
  ```

- [x] **Step 3: 运行测试确认 GREEN**

  Run: `node --import ./src/api/__tests__/node-test-alias.mjs --test src/views/group/history/HistoricalGroupPage.test.ts`

  Expected: PASS。

### Task 3: 同步最终口径

**Files:**

- Modify: `../armada/docs/superpowers/specs/2026-07-16-historical-group-pull-marketing-design.md`
- Modify: `../armada/.harness/changes/2026-07-16-historical-group-pull-marketing.md`

- [x] **Step 1: 恢复设计规则**

  操作账号选择器只展示所选分组内 `account_state=2` 且 `login_state=1` 的账号，号码和 ID 完整展示。

- [x] **Step 2: 记录最终回退**

  保留历史记录并追加最终口径：数据库核验确认历史群测试账号 `302` 为解绑离线，原严格筛选排除它属于预期行为。

### Task 4: 验证

**Files:**

- Verify: `src/views/group/history/**`

- [x] **Step 1: 运行相关测试**

  Run: `node --import ./src/api/__tests__/node-test-alias.mjs --test src/api/historical-group.test.ts src/views/account/index/account-display.test.ts src/views/group/history/HistoricalGroupPage.test.ts src/views/group/history/HistoricalGroupDetail.test.ts src/views/group/history/HistoricalGroupExecution.test.ts`

  Expected: 全部 PASS。

- [x] **Step 2: 运行静态验证与构建**

  Run: `./node_modules/.bin/tsc --noEmit`

  Run: `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck`

  Run: `./node_modules/.bin/eslint --max-warnings 0 src/views/group/history/composables/useHistoricalGroupPage.ts src/views/group/history/HistoricalGroupPage.test.ts`

  Run: `./node_modules/.bin/prettier --check src/views/group/history/composables/useHistoricalGroupPage.ts src/views/group/history/HistoricalGroupPage.test.ts docs/superpowers/plans/2026-07-17-historical-group-normal-online-selection.md`

  Run: `./node_modules/.bin/vite build`

  Expected: 全部 exit code 0。

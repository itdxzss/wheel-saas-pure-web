# Buyer Channel Country Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让渠道新增/编辑抽屉通过项目现有国家主数据接口获取目标国家与默认区号。

**Architecture:** 在渠道业务域新增纯映射函数，将 `IpCountryOption[]` 转成现有 `BuyerChannelOptions["countries"]`。渠道页并行加载原有渠道 options 和国家主数据，避免修改公共 API、组件或框架。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Node test runner。

## Global Constraints

- 复用 `listIpCountryOptions()`，不新增后端路径。
- 不修改公共组件、路由、权限或布局。
- 国家接口失败不得阻塞其他页面布局。

---

### Task 1: 国家数据映射与渠道页接入

**Files:**

- Create: `src/views/buyer/channel/domain/channel-country-options.ts`
- Create: `src/views/buyer/channel/domain/channel-country-options.test.ts`
- Modify: `src/views/buyer/channel/index.vue`
- Modify: `src/views/buyer/channel/ChannelPageContract.test.ts`

**Interfaces:**

- Consumes: `listIpCountryOptions(): Promise<IpCountryOption[]>`
- Produces: `toBuyerChannelCountries(rows): BuyerChannelOptions["countries"]`

- [ ] **Step 1: Write the failing tests**

  测试输入包含虚拟 `MIXED` 和真实 `IN`，断言只输出 `{ code: "IN", name: "印度", dialCode: "+91" }`；页面契约断言调用 `listIpCountryOptions`。

- [ ] **Step 2: Run tests to verify they fail**

  Run: `node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/views/buyer/channel/domain/channel-country-options.test.ts src/views/buyer/channel/ChannelPageContract.test.ts`

  Expected: FAIL，映射模块或页面调用尚不存在。

- [ ] **Step 3: Implement the minimal mapping and page loading**

  映射函数过滤 `virtual === true` 或缺少 `iso2` 的项；渠道页通过 `Promise.allSettled` 加载两组 options，并把映射结果写入 `options.countries`。

- [ ] **Step 4: Verify tests and static checks**

  Run: 上述测试命令、`pnpm typecheck`、针对四个改动文件的 ESLint。

- [ ] **Step 5: Commit**

  `git commit -m "fix(buyer): load channel countries from master data"`

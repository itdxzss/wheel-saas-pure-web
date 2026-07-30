# 拉群营销新建页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有拉群营销创建抽屉替换为独立全页前端原型，完整覆盖五个字段分区，并在接口契约未确认时安全阻止提交。

**Architecture:** 新建隐藏路由承载创建页，页面草稿和条件显隐使用同域纯 TypeScript 模型，五个配置分区拆成局部 Vue 组件。页面只维护本地交互和明确空状态，不调用旧创建接口，不注入生产 mock；列表页改为路由跳转入口。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Vue Router、Element Plus、pure-admin-thin、Node test runner、pnpm、Vite。

---

本计划只覆盖独立新建页；一级列表九个合并字段使用已存在且已提交的 `docs/superpowers/plans/2026-07-29-group-pull-marketing-task-list-v16.md`。两个计划完成后统一做工程验证。

## 文件结构

- Modify: `src/api/routes.ts` — 从真实授权菜单派生隐藏新建路由，并保证静态 `/create` 位于动态 `/:id` 前。
- Modify: `mock/asyncRoutes.ts` — 开发 fallback 增加同结构隐藏新建路由。
- Modify: `src/router/group-pull-marketing-route.test.ts` — 锁定新建路由、详情路由顺序和菜单高亮。
- Create: `src/views/task/group-pull-marketing/create/create-draft.ts` — 创建页草稿类型、默认值、空统计和条件显隐函数。
- Create: `src/views/task/group-pull-marketing/create/create-draft.test.ts` — 覆盖默认草稿、条件字段和空统计。
- Create: `src/views/task/group-pull-marketing/create/components/CreateBaseInfoSection.vue` — 基础信息和目标数据统计。
- Create: `src/views/task/group-pull-marketing/create/components/CreateTargetGroupSection.vue` — 群配置、筛选、等待池和候选群空表。
- Create: `src/views/task/group-pull-marketing/create/components/CreateRoleConfigSection.vue` — 四类角色资源卡和拉手/水军参数。
- Create: `src/views/task/group-pull-marketing/create/components/CreateMarketingSection.vue` — 模板、发送策略、阈值和未达标处理。
- Create: `src/views/task/group-pull-marketing/create/components/CreateLaunchSection.vue` — 启动时机。
- Create: `src/views/task/group-pull-marketing/create/index.vue` — 页面装配、返回和安全阻断操作。
- Create: `src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts` — 锁定五分区、字段和底部动作。
- Modify: `src/views/task/group-pull-marketing/index.vue` — 新增按钮改为路由跳转，移除旧抽屉装配。
- Modify: `src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.vue` — 新增按钮文案保持不变，事件仍由列表容器处理。
- Delete: `src/views/task/group-pull-marketing/components/GroupPullMarketingCreateDrawer.vue` — 删除无入口旧创建交互。
- Delete: `src/views/task/group-pull-marketing/components/GroupPullMarketingCreateDrawer.test.ts` — 删除旧抽屉契约测试。
- Modify: `.harness/changes/group-pull-marketing-prototype-frontend/summary.md` — 记录前端范围与验证证据。

### Task 1: 增加隐藏新建路由

**Files:**

- Modify: `src/router/group-pull-marketing-route.test.ts`
- Modify: `src/api/routes.ts`
- Modify: `mock/asyncRoutes.ts`

- [ ] **Step 1: 写路由失败测试**

在 `group-pull-marketing-route.test.ts` 读取新建页源码，并增加：

```ts
const groupPullCreateSource = readFileSync(
  fileURLToPath(
    new URL(
      "../views/task/group-pull-marketing/create/index.vue",
      import.meta.url
    )
  ),
  "utf8"
);

it("derives a hidden create route before the dynamic detail route", () => {
  const createIndex = routeSource.indexOf(
    'path: "/task/group-pull-marketing/create"'
  );
  const detailIndex = routeSource.indexOf(
    'path: "/task/group-pull-marketing/:id"'
  );
  assert.ok(createIndex >= 0);
  assert.ok(detailIndex > createIndex);
  assert.match(routeSource, /TaskGroupPullMarketingCreate/);
  assert.match(
    routeSource,
    /component: "task\/group-pull-marketing\/create\/index"/
  );
  assert.match(routeSource, /activePath: "\/task\/group-pull-marketing"/);
  assert.match(groupPullCreateSource, /返回拉群任务/);
});
```

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test src/router/group-pull-marketing-route.test.ts
```

Expected: FAIL，提示新建页文件不存在或 `/create` 路由不存在。

- [ ] **Step 3: 创建最小新建页并派生真实路由**

先创建 `create/index.vue` 最小壳：

```vue
<script setup lang="ts">
defineOptions({ name: "TaskGroupPullMarketingCreate" });
</script>

<template>
  <div aria-label="新建拉群营销任务">返回拉群任务</div>
</template>
```

在 `appendAuthorizedCompanionRoutes` 中创建静态路由，并按列表、新建、详情顺序返回：

```ts
const createRoute = {
  path: "/task/group-pull-marketing/create",
  component: "task/group-pull-marketing/create/index",
  name: "TaskGroupPullMarketingCreate",
  meta: {
    ...route.meta,
    title: "新建拉群营销任务",
    showLink: false,
    activePath: "/task/group-pull-marketing"
  }
} as unknown as RouteRecordRaw;

return [normalizedRoute, createRoute, detailRoute];
```

在 `mock/asyncRoutes.ts` 的列表路由之后、动态详情之前增加等价 fallback 路由，沿用列表的 `roles`、`module_key` 和 `perm_key`。

- [ ] **Step 4: 运行路由测试确认绿灯**

Run:

```bash
node --test src/router/group-pull-marketing-route.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交路由骨架**

```bash
git add src/api/routes.ts mock/asyncRoutes.ts src/router/group-pull-marketing-route.test.ts src/views/task/group-pull-marketing/create/index.vue
git commit -m "feat: add group pull marketing create route"
```

### Task 2: 建立创建草稿契约

**Files:**

- Create: `src/views/task/group-pull-marketing/create/create-draft.test.ts`
- Create: `src/views/task/group-pull-marketing/create/create-draft.ts`

- [ ] **Step 1: 写草稿失败测试**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEmptyGroupPullDraft,
  emptyTargetDataMetrics,
  showScheduledStart,
  showSendRounds
} from "./create-draft";

describe("group pull marketing create draft", () => {
  it("creates an independent draft with prototype defaults", () => {
    const first = createEmptyGroupPullDraft();
    const second = createEmptyGroupPullDraft();
    assert.equal(first.groupSource, "HISTORICAL");
    assert.equal(first.sendMode, "ROUNDS");
    assert.equal(first.startMode, "IMMEDIATE");
    assert.equal(first.groupMaxMembers, 300);
    assert.equal(first.pullerCountPerGroup, 2);
    assert.equal(first.marketingIntervalMinutes, 10);
    first.unmetActions.push("MANUAL");
    assert.deepEqual(second.unmetActions, []);
  });

  it("uses missing metrics instead of fabricated zero values", () => {
    assert.deepEqual(Object.values(emptyTargetDataMetrics()), [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ]);
  });

  it("derives conditional field visibility", () => {
    assert.equal(showScheduledStart("IMMEDIATE"), false);
    assert.equal(showScheduledStart("SCHEDULED"), true);
    assert.equal(showSendRounds("ROUNDS"), true);
    assert.equal(showSendRounds("DURATION"), false);
  });
});
```

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/group-pull-marketing/create/create-draft.test.ts
```

Expected: FAIL，提示无法解析 `./create-draft`。

- [ ] **Step 3: 实现类型、默认值和纯函数**

在 `create-draft.ts` 定义有限枚举联合类型以及 `GroupPullMarketingCreateDraft`，字段至少包含五个区块中的所有 `v-model`：

```ts
export type GroupSource = "HISTORICAL" | "SELF_COLLECTED" | "MIXED";
export type SendMode = "ROUNDS" | "DURATION";
export type StartMode = "IMMEDIATE" | "SCHEDULED";
export type ThresholdMode = "COUNT" | "RATE";
export type UnmetAction =
  | "CONTINUE"
  | "REPLACE_PULLER"
  | "REPLACE_WATER_ARMY"
  | "SUPPLY_TARGET"
  | "RETRY"
  | "PAUSE_GROUP"
  | "PARTIAL_COMPLETE"
  | "MANUAL"
  | "ABANDON_GROUP";

export interface TargetDataMetrics {
  raw: number | null;
  valid: number | null;
  duplicate: number | null;
  malformed: number | null;
  invalidPhone: number | null;
  unregistered: number | null;
  used: number | null;
  reserved: number | null;
  available: number | null;
}

export interface GroupPullMarketingCreateDraft {
  taskName: string;
  groupSource: GroupSource;
  remark: string;
  targetPackageId: number | "";
  targetFile: File | null;
  resourceSource: GroupSource;
  clearMembers: boolean;
  muted: boolean;
  groupMaxMembers: number;
  groupNameMode: "KEEP" | "UNIFIED" | "TEMPLATE_SEQUENCE";
  groupAvatarFile: File | null;
  groupDescriptionMode: "KEEP" | "UNIFIED";
  groupInfoPermission: string;
  joinApproval: string;
  memberInvitePermission: string;
  targetGroupTab: "CANDIDATES" | "WAITING_POOL";
  continent: string;
  countries: string[];
  currentRole: string;
  groupNameKeyword: string;
  groupStatus: string;
  managerPhone: string;
  groupJid: string;
  showRegularGroups: boolean;
  occupancy: string;
  speakPermission: string;
  filterJoinApproval: string;
  filterInvitePermission: string;
  groupAgeRange: [number, number];
  memberCountRange: [number, number];
  selectedGroupIds: number[];
  pullerCountPerGroup: number;
  maxPeoplePerPuller: number;
  maxPeoplePerPull: number;
  pullIntervalMs: number;
  maxPullers: number;
  maxGroups: number;
  abnormalGroupLimit: number;
  pullerRetryLimit: number;
  pullerCircuitBreakCount: number;
  pullerExitAfterCompletion: boolean;
  upperLimitAction: "PAUSE" | "STOP";
  waterArmyPerGroup: number;
  waterArmyTaskGroupLimit: number;
  waterArmyDailyGroupLimit: number;
  allowCrossTaskReuse: boolean;
  waterArmyShortageAction: string;
  allowReducePlan: boolean;
  allowWaterArmyReplacement: boolean;
  marketingIntervalMinutes: number;
  marketingTemplateId: number | "";
  sendFirstImmediately: boolean;
  sendMode: SendMode;
  sendRounds: number;
  sendDurationMinutes: number;
  messageLimit: number;
  sendRetryLimit: number;
  groupFailureAction: string;
  marketingStartMode: string;
  waterArmyThresholdMode: ThresholdMode;
  waterArmyThreshold: number;
  targetThresholdMode: ThresholdMode;
  targetThreshold: number;
  unmetActions: UnmetAction[];
  startMode: StartMode;
  scheduledAt: string;
}
```

实现 `emptyTargetDataMetrics()`，九项均返回 `null`；实现 `createEmptyGroupPullDraft()`，原型明确展示的默认值写入草稿，其余选择项用空字符串/空数组；实现 `showScheduledStart` 和 `showSendRounds` 作为严格布尔纯函数。

- [ ] **Step 4: 运行草稿测试和类型检查**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/group-pull-marketing/create/create-draft.test.ts
pnpm typecheck
```

Expected: PASS，typecheck 退出码 0。

- [ ] **Step 5: 提交草稿模型**

```bash
git add src/views/task/group-pull-marketing/create/create-draft.ts src/views/task/group-pull-marketing/create/create-draft.test.ts
git commit -m "feat: add group pull create draft model"
```

### Task 3: 实现基础信息和目标群配置

**Files:**

- Create: `src/views/task/group-pull-marketing/create/components/CreateBaseInfoSection.vue`
- Create: `src/views/task/group-pull-marketing/create/components/CreateTargetGroupSection.vue`
- Create: `src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts`

- [ ] **Step 1: 写前两区块失败测试**

测试读取两个组件源码，逐项断言：

```ts
for (const label of [
  "任务名称",
  "群组来源",
  "任务备注",
  "目标数据包",
  "上传 TXT",
  "原始数量",
  "当前可用"
])
  assert.match(baseSource, new RegExp(label));

for (const label of [
  "群资源使用方式",
  "是否清空当前群成员",
  "是否禁言",
  "群最大人数",
  "群名称修改方式",
  "群头像",
  "群描述",
  "群资料修改权限",
  "入群审批",
  "成员邀请权限",
  "目标群组选择",
  "等待任务池",
  "群组 JID",
  "群存续天数",
  "群当前人数"
])
  assert.match(targetSource, new RegExp(label));

assert.match(baseSource, /accept="\.txt"/);
assert.match(targetSource, /<el-table/);
assert.match(targetSource, /<el-empty/);
assert.doesNotMatch(targetSource, /Indonesia Game Squad|120363401003/);
```

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
```

Expected: FAIL，组件文件不存在。

- [ ] **Step 3: 实现基础信息区块**

使用 `defineModel<GroupPullMarketingCreateDraft>({ required: true })`。用 `ElFormItem`、`ElInput`、`ElRadioGroup`、`ElSelect`、`ElUpload` 和 `ElStatistic` 完成字段；文件变化只执行：

```ts
function selectTargetFile(file: UploadFile): void {
  if (file.raw) draft.value.targetFile = file.raw;
}
```

统计九项来自 `metrics: TargetDataMetrics` props，`null` 统一通过 `metricLabel(value)` 显示 `--`，不展示原型示例数字。

- [ ] **Step 4: 实现目标群区块**

使用 Element Plus 原生组件完成两列表单、筛选表单、`ElTabs` 和 `ElTable`。候选群 `rows` 固定为类型化空数组，不写静态行；表格列为选择、群组信息、群组 JID、当前管理账号、角色/来源和状态。按钮“全选可执行”“加入等待任务池”点击时使用 `ElMessage.info("群组筛选接口待确认")`，不伪造选择结果。

- [ ] **Step 5: 运行结构测试和类型检查**

Run:

```bash
node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
pnpm typecheck
```

Expected: PASS，typecheck 退出码 0。

- [ ] **Step 6: 提交前两区块**

```bash
git add src/views/task/group-pull-marketing/create/components/CreateBaseInfoSection.vue src/views/task/group-pull-marketing/create/components/CreateTargetGroupSection.vue src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
git commit -m "feat: add group pull target configuration sections"
```

### Task 4: 实现角色账号与拉手配置

**Files:**

- Create: `src/views/task/group-pull-marketing/create/components/CreateRoleConfigSection.vue`
- Modify: `src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts`

- [ ] **Step 1: 写角色配置失败测试**

读取组件源码并逐项断言四张资源卡和参数标签：

```ts
for (const label of [
  "管理员账号",
  "拉手账号",
  "水军账号",
  "营销账号",
  "每群计划使用拉手数量",
  "每个拉手最多拉多少人",
  "单个拉手每次最多拉多少人",
  "两次拉人之间等待时间",
  "最大使用拉手总数",
  "最大使用群组数",
  "连续异常群组上限",
  "拉手最大重试次数",
  "拉手熔断次数",
  "拉手完成后是否退出群组",
  "到达执行上限后的处理方式",
  "每群计划水军人数",
  "水军单任务入群上限",
  "水军每日入群上限",
  "允许跨任务复用",
  "水军资源不足处理",
  "允许降低计划数量",
  "允许替换水军"
])
  assert.match(roleSource, new RegExp(label));
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts`

Expected: FAIL，角色组件不存在。

- [ ] **Step 3: 实现资源卡与参数表单**

四张资源卡使用本地数组渲染，稳定 key 为 `ADMIN`、`PULLER`、`WATER_ARMY`、`MARKETER`；计数显示 `--`。修改筛选条件和清空按钮统一显示 `ElMessage.info("账号筛选接口待确认")`。数字字段使用 `ElInputNumber`，布尔字段使用 `ElSwitch`，二选一使用 `ElRadioGroup`，并将单位写在标签或 `suffix` 区域。

- [ ] **Step 4: 运行测试和类型检查**

Run:

```bash
node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
pnpm typecheck
```

Expected: PASS。

- [ ] **Step 5: 提交角色配置**

```bash
git add src/views/task/group-pull-marketing/create/components/CreateRoleConfigSection.vue src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
git commit -m "feat: add group pull role configuration"
```

### Task 5: 实现营销消息和启动时机

**Files:**

- Create: `src/views/task/group-pull-marketing/create/components/CreateMarketingSection.vue`
- Create: `src/views/task/group-pull-marketing/create/components/CreateLaunchSection.vue`
- Modify: `src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts`

- [ ] **Step 1: 写后两区块失败测试**

```ts
for (const label of [
  "营销发送间隔",
  "营销模板",
  "模板版本",
  "推广链接",
  "模板内容预览",
  "立即发送第一条",
  "发送方式",
  "固定发送轮次",
  "消息发送总上限",
  "失败重试次数",
  "群组异常处理方式",
  "营销开始方式",
  "水军最低成功标准",
  "目标数据最低成功标准",
  "未达标处理方式"
])
  assert.match(marketingSource, new RegExp(label));

for (const label of [
  "任务启动时机",
  "创建后立即开始",
  "指定时间开始",
  "邀请链接重置能力待后端确认"
])
  assert.match(launchSource, new RegExp(label));
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts`

Expected: FAIL，后两区块不存在。

- [ ] **Step 3: 实现营销配置**

模板只读信息显示 `--`；模板下拉为空并带 `empty` 文案。`sendMode === "ROUNDS"` 时显示固定轮次，`DURATION` 时显示持续时间。两个最低成功标准用模式单选加数字输入；未达标处理使用 `ElCheckboxGroup` 绑定 `unmetActions`，选项值与 `UnmetAction` 一致。

- [ ] **Step 4: 实现启动配置**

启动模式用单选按钮组；`showScheduledStart(draft.startMode)` 为真时显示 `ElDatePicker type="datetime"`。底部使用 `ElAlert` 展示邀请链接重置能力提示。

- [ ] **Step 5: 运行测试和类型检查**

Run:

```bash
node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
pnpm typecheck
```

Expected: PASS。

- [ ] **Step 6: 提交营销与启动区块**

```bash
git add src/views/task/group-pull-marketing/create/components/CreateMarketingSection.vue src/views/task/group-pull-marketing/create/components/CreateLaunchSection.vue src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
git commit -m "feat: add group pull marketing launch sections"
```

### Task 6: 装配完整新建页并替换列表入口

**Files:**

- Modify: `src/views/task/group-pull-marketing/create/index.vue`
- Modify: `src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts`
- Modify: `src/views/task/group-pull-marketing/index.vue`
- Delete: `src/views/task/group-pull-marketing/components/GroupPullMarketingCreateDrawer.vue`
- Delete: `src/views/task/group-pull-marketing/components/GroupPullMarketingCreateDrawer.test.ts`

- [ ] **Step 1: 写装配与入口失败测试**

断言新建页导入五个区块并显示底部动作：

```ts
for (const component of [
  "CreateBaseInfoSection",
  "CreateTargetGroupSection",
  "CreateRoleConfigSection",
  "CreateMarketingSection",
  "CreateLaunchSection"
])
  assert.match(pageSource, new RegExp(component));

for (const action of ["保存草稿", "校验配置", "预览任务", "取消", "创建并启动"])
  assert.match(pageSource, new RegExp(action));

assert.match(
  listSource,
  /router\.push\("\/task\/group-pull-marketing\/create"\)/
);
assert.doesNotMatch(listSource, /GroupPullMarketingCreateDrawer/);
```

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
```

Expected: FAIL，新建页仍是最小壳且列表仍装配抽屉。

- [ ] **Step 3: 装配新建页**

新建页创建 `reactive(createEmptyGroupPullDraft())`、`emptyTargetDataMetrics()`，顶部用 `ElPageHeader` 返回列表，流程用 `ElAlert` 表达。五个组件按顺序传入同一 draft。底部动作实现为：

```ts
function unavailableAction(action: string): void {
  ElMessage.info(`${action}接口契约待确认，当前仅完成前端配置`);
}

async function backToList(): Promise<void> {
  await router.push("/task/group-pull-marketing");
}
```

“取消”调用 `backToList`；保存草稿、校验配置、预览任务、创建并启动调用 `unavailableAction`。页面样式只使用 Element Plus CSS 变量，桌面两列、`width <= 900px` 单列，底部操作栏保持可见且不遮挡内容。

- [ ] **Step 4: 列表新增按钮改为路由跳转**

删除旧抽屉 import、props 和装配，增加：

```ts
async function openCreatePage(): Promise<void> {
  await router.push("/task/group-pull-marketing/create");
}
```

表格的 `@create` 改为 `openCreatePage`。删除旧抽屉及测试，不修改旧 API 函数，避免扩大本次接口范围。

- [ ] **Step 5: 运行相关测试和类型检查**

Run:

```bash
node --test src/router/group-pull-marketing-route.test.ts src/views/task/group-pull-marketing/create/create-draft.test.ts src/views/task/group-pull-marketing/create/GroupPullMarketingCreatePage.test.ts
pnpm typecheck
```

Expected: PASS，typecheck 退出码 0。

- [ ] **Step 6: 提交页面装配**

```bash
git add src/views/task/group-pull-marketing/create src/views/task/group-pull-marketing/index.vue src/views/task/group-pull-marketing/components/GroupPullMarketingCreateDrawer.vue src/views/task/group-pull-marketing/components/GroupPullMarketingCreateDrawer.test.ts
git commit -m "feat: replace group pull create drawer with page"
```

### Task 7: 记录变更并完成综合验证

**Files:**

- Create: `.harness/changes/group-pull-marketing-prototype-frontend/summary.md`

- [ ] **Step 1: 写变更记录**

记录目标、设计与计划路径、已改文件、明确未接接口、验证命令和实际结果。不得写入凭据、远程地址或虚构验证结果。

- [ ] **Step 2: 运行拉群营销完整 Node 测试**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/api/group-pull-marketing.test.ts src/views/task/group-pull-marketing/**/*.test.ts src/router/group-pull-marketing-route.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 3: 运行静态检查**

Run:

```bash
pnpm typecheck
pnpm exec eslint --max-warnings 0 src/api/group-pull-marketing.ts src/api/group-pull-marketing.test.ts src/api/routes.ts src/router/group-pull-marketing-route.test.ts src/views/task/group-pull-marketing --fix
pnpm exec stylelint "src/views/task/group-pull-marketing/**/*.vue" --fix
```

Expected: 全部退出码为 0。

- [ ] **Step 4: 运行生产构建**

Run:

```bash
pnpm build
```

Expected: 构建成功，退出码 0。

- [ ] **Step 5: 检查差异范围**

Run:

```bash
git status --short
git diff --check
git diff --stat HEAD~1
```

Expected: 只包含拉群营销功能和变更记录；工作区既有群列表改动与本功能提交相互独立。

- [ ] **Step 6: 提交变更记录**

```bash
git add .harness/changes/group-pull-marketing-prototype-frontend/summary.md
git commit -m "docs: record group pull prototype frontend"
```

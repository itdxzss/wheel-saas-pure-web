# 拉群营销一级任务列表 V16 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有拉群营销一级页面升级为五项查询条件和 PRD 第 16 章规定的九个合并字段，不添加静态数据并兼容后端缺失的新统计字段。

**Architecture:** 保留现有路由、composable、API 封装、新增抽屉和任务操作矩阵；在 API 行类型中增加可选的 V16 语义字段，并新增纯展示格式化模块隔离缺失值、零值、比例和资源不足文案。页面查询区只补齐现有接口已经支持的阻塞原因和资源状态，表格组件负责九个合并单元格及横向滚动布局。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Element Plus、pure-admin `PureTableBar`、Node test runner、pnpm、Vite。

---

## 文件结构

- Modify: `src/api/group-pull-marketing.ts` — 扩展一级任务行的 V16 可选统计契约和资源不足类型。
- Modify: `src/api/group-pull-marketing.test.ts` — 锁定五项查询参数和 V16 行结构的类型用法。
- Create: `src/views/task/group-pull-marketing/task-list-display.ts` — 纯展示函数，区分字段缺失和合法零值。
- Create: `src/views/task/group-pull-marketing/task-list-display.test.ts` — 覆盖数字、百分比、进度、来源和资源不足文案。
- Modify: `src/views/task/group-pull-marketing/constants.ts` — 将动态列定义替换为九个合并字段。
- Modify: `src/views/task/group-pull-marketing/constants.test.ts` — 锁定九列顺序并保留任务操作矩阵回归。
- Modify: `src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.vue` — 渲染九个合并单元格。
- Modify: `src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts` — 校验表格结构、缺失值策略和现有操作复用。
- Modify: `src/views/task/group-pull-marketing/index.vue` — 补齐阻塞原因和资源状态筛选控件。
- Create: `src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts` — 锁定五项查询控件。
- Modify: `src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.ts` — 列表刷新失败时保留上次成功数据。
- Modify: `src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts` — 覆盖五项筛选请求和完整重置。
- Modify: `.harness/changes/group-pull-marketing-task-list-v16/summary.md` — 记录完成项和验证证据。

### Task 1: 建立 V16 列表数据与展示契约

**Files:**

- Modify: `src/api/group-pull-marketing.ts`
- Modify: `src/api/group-pull-marketing.test.ts`
- Create: `src/views/task/group-pull-marketing/task-list-display.ts`
- Create: `src/views/task/group-pull-marketing/task-list-display.test.ts`

- [ ] **Step 1: 写展示函数失败测试**

创建 `task-list-display.test.ts`，先锁定缺失值不伪造、零值正常展示、比例和资源不足文案：

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayMetric,
  displayRate,
  groupSourceLabel,
  progressPercentage,
  resourceShortageLabel,
  taskTypeLabel
} from "./task-list-display";

describe("group pull marketing v16 task list display", () => {
  it("keeps missing metrics separate from real zero values", () => {
    assert.equal(displayMetric(undefined), "--");
    assert.equal(displayMetric(null), "--");
    assert.equal(displayMetric(0), "0");
    assert.equal(displayMetric(29886), "29,886");
    assert.equal(displayRate(undefined), "--");
    assert.equal(displayRate(0), "0.0%");
    assert.equal(displayRate(72.6), "72.6%");
  });

  it("only calculates progress from a known positive target", () => {
    assert.equal(progressPercentage(68, 100), 68);
    assert.equal(progressPercentage(120, 100), 100);
    assert.equal(progressPercentage(undefined, 100), null);
    assert.equal(progressPercentage(0, 0), null);
  });

  it("maps confirmed task metadata without guessing unknown values", () => {
    assert.equal(taskTypeLabel("GROUP_MARKETING"), "拉群营销");
    assert.equal(taskTypeLabel(undefined), "--");
    assert.equal(groupSourceLabel("HISTORICAL"), "历史老群");
    assert.equal(groupSourceLabel("SELF_COLLECTED"), "自收群");
    assert.equal(groupSourceLabel("MIXED"), "混合来源");
    assert.equal(groupSourceLabel(undefined), "--");
  });

  it("formats every PRD resource shortage type", () => {
    assert.equal(
      resourceShortageLabel({
        type: "MARKETING_ADMIN",
        shortageCount: 2
      }),
      "缺营销管理员2个"
    );
    assert.equal(
      resourceShortageLabel({ type: "PULLER", shortageCount: null }),
      "拉手不足"
    );
  });
});
```

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/group-pull-marketing/task-list-display.test.ts
```

Expected: FAIL，提示无法解析 `./task-list-display`。

- [ ] **Step 3: 增加 V16 API 行类型**

在 `src/api/group-pull-marketing.ts` 的一级任务类型旁增加：

```ts
export type GroupPullMarketingTaskType = "GROUP_MARKETING";

export type GroupPullMarketingGroupSource =
  | "HISTORICAL"
  | "SELF_COLLECTED"
  | "MIXED";

export type GroupPullMarketingResourceShortageType =
  | "TARGET_DATA"
  | "PULLER"
  | "WATER_ARMY"
  | "ADMIN"
  | "MARKETING_ADMIN";

export interface GroupPullMarketingResourceShortage {
  type: GroupPullMarketingResourceShortageType;
  shortageCount?: number | null;
}
```

在 `GroupPullMarketingTaskRow` 保留旧字段，并追加以下可选字段：

```ts
taskType?: GroupPullMarketingTaskType | null;
groupSource?: GroupPullMarketingGroupSource | null;
primaryStage?: string | null;
processedGroupCount?: number | null;
targetGroupCount?: number | null;
joinedSuccessCount?: number | null;
plannedTargetCount?: number | null;
effectiveSuccessRate?: number | null;
marketingRunningGroupCount?: number | null;
marketingCompletedGroupCount?: number | null;
messageSuccessCount?: number | null;
messageFailedCount?: number | null;
messageUnknownCount?: number | null;
abnormalGroupCount?: number | null;
replacementPendingGroupCount?: number | null;
bannedAccountCount?: number | null;
remainingTargetCount?: number | null;
availablePullerCount?: number | null;
resourceShortages?: GroupPullMarketingResourceShortage[] | null;
lastExecutedAt?: number | null;
```

在 API 测试中导入 `GroupPullMarketingTaskRow`，构造一个包含上述字段的 `v16Row` 并断言字段保持原值。该测试不转换后端数据，只确保契约可被调用方完整使用：

```ts
const v16Row = {
  id: 8,
  taskName: "印度老群营销",
  status: 2,
  blockReason: 0,
  resourceStatus: 2,
  totalDataCount: 44040,
  completedDataCount: 29886,
  successGroupCount: 68,
  failedGroupCount: 3,
  marketingAccountTotalCount: 20,
  usedMarketingAccountCount: 12,
  createdAt: 1785250000000,
  taskEndAt: 1785337199000,
  taskType: "GROUP_MARKETING",
  groupSource: "HISTORICAL",
  processedGroupCount: 68,
  targetGroupCount: 100,
  effectiveSuccessRate: 72.6,
  resourceShortages: [{ type: "MARKETING_ADMIN", shortageCount: 2 }]
} satisfies GroupPullMarketingTaskRow;

assert.equal(v16Row.groupSource, "HISTORICAL");
assert.equal(v16Row.resourceShortages[0].shortageCount, 2);
```

- [ ] **Step 4: 实现纯展示函数**

创建 `task-list-display.ts`：

```ts
import type {
  GroupPullMarketingGroupSource,
  GroupPullMarketingResourceShortage,
  GroupPullMarketingResourceShortageType,
  GroupPullMarketingTaskType
} from "@/api/group-pull-marketing";

const metricFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

const shortageNames: Record<GroupPullMarketingResourceShortageType, string> = {
  TARGET_DATA: "目标数据",
  PULLER: "拉手",
  WATER_ARMY: "水军",
  ADMIN: "潜水管理员",
  MARKETING_ADMIN: "营销管理员"
};

export function displayMetric(value?: number | null): string {
  return value == null ? "--" : metricFormatter.format(value);
}

export function displayRate(value?: number | null): string {
  return value == null ? "--" : `${value.toFixed(1)}%`;
}

export function progressPercentage(
  completed?: number | null,
  total?: number | null
): number | null {
  if (completed == null || total == null || total <= 0) return null;
  return Math.min(100, Math.max(0, (completed / total) * 100));
}

export function taskTypeLabel(
  type?: GroupPullMarketingTaskType | null
): string {
  return type === "GROUP_MARKETING" ? "拉群营销" : "--";
}

export function groupSourceLabel(
  source?: GroupPullMarketingGroupSource | null
): string {
  if (source === "HISTORICAL") return "历史老群";
  if (source === "SELF_COLLECTED") return "自收群";
  if (source === "MIXED") return "混合来源";
  return "--";
}

export function resourceShortageLabel(
  shortage: GroupPullMarketingResourceShortage
): string {
  const name = shortageNames[shortage.type];
  return shortage.shortageCount == null
    ? `${name}不足`
    : `缺${name}${displayMetric(shortage.shortageCount)}个`;
}
```

- [ ] **Step 5: 运行契约测试和类型检查确认绿灯**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/api/group-pull-marketing.test.ts src/views/task/group-pull-marketing/task-list-display.test.ts
pnpm typecheck
```

Expected: 新增测试全部 PASS；`typecheck` 退出码为 0。

- [ ] **Step 6: 提交数据与展示契约**

```bash
git add src/api/group-pull-marketing.ts src/api/group-pull-marketing.test.ts src/views/task/group-pull-marketing/task-list-display.ts src/views/task/group-pull-marketing/task-list-display.test.ts
git commit -m "feat: add v16 marketing task list contract"
```

### Task 2: 将旧表格替换为九个合并字段

**Files:**

- Modify: `src/views/task/group-pull-marketing/constants.ts`
- Modify: `src/views/task/group-pull-marketing/constants.test.ts`
- Modify: `src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.vue`
- Modify: `src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts`

- [ ] **Step 1: 写九列结构失败测试**

将表格测试的旧字段断言替换为顺序断言：

```ts
const v16Labels = [
  "任务信息",
  "任务状态",
  "群组处理进度",
  "拉人结果",
  "营销进度",
  "消息发送",
  "异常情况",
  "剩余资源",
  "时间/操作"
];

it("renders exactly the nine merged v16 columns", () => {
  let previousIndex = -1;
  for (const label of v16Labels) {
    const index = source.indexOf(`label="${label}"`);
    assert.ok(index > previousIndex, `${label} should follow the PRD order`);
    previousIndex = index;
  }
  for (const legacyLabel of [
    "任务ID",
    "任务名称",
    "数据",
    "建群数量",
    "失败数量",
    "营销号",
    "创建时间",
    "结束时间"
  ]) {
    assert.doesNotMatch(source, new RegExp(`label="${legacyLabel}"`));
  }
  assert.match(source, /fixed="left"/);
  assert.match(source, /fixed="right"/);
  assert.match(source, /<el-progress/);
  assert.match(source, /<el-tooltip/);
  assert.match(source, /displayMetric/);
  assert.match(source, /displayRate/);
  assert.match(source, /resourceShortageLabel/);
  assert.match(source, /groupPullTaskActions/);
});
```

在 `constants.test.ts` 增加：

```ts
assert.deepEqual(
  taskColumns.map(column => column.label),
  v16Labels
);
```

- [ ] **Step 2: 运行测试确认仍是旧表格**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/group-pull-marketing/constants.test.ts src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts
```

Expected: FAIL，首个缺失列为“任务信息”。

- [ ] **Step 3: 将动态列声明替换为九列**

用以下定义替换 `taskColumns`：

```ts
export const taskColumns: TableColumnList = [
  { label: "任务信息", prop: "taskName", minWidth: 260 },
  { label: "任务状态", prop: "status", minWidth: 190 },
  { label: "群组处理进度", prop: "processedGroupCount", minWidth: 180 },
  { label: "拉人结果", prop: "joinedSuccessCount", minWidth: 210 },
  { label: "营销进度", prop: "marketingRunningGroupCount", minWidth: 165 },
  { label: "消息发送", prop: "messageSuccessCount", minWidth: 205 },
  { label: "异常情况", prop: "abnormalGroupCount", minWidth: 190 },
  { label: "剩余资源", prop: "remainingTargetCount", minWidth: 220 },
  { label: "时间/操作", prop: "lastExecutedAt", minWidth: 250 }
];
```

- [ ] **Step 4: 增加表格脚本层的派生函数**

从 `task-list-display.ts` 导入展示函数，并增加只读判断函数，避免模板把 `undefined` 当成 0：

```ts
import {
  displayMetric,
  displayRate,
  groupSourceLabel,
  progressPercentage,
  resourceShortageLabel,
  taskTypeLabel
} from "../task-list-display";

function hasAnyMetric(...values: Array<number | null | undefined>): boolean {
  return values.some(value => value != null);
}

function groupProgress(row: GroupPullMarketingTaskRow): number | null {
  return progressPercentage(row.processedGroupCount, row.targetGroupCount);
}

function lastExecutedAt(row: GroupPullMarketingTaskRow): string {
  return row.lastExecutedAt == null ? "--" : formatEpoch(row.lastExecutedAt);
}

function statusDetail(row: GroupPullMarketingTaskRow): string {
  if (row.blockReason !== 0) return blockReasonLabel(row.blockReason);
  return row.primaryStage?.trim() || "--";
}
```

保留现有 `taskActions`、`actionLabel` 和 `actionType`，任务生命周期规则不得在模板里复制。

- [ ] **Step 5: 按九列顺序重写表格模板**

每一列继续受 `dynamicColumns[index].hide` 控制。关键结构如下，实际实现时为每列补齐对应内容：

```vue
<el-table v-loading="loading" :data="rows" row-key="id" border>
  <el-table-column
    v-if="!dynamicColumns[0].hide"
    label="任务信息"
    fixed="left"
    min-width="260"
  >
    <template #default="{ row }">
      <div class="primary-cell">
        <strong>{{ row.taskName || "--" }}</strong>
        <small>
          #{{ row.id }}｜{{ taskTypeLabel(row.taskType) }}｜{{
            groupSourceLabel(row.groupSource)
          }}
        </small>
      </div>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[1].hide"
    label="任务状态"
    min-width="190"
  >
    <template #default="{ row }">
      <div class="stack-cell">
        <el-tag size="small" effect="plain" :type="taskStatusTagType(row.status)">
          {{ taskStatusLabel(row.status) }}
        </el-tag>
        <small>{{ statusDetail(row) }}</small>
      </div>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[2].hide"
    label="群组处理进度"
    min-width="180"
  >
    <template #default="{ row }">
      <div v-if="groupProgress(row) != null" class="progress-cell">
        <span>
          {{ displayMetric(row.processedGroupCount) }}/{{
            displayMetric(row.targetGroupCount)
          }}
        </span>
        <el-progress
          :percentage="groupProgress(row) ?? 0"
          :show-text="false"
          :stroke-width="7"
        />
      </div>
      <span v-else>--</span>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[3].hide"
    label="拉人结果"
    min-width="210"
  >
    <template #default="{ row }">
      <div
        v-if="hasAnyMetric(row.joinedSuccessCount, row.plannedTargetCount, row.effectiveSuccessRate)"
        class="stack-cell"
      >
        <span>
          成功{{ displayMetric(row.joinedSuccessCount) }}/计划{{
            displayMetric(row.plannedTargetCount)
          }}
        </span>
        <small>有效成功率{{ displayRate(row.effectiveSuccessRate) }}</small>
      </div>
      <span v-else>--</span>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[4].hide"
    label="营销进度"
    min-width="165"
  >
    <template #default="{ row }">
      <span
        v-if="hasAnyMetric(row.marketingRunningGroupCount, row.marketingCompletedGroupCount)"
      >
        进行中{{ displayMetric(row.marketingRunningGroupCount) }}｜完成{{
          displayMetric(row.marketingCompletedGroupCount)
        }}
      </span>
      <span v-else>--</span>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[5].hide"
    label="消息发送"
    min-width="205"
  >
    <template #default="{ row }">
      <span
        v-if="hasAnyMetric(row.messageSuccessCount, row.messageFailedCount, row.messageUnknownCount)"
      >
        成功{{ displayMetric(row.messageSuccessCount) }}｜失败{{
          displayMetric(row.messageFailedCount)
        }}<template v-if="row.messageUnknownCount !== 0">
          ｜未知{{ displayMetric(row.messageUnknownCount) }}
        </template>
      </span>
      <span v-else>--</span>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[6].hide"
    label="异常情况"
    min-width="190"
  >
    <template #default="{ row }">
      <span
        v-if="!hasAnyMetric(row.abnormalGroupCount, row.replacementPendingGroupCount, row.bannedAccountCount)"
      >--</span>
      <span
        v-else-if="row.abnormalGroupCount === 0 && row.replacementPendingGroupCount === 0 && row.bannedAccountCount === 0"
      >无异常</span>
      <div v-else class="stack-cell danger-text">
        <span>
          异常群组{{ displayMetric(row.abnormalGroupCount) }}（待补位{{
            displayMetric(row.replacementPendingGroupCount)
          }}）
        </span>
        <small>封禁账号{{ displayMetric(row.bannedAccountCount) }}</small>
      </div>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[7].hide"
    label="剩余资源"
    min-width="220"
  >
    <template #default="{ row }">
      <span
        v-if="!hasAnyMetric(row.remainingTargetCount, row.availablePullerCount) && !row.resourceShortages?.length"
      >--</span>
      <div v-else class="resource-cell">
        <span>
          数据{{ displayMetric(row.remainingTargetCount) }}｜拉手{{
            displayMetric(row.availablePullerCount)
          }}
        </span>
        <div v-if="row.resourceShortages?.length" class="shortage-tags">
          <el-tag
            v-for="shortage in row.resourceShortages"
            :key="shortage.type"
            size="small"
            type="danger"
            effect="plain"
          >
            {{ resourceShortageLabel(shortage) }}
          </el-tag>
        </div>
      </div>
    </template>
  </el-table-column>

  <el-table-column
    v-if="!dynamicColumns[8].hide"
    label="时间/操作"
    fixed="right"
    min-width="250"
  >
    <template #default="{ row }">
      <div class="time-action-cell">
        <small>最近 {{ lastExecutedAt(row) }}</small>
        <div class="action-list">
          <el-button
            v-for="action in taskActions(row)"
            :key="action"
            link
            :type="actionType(action)"
            @click="emit('action', action, asTaskRow(row))"
          >
            {{ actionLabel(action) }}
          </el-button>
        </div>
      </div>
    </template>
  </el-table-column>
</el-table>
```

样式只服务合并单元格布局：统一 `display: flex`、垂直间距、次要文字颜色、异常色、进度条宽度和操作按钮换行；不自绘表格、标签、进度条或分页。

对三个容易误解的统计口径使用 `ElTooltip` 提供固定说明，不依赖后端额外字段：

```vue
<el-tooltip content="群组处理进度按已进入转移终态群组数 ÷ 目标群组总数计算">
  <span class="metric-help">群组处理进度</span>
</el-tooltip>
<el-tooltip content="有效成功率按本次新增成功入群人数 ÷ 有效目标数据计算">
  <span class="metric-help">有效成功率</span>
</el-tooltip>
<el-tooltip content="待补位群组属于异常群组子集，不与异常群组重复相加">
  <span class="metric-help">待补位</span>
</el-tooltip>
```

- [ ] **Step 6: 运行表格、常量和类型检查**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/group-pull-marketing/task-list-display.test.ts src/views/task/group-pull-marketing/constants.test.ts src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts
pnpm typecheck
```

Expected: 全部 PASS，`typecheck` 退出码为 0。

- [ ] **Step 7: 提交九列列表**

```bash
git add src/views/task/group-pull-marketing/constants.ts src/views/task/group-pull-marketing/constants.test.ts src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.vue src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts
git commit -m "feat: render v16 marketing task table"
```

### Task 3: 补齐五项查询条件

**Files:**

- Modify: `src/views/task/group-pull-marketing/index.vue`
- Create: `src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts`
- Modify: `src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.ts`
- Modify: `src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts`

- [ ] **Step 1: 写查询区失败测试**

创建 `GroupPullMarketingIndex.test.ts`：

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./index.vue", import.meta.url), "utf8");

describe("group pull marketing v16 search form", () => {
  it("renders every supported task-list filter", () => {
    for (const model of [
      "pageState.searchForm.id",
      "pageState.searchForm.keyword",
      "pageState.searchForm.status",
      "pageState.searchForm.blockReason",
      "pageState.searchForm.resourceStatus"
    ]) {
      assert.match(source, new RegExp(`v-model="${model}"`));
    }
    for (const label of [
      "任务ID",
      "任务名称",
      "任务状态",
      "阻塞原因",
      "资源状态"
    ]) {
      assert.match(source, new RegExp(`label="${label}"`));
    }
    assert.match(source, /blockReasonOptions/);
    assert.match(source, /resourceStatusOptions/);
    assert.match(source, /@click="pageState\.searchTasks"/);
    assert.match(source, /@click="pageState\.resetSearchForm"/);
  });
});
```

扩展 composable 的查询测试，在发起查询前设置：

```ts
page.searchForm.blockReason = 3;
page.searchForm.resourceStatus = 2;
```

并把请求断言改为 `blockReason: 3`、`resourceStatus: 2`。增加重置断言：调用 `resetSearchForm()` 后五项均为空、页码为 1，最后一次请求包含五个空筛选对应的 `undefined`。

再增加刷新失败保留已加载数据的测试：

```ts
it("keeps the last successful task rows when refresh fails", async () => {
  resetElementPlusMock();
  resetArmadaMock({
    list: [{ id: 8, taskName: "已加载任务" }],
    total: 1
  });
  const page = useGroupPullMarketingPage();
  await page.loadTasks();

  resetArmadaMockFailure(new Error("list unavailable"));
  await page.loadTasks();

  assert.equal(page.rows.value[0]?.taskName, "已加载任务");
  assert.equal(page.total.value, 1);
  assert.deepEqual(elementPlusCalls(), [
    { type: "error", text: "list unavailable" }
  ]);
});
```

同时从 Armada test double 导入 `resetArmadaMock` 和 `resetArmadaMockFailure`。

- [ ] **Step 2: 运行查询测试确认阻塞原因和资源状态控件缺失**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts
```

Expected: `GroupPullMarketingIndex.test.ts` FAIL，提示缺少 `blockReason` 的 `v-model`。

- [ ] **Step 3: 在查询区增加两个 Element Plus 下拉框**

从 `constants.ts` 同时导入 `blockReasonOptions` 和 `resourceStatusOptions`，在任务状态之后、按钮之前增加：

```vue
<el-form-item label="阻塞原因">
  <el-select
    v-model="pageState.searchForm.blockReason"
    clearable
    class="search-select"
    placeholder="全部原因"
  >
    <el-option
      v-for="option in blockReasonOptions"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</el-form-item>
<el-form-item label="资源状态">
  <el-select
    v-model="pageState.searchForm.resourceStatus"
    clearable
    class="search-select"
    placeholder="全部状态"
  >
    <el-option
      v-for="option in resourceStatusOptions"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</el-form-item>
```

不修改 `useGroupPullMarketingPage.ts` 的查询实现；该 composable 已经正确携带和重置这两个字段。

- [ ] **Step 4: 保留刷新失败前的成功列表**

将 `loadTasks()` 的 `catch` 中清空 `rows` 和 `total` 的两行删除，只保留可见错误提示：

```ts
} catch (error) {
  ElMessage.error(apiErrorMessage(error, "拉群营销任务加载失败"));
} finally {
  loading.value = false;
}
```

首次加载失败时初始值本来就是空数组和 0；刷新失败时则保留用户刚才看到的成功结果。

- [ ] **Step 5: 运行查询与完整相关测试**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/api/group-pull-marketing.test.ts src/views/task/group-pull-marketing/task-list-display.test.ts src/views/task/group-pull-marketing/constants.test.ts src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts
```

Expected: 全部 PASS，无失败、跳过或待办测试。

- [ ] **Step 6: 提交五项查询条件和错误保留行为**

```bash
git add src/views/task/group-pull-marketing/index.vue src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.ts src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts
git commit -m "feat: expose v16 marketing task filters"
```

### Task 4: 工程验证与变更记录

**Files:**

- Modify: `.harness/changes/group-pull-marketing-task-list-v16/summary.md`

- [ ] **Step 1: 运行最终相关测试**

Run:

```bash
node --test --experimental-strip-types --loader ./src/api/__tests__/node-test-loader.mjs src/api/group-pull-marketing.test.ts src/views/task/group-pull-marketing/task-list-display.test.ts src/views/task/group-pull-marketing/constants.test.ts src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts
```

Expected: 所有拉群营销一级列表相关测试 PASS。

- [ ] **Step 2: 运行类型和相关 lint/stylelint**

Run:

```bash
pnpm typecheck
pnpm exec eslint --max-warnings 0 src/api/group-pull-marketing.ts src/api/group-pull-marketing.test.ts src/views/task/group-pull-marketing/task-list-display.ts src/views/task/group-pull-marketing/task-list-display.test.ts src/views/task/group-pull-marketing/constants.ts src/views/task/group-pull-marketing/constants.test.ts src/views/task/group-pull-marketing/index.vue src/views/task/group-pull-marketing/GroupPullMarketingIndex.test.ts src/views/task/group-pull-marketing/composables/useGroupPullMarketingPage.test.ts src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.vue src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.test.ts
pnpm exec stylelint src/views/task/group-pull-marketing/index.vue src/views/task/group-pull-marketing/components/GroupPullMarketingTaskTable.vue
```

Expected: 三条命令退出码均为 0；不得通过 `--fix` 掩盖未审阅的机械改写。

- [ ] **Step 3: 运行生产构建**

Run:

```bash
pnpm build
```

Expected: Vite build 成功，退出码为 0。

- [ ] **Step 4: 更新变更摘要**

使用实际命令输出勾选 `.harness/changes/group-pull-marketing-task-list-v16/summary.md` 的完成项，并记录测试数量、`typecheck`、ESLint、Stylelint 和 build 结果。不得提前填写“通过”。

- [ ] **Step 5: 检查改动范围并提交验证记录**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~3..HEAD
```

确认未改新增抽屉、详情页、路由和无关文件；确认原有未跟踪文件 `docs/superpowers/plans/2026-07-27-disable-commitlint-hook.md` 未被加入提交。

```bash
git add .harness/changes/group-pull-marketing-task-list-v16/summary.md
git commit -m "docs: record v16 task list verification"
```

# Buyer Static Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the buyer-management three-level navigation and existing page layouts without requiring buyer backend APIs, while restoring every shared component and framework file changed by the earlier implementation.

**Architecture:** Add one business-owned static route module that the existing router glob imports automatically. Keep all buyer calls in `src/api/buyer-*.ts`, let unavailable calls fail into existing empty/error states, and move buyer-only error parsing into the buyer domain. Restore dynamic-menu, shared request, route-type, fake-server, and table-bar files to commit `332b27c` behavior without changing router guards, permission stores, or shared component APIs.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Vue Router, Element Plus, pure-admin `PureTableBar`, Node test runner, pnpm, Vite.

## Global Constraints

- Do not modify `src/router/index.ts`, `src/router/utils.ts`, `src/store/modules/permission.ts`, or any layout component.
- Restore `src/components/RePureTableBar/` to its exact pre-feature behavior; buyer pages must adapt to the stock API.
- Do not add buyer Fake Server routes or hard-coded business rows.
- Fixed buyer API URLs may fail; every page load/action must release loading state and preserve its layout.
- Use `apply_patch` for file edits; do not use `git restore`, `git checkout`, or destructive reset commands.
- Preserve all unrelated untracked files and stage only files named by each task.

## File Map

- Create `src/router/modules/buyer.ts`: static buyer navigation owned by the business domain.
- Create `src/router/buyer-route.test.ts`: exact menu-tree and leaf-route contract outside the production route glob.
- Create `src/views/buyer/shared/api-error-code.ts`: buyer-only structured error-code traversal.
- Create `src/views/buyer/shared/api-error-code.test.ts`: buyer error-code behavior.
- Create `src/views/buyer/BuyerStaticBoundary.test.ts`: regression guard proving shared/framework files are back to baseline and buyer mocks are absent.
- Modify buyer channel/statistics files only to consume buyer-owned helpers and the stock table-bar API.
- Restore shared files listed in Task 3 to their `332b27c` behavior.
- Delete buyer dynamic-menu adapters and buyer Fake Server files listed in Task 3.

---

### Task 1: Add the business-owned static menu tree

**Files:**

- Create: `src/router/buyer-route.test.ts`
- Create: `src/router/modules/buyer.ts`

**Interfaces:**

- Consumes: the existing `src/router/index.ts` glob for `src/router/modules/**/*.ts`.
- Produces: the default `RouteConfigsTable` route rooted at `/buyer`, with leaf names `BuyerTemplate`, `BuyerChannel`, and `BuyerChannelStats`.

- [ ] **Step 1: Write the failing static-route test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import buyerRoute from "./modules/buyer";

describe("buyer static navigation", () => {
  it("contains one root, two groups and the three preview pages", () => {
    assert.equal(buyerRoute.path, "/buyer");
    assert.equal(buyerRoute.meta?.title, "买号上量系统");
    assert.equal(buyerRoute.children?.length, 2);

    const [promotion, data] = buyerRoute.children ?? [];
    assert.deepEqual(
      {
        title: promotion.meta?.title,
        paths: promotion.children?.map(route => route.path),
        names: promotion.children?.map(route => route.name)
      },
      {
        title: "推广管理",
        paths: ["/buyer/promotion/template", "/buyer/promotion/channel"],
        names: ["BuyerTemplate", "BuyerChannel"]
      }
    );
    assert.deepEqual(
      {
        title: data.meta?.title,
        paths: data.children?.map(route => route.path),
        names: data.children?.map(route => route.name)
      },
      {
        title: "数据中心",
        paths: ["/buyer/data/channel-stats"],
        names: ["BuyerChannelStats"]
      }
    );
    for (const leaf of [
      ...(promotion.children ?? []),
      ...(data.children ?? [])
    ]) {
      assert.equal(typeof leaf.component, "function");
    }
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/router/buyer-route.test.ts
```

Expected: FAIL with `Cannot find module './buyer'`.

- [ ] **Step 3: Implement the static route module**

```ts
export default {
  path: "/buyer",
  redirect: "/buyer/promotion/template",
  meta: {
    title: "买号上量系统",
    icon: "ri/rocket-2-line",
    rank: 6
  },
  children: [
    {
      path: "/buyer/promotion",
      redirect: "/buyer/promotion/template",
      meta: { title: "推广管理", icon: "ri/megaphone-line" },
      children: [
        {
          path: "/buyer/promotion/template",
          name: "BuyerTemplate",
          component: () => import("@/views/buyer/template/index.vue"),
          meta: {
            title: "模板管理（二期）",
            auths: [
              "tenant:buyer-template:view",
              "tenant:buyer-template:visibility",
              "tenant:buyer-template:remark"
            ]
          }
        },
        {
          path: "/buyer/promotion/channel",
          name: "BuyerChannel",
          component: () => import("@/views/buyer/channel/index.vue"),
          meta: {
            title: "渠道管理（二期）",
            auths: [
              "tenant:buyer-channel:view",
              "tenant:buyer-channel:create",
              "tenant:buyer-channel:edit",
              "tenant:buyer-channel:detect",
              "tenant:buyer-channel:delete"
            ]
          }
        }
      ]
    },
    {
      path: "/buyer/data",
      redirect: "/buyer/data/channel-stats",
      meta: { title: "数据中心", icon: "ri/bar-chart-2-line" },
      children: [
        {
          path: "/buyer/data/channel-stats",
          name: "BuyerChannelStats",
          component: () => import("@/views/buyer/channel-stats/index.vue"),
          meta: {
            title: "渠道统计（二期）",
            auths: [
              "tenant:buyer-channel-stats:view",
              "tenant:buyer-channel-stats:edit",
              "tenant:buyer-channel-stats:export"
            ]
          }
        }
      ]
    }
  ]
} satisfies RouteConfigsTable;
```

- [ ] **Step 4: Run the test and verify GREEN**

Run the Step 2 command. Expected: one suite and one test pass.

- [ ] **Step 5: Commit the static route**

```powershell
git add -- src/router/modules/buyer.ts src/router/buyer-route.test.ts
git commit -m "feat(buyer): add static preview navigation"
```

---

### Task 2: Isolate buyer behavior from shared utilities and the table bar

**Files:**

- Create: `src/views/buyer/shared/api-error-code.test.ts`
- Create: `src/views/buyer/shared/api-error-code.ts`
- Modify: `src/views/buyer/channel/domain/channel-form.ts`
- Modify: `src/views/buyer/channel-stats/composables/useDailyStatsPanels.ts`
- Modify: `src/views/buyer/channel-stats/index.vue`
- Modify: `src/views/buyer/channel-stats/ChannelStatsPageContract.test.ts`

**Interfaces:**

- Produces: `hasBuyerApiErrorCode(error: unknown, expected: string): boolean`.
- Consumes: stock `PureTableBar` props `title`, `columns`, and `@refresh`; no custom table-bar props.

- [ ] **Step 1: Write the failing buyer-helper test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasBuyerApiErrorCode } from "./api-error-code";

describe("buyer API error codes", () => {
  it("finds a code in Axios and nested business error shapes", () => {
    const errors = [
      { response: { data: { errorCode: "VERSION_CONFLICT" } } },
      { response: { data: { code: "VERSION_CONFLICT" } } },
      { data: { error: { message: "VERSION_CONFLICT" } } }
    ];
    for (const error of errors) {
      assert.equal(hasBuyerApiErrorCode(error, "VERSION_CONFLICT"), true);
    }
    assert.equal(
      hasBuyerApiErrorCode(new Error("network"), "VERSION_CONFLICT"),
      false
    );
  });
});
```

Also replace the last two table-bar-specific tests in `ChannelStatsPageContract.test.ts` with:

```ts
it("passes dynamic columns through the stock table bar API", () => {
  const page = source("./index.vue");
  const table = source("./components/ChannelStatsTable.vue");
  assert.match(page, /#default="\{ dynamicColumns \}"/);
  assert.match(page, /:columns="dynamicColumns"/);
  assert.match(table, /columns:.*Array/s);
  assert.match(table, /v-if="isColumnVisible\(/);
  assert.doesNotMatch(page, /column-title|column-draggable|hideable/);
});
```

- [ ] **Step 2: Run both tests and verify RED**

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/views/buyer/shared/api-error-code.test.ts src/views/buyer/channel-stats/ChannelStatsPageContract.test.ts
```

Expected: the helper import is missing and the stock table-bar assertion detects `column-title`, `column-draggable`, or `hideable`.

- [ ] **Step 3: Implement the buyer-only helper**

```ts
function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

export function hasBuyerApiErrorCode(
  error: unknown,
  expected: string
): boolean {
  const pending: unknown[] = [error];
  const visited = new Set<object>();
  while (pending.length > 0) {
    const record = asRecord(pending.shift());
    if (!record || visited.has(record)) continue;
    visited.add(record);
    if (
      [record.errorCode, record.code, record.message].some(
        value => value === expected
      )
    ) {
      return true;
    }
    pending.push(record.response, record.data, record.error);
  }
  return false;
}
```

Change both buyer imports to:

```ts
import { hasBuyerApiErrorCode } from "@/views/buyer/shared/api-error-code";
```

Change calls from `hasApiErrorCode(...)` to `hasBuyerApiErrorCode(...)`.

In `channel-stats/index.vue`, make the first two columns ordinary stock columns:

```ts
const tableColumns = [
  { label: "渠道/国家", prop: "channelName", hide: false },
  { label: "绑定模板", prop: "templateName", hide: false }
  // keep the existing metric columns unchanged
];
```

Use only stock `PureTableBar` props:

```vue
<PureTableBar
  title="渠道统计"
  :columns="tableColumns"
  @refresh="loadRows"
></PureTableBar>
```

- [ ] **Step 4: Run both tests and verify GREEN**

Run the Step 2 command. Expected: all listed tests pass.

- [ ] **Step 5: Run dependent buyer domain tests**

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/views/buyer/channel/domain/channel-form.test.ts src/views/buyer/channel-stats/composables/useDailyStatsPanels.test.ts
```

Expected: all domain tests pass with the buyer-owned helper.

- [ ] **Step 6: Commit the isolation change**

```powershell
git add -- src/views/buyer/shared src/views/buyer/channel/domain/channel-form.ts src/views/buyer/channel-stats/composables/useDailyStatsPanels.ts src/views/buyer/channel-stats/index.vue src/views/buyer/channel-stats/ChannelStatsPageContract.test.ts
git commit -m "refactor(buyer): isolate preview from shared UI"
```

---

### Task 3: Restore the original framework boundary and remove buyer mocks

**Files:**

- Create: `src/views/buyer/BuyerStaticBoundary.test.ts`
- Modify: `build/plugins.ts`
- Modify: `mock/asyncRoutes.ts`
- Modify: `src/api/armada.ts`
- Modify: `src/api/routes.ts`
- Modify: `src/api/routes.test.ts`
- Modify: `src/components/RePureTableBar/src/bar.tsx`
- Modify: `src/utils/api-error.ts`
- Modify: `types/router.d.ts`
- Modify: `src/views/buyer/channel-stats/ChannelStatsPageContract.test.ts`
- Delete: `mock/asyncRoutes.test.ts`
- Delete: `mock/buyer.ts`
- Delete: `mock/buyer-runtime.ts`
- Delete: `mock/buyer-runtime.test.ts`
- Delete: `src/api/armada.test.ts`
- Delete: `src/api/menu-mapping.ts`
- Delete: `src/api/menu-mapping.test.ts`
- Delete: `src/components/RePureTableBar/src/column-visibility.ts`
- Delete: `src/utils/api-error.test.ts`

**Interfaces:**

- Restores: `getAsyncRoutes(): Promise<{ success: boolean; data: any[] }>` through `/get-async-routes`.
- Preserves: all buyer page APIs in `src/api/buyer-*.ts`; no buyer fake routes.

- [ ] **Step 1: Write the failing framework-boundary regression test**

```ts
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const root = new URL("../../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("buyer static preview boundary", () => {
  it("keeps the original dynamic menu contract", () => {
    const routes = read("src/api/routes.ts");
    const fakeRoutes = read("mock/asyncRoutes.ts");
    assert.match(routes, /\/get-async-routes/);
    assert.doesNotMatch(routes, /\/api\/tenant\/me\/menus|menu-mapping/);
    assert.match(fakeRoutes, /url:\s*["']\/get-async-routes["']/);
    assert.doesNotMatch(fakeRoutes, /buyerRouter|toWheelMenuNode/);
  });

  it("uses the original shared table and request contracts", () => {
    const bar = read("src/components/RePureTableBar/src/bar.tsx");
    assert.doesNotMatch(bar, /columnTitle|columnDraggable|column-visibility/);
    assert.doesNotMatch(read("src/api/armada.ts"), /ArmadaBusinessError/);
    assert.doesNotMatch(read("src/utils/api-error.ts"), /hasApiErrorCode/);
    assert.doesNotMatch(read("types/router.d.ts"), /module_key|perm_key/);
  });

  it("does not ship buyer Fake Server files", () => {
    for (const path of [
      "mock/buyer.ts",
      "mock/buyer-runtime.ts",
      "mock/buyer-runtime.test.ts"
    ]) {
      assert.equal(existsSync(new URL(path, root)), false, path);
    }
  });
});
```

Replace `src/api/routes.test.ts` with:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import { getAsyncRoutes } from "./routes";

describe("original async route API", () => {
  it("keeps the framework endpoint and response shape", async () => {
    const response = { success: true, data: [] };
    resetHttpMock(response);
    assert.deepEqual(await getAsyncRoutes(), response);
    assert.deepEqual(httpCalls(), [
      { method: "get", url: "/get-async-routes", opts: undefined }
    ]);
  });
});
```

- [ ] **Step 2: Run the boundary tests and verify RED**

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/views/buyer/BuyerStaticBoundary.test.ts src/api/routes.test.ts
```

Expected: failures mention the tenant menu endpoint, table-bar extensions, shared error extensions, buyer Fake Server files, and the wrong route request.

- [ ] **Step 3: Restore small shared files to their exact baseline content**

Set `src/api/routes.ts` to:

```ts
import { http } from "@/utils/http";

type Result = {
  success: boolean;
  data: Array<any>;
};

export const getAsyncRoutes = () => {
  return http.request<Result>("get", "/get-async-routes");
};
```

Set `src/api/armada.ts` to:

```ts
import { http } from "@/utils/http";
import type { AxiosRequestConfig } from "axios";
import type {
  PureHttpRequestConfig,
  RequestMethods
} from "@/utils/http/types.d";

/** armada 统一响应信封。code=0 成功,非 0 业务错误(HTTP 仍 200)。 */
export interface ArmadaResp<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 调 armada 接口并按信封拆包:code===0 返回 data,否则抛 Error(message)。
 * 业务页/登录统一用它,避免每处手写 code 判定。
 */
export async function armadaRequest<T>(
  method: RequestMethods,
  url: string,
  opts?: AxiosRequestConfig,
  config?: PureHttpRequestConfig
): Promise<T> {
  const resp = await http.request<ArmadaResp<T>>(method, url, opts, config);
  if (!resp || resp.code !== 0) {
    throw new Error(resp?.message ?? "请求失败");
  }
  return resp.data;
}
```

Set `src/utils/api-error.ts` to:

```ts
interface ApiErrorData {
  message?: unknown;
}

interface ApiErrorLike {
  message?: unknown;
  response?: { data?: ApiErrorData };
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as ApiErrorLike | undefined)?.response?.data;
  const message = data?.message ?? (error as ApiErrorLike)?.message;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
}
```

In `build/plugins.ts`, restore the existing Fake Server setting exactly:

```ts
enableProd: true;
```

In `types/router.d.ts`, remove only the four `module_key`/`perm_key` declarations added to `CustomizeRouteMeta` and `RouteConfigsTable.meta`.

- [ ] **Step 4: Restore the stock table bar with an inverse `apply_patch`**

Use `git diff 332b27c -- src/components/RePureTableBar/src/bar.tsx` only as read-only evidence, then apply an inverse patch so the target has:

```ts
function handleCheckAllChange(val: boolean) {
  checkedColumns.value = val ? checkColumnList : [];
  isIndeterminate.value = false;
  dynamicColumns.value.map(column =>
    val ? (column.hide = false) : (column.hide = true)
  );
}

function handleCheckedColumnsChange(value: string[]) {
  checkedColumns.value = value;
  const checkedCount = value.length;
  checkAll.value = checkedCount === checkColumnList.length;
  isIndeterminate.value =
    checkedCount > 0 && checkedCount < checkColumnList.length;
}

function handleCheckColumnListChange(val: boolean, label: string) {
  dynamicColumns.value.filter(item => item.label === label)[0].hide = !val;
}
```

Also remove the `column-visibility` import, `columnTitle`/`columnDraggable` props, the drag guard, disabled checkbox logic, and conditional drag rendering. Restore both visible labels to the literal `"列设置"` and always render the stock `DragIcon` block. Delete `column-visibility.ts`.

- [ ] **Step 5: Restore the original async-route mock and remove buyer mocks**

Remove `buyerRouter`, `MockRoute`, `fallbackMenuKey`, and `toWheelMenuNode` from `mock/asyncRoutes.ts`. Its final export must be:

```ts
export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => ({
      success: true,
      data: [
        accountRouter,
        taskRouter,
        materialRouter,
        operationRouter,
        permissionRouter
      ]
    })
  }
]);
```

Delete all files listed under Task 3 `Delete`. Do not delete or edit any unrelated existing mock.

Update the daily-row test in `ChannelStatsPageContract.test.ts` so it checks only the business layout and no longer imports buyer mocks or asserts a changed framework flag:

```ts
it("uses editable daily rows without buyer fake data", () => {
  const daily = source("./components/DailyStatsRows.vue");
  for (const field of [
    "spend",
    "impressions",
    "clicks",
    "serviceRate",
    "otherFee"
  ]) {
    assert.ok(daily.includes(field), field);
  }
  assert.equal(
    existsSync(new URL("../../../../mock/buyer.ts", import.meta.url)),
    false
  );
});
```

- [ ] **Step 6: Run boundary and dependent tests and verify GREEN**

Run the Step 2 command, then:

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/views/buyer/channel-stats/ChannelStatsPageContract.test.ts src/views/buyer/channel/domain/channel-form.test.ts src/views/buyer/channel-stats/composables/useDailyStatsPanels.test.ts
```

Expected: every listed test passes; no test imports `mock/buyer*`, `menu-mapping`, `ArmadaBusinessError`, or the deleted table helper.

- [ ] **Step 7: Prove the public files equal their pre-feature versions**

```powershell
git diff --exit-code 332b27c -- build/plugins.ts mock/asyncRoutes.ts src/api/armada.ts src/api/routes.ts src/components/RePureTableBar/src/bar.tsx src/utils/api-error.ts types/router.d.ts
git diff --exit-code 332b27c -- src/router/index.ts src/router/utils.ts src/store/modules/permission.ts src/layout
```

Expected: both commands produce no diff and exit `0`.

- [ ] **Step 8: Commit the framework restoration**

Stage only Task 3 files, including deletions and the boundary test, then commit:

```powershell
git commit -m "fix(buyer): restore static preview framework boundary"
```

---

### Task 4: Run the complete preview verification and update the change ledger

**Files:**

- Modify: `.harness/changes/buyer-management-phase2/summary.md`

**Interfaces:**

- Verifies: static navigation, fixed buyer API contracts, empty/error page states, and untouched public framework files.

- [ ] **Step 1: Run the full buyer test set**

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types src/router/buyer-route.test.ts src/views/buyer/BuyerStaticBoundary.test.ts src/views/buyer/shared/api-error-code.test.ts src/api/routes.test.ts src/api/buyer-template.test.ts src/api/buyer-channel.test.ts src/api/buyer-channel-stats.test.ts src/views/buyer/template/composables/useBuyerTemplatePage.test.ts src/views/buyer/template/BuyerTemplateIndex.test.ts src/views/buyer/channel/domain/channel-domain.test.ts src/views/buyer/channel/domain/channel-form.test.ts src/views/buyer/channel/domain/channel-detail-loader.test.ts src/views/buyer/channel/ChannelPageContract.test.ts src/views/buyer/channel-stats/domain/stats-format.test.ts src/views/buyer/channel-stats/composables/useDailyStatsPanels.test.ts src/views/buyer/channel-stats/ChannelStatsPageContract.test.ts
```

Expected: all suites pass, with zero failures, cancellations, skips, and unhandled rejections.

- [ ] **Step 2: Run static checks**

```powershell
pnpm typecheck
pnpm exec eslint src/router/modules/buyer.ts src/router/buyer-route.test.ts src/views/buyer src/api/buyer-template.ts src/api/buyer-channel.ts src/api/buyer-channel-stats.ts src/api/routes.ts --max-warnings 0
pnpm build
git diff --check
```

Expected: typecheck, ESLint, and build exit `0`; `git diff --check` produces no output. Stale Browserslist data warnings are non-blocking if the build exits `0`.

- [ ] **Step 3: Re-run the framework boundary proof**

```powershell
git diff --exit-code 332b27c -- build/plugins.ts mock/asyncRoutes.ts src/api/armada.ts src/api/routes.ts src/components/RePureTableBar/src/bar.tsx src/utils/api-error.ts types/router.d.ts src/router/index.ts src/router/utils.ts src/store/modules/permission.ts src/layout
```

Expected: no output and exit `0`.

- [ ] **Step 4: Update the change ledger**

Append a dated entry stating:

```markdown
## 2026-07-18 静态预览修复

- 买号菜单改为业务静态路由模块，不依赖后端菜单接口。
- 删除买号 Fake Server 数据；业务接口失败时展示空/错误状态并结束 loading。
- 恢复动态菜单、Armada、路由类型和 RePureTableBar 到功能开发前版本。
- `src/router/index.ts`、`src/router/utils.ts`、权限 Store 和 layout 未修改。
```

- [ ] **Step 5: Commit verification documentation**

```powershell
git add -- .harness/changes/buyer-management-phase2/summary.md
git commit -m "docs(buyer): record static preview verification"
```

- [ ] **Step 6: Inspect final repository state**

```powershell
git status --short
git log -5 --oneline --decorate
```

Expected: only the user's pre-existing unrelated untracked files remain; no buyer implementation file is unstaged.

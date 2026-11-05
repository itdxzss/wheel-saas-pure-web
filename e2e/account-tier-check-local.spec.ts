import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { TierCheckTask } from "../src/api/account-tier-check";

// 全部账号、会话和结果均为本地虚构夹具；禁止访问非本机地址和未声明的 API。
const base = "/api/accounts/tier-check-tasks";
const captured = ".harness/changes/account-tier-check/screenshots";
const now = Date.UTC(2026, 10, 5, 8);
const task: TierCheckTask = {
  id: 12,
  name: "本地商业号 · 复查",
  mode: 1,
  sourceTaskId: 9,
  sourceTaskName: "本地商业号 · 首查",
  totalCount: 4,
  status: 4,
  createdAt: now,
  finishedAt: now + 60000,
  tierCounts: { TIER_1: 1, TIER_0: 1, UNTIERED: 1 },
  stats: {
    total: 4,
    success: 3,
    failed: 1,
    unqueryable: 0,
    pending: 0,
    first: 0,
    same: 1,
    up: 1,
    down: 0,
    unknown: 1,
    lost: 1
  }
};
const items = [
  {
    id: 1,
    accountId: 101,
    phone: "0000***01",
    serverUserType: "BUSINESS",
    trustTier: "TIER_1",
    prevTrustTier: "TIER_0",
    tierChange: 2,
    status: 3
  },
  {
    id: 2,
    accountId: 102,
    phone: "0000***02",
    serverUserType: "BUSINESS",
    trustTier: "TIER_0",
    prevTrustTier: "UNTIERED",
    tierChange: 4,
    status: 3
  },
  {
    id: 3,
    accountId: 103,
    phone: "0000***03",
    serverUserType: "PERSONAL",
    trustTier: "UNTIERED",
    prevTrustTier: "UNTIERED",
    tierChange: 1,
    status: 3
  },
  {
    id: 4,
    accountId: 104,
    phone: "0000***04",
    prevTrustTier: "TIER_1",
    tierChange: 5,
    status: 4,
    reasonCode: "EMPTY_RESPONSE"
  }
];

async function setup(page: Page, edit = true, path = "/account/tier-check") {
  const permissions = [
    "tenant:account:view",
    ...(edit ? ["tenant:account:edit"] : [])
  ];
  const state = {
    previews: [] as Record<string, unknown>[],
    creates: [] as Record<string, unknown>[],
    actions: [] as string[],
    itemQueries: [] as URLSearchParams[],
    accountQueries: [] as URLSearchParams[],
    detailReads: 0,
    current: structuredClone(task)
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(permissions => {
    const session = {
      accessToken: "local-tier-fixture",
      expires: Date.now() + 3600000,
      refreshToken: "",
      roles: ["operator"],
      permissions,
      username: "local-test"
    };
    localStorage.setItem("user-info", JSON.stringify(session));
    document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
    document.cookie = "multiple-tabs=true; path=/";
  }, permissions);
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") return route.abort();
    // 保留 Vite /src/api/*.ts 等静态资源，只有真正 /api/ 路径才进入夹具。
    const path = url.pathname;
    if (!path.startsWith("/api/")) return route.continue();
    let data: unknown;
    if (path === "/api/tenant/me/menus") {
      data = [
        {
          path: "/account",
          name: "Account",
          meta: { title: "账号管理" },
          children: [
            ["index", "AccountIndex", "账号列表"],
            ["group", "AccountGroup", "账号分组"],
            ["tier-check", "AccountTierCheck", "档位检测"],
            ["import", "AccountImport", "账号导入"]
          ].map(([part, name, title]) => ({
            path: `/account/${part}`,
            name,
            component: `account/${part}/index`,
            meta: {
              title,
              auths: permissions,
              module_key: "account",
              perm_key: permissions[0]
            }
          }))
        }
      ];
    } else if (path === "/api/account-groups") {
      data = {
        list: [
          { id: 7, name: "本地商业号", totalAccounts: 4, onlineAccounts: 3 }
        ],
        total: 1
      };
    } else if (path === "/api/accounts") {
      state.accountQueries.push(url.searchParams);
      data = {
        list: [
          {
            id: 101,
            wsPhone: "0000***01",
            loginState: 1,
            accountState: 1,
            accountType: 2,
            protocolId: "WEB",
            accountGroupId: 7,
            groupName: "本地商业号",
            createdAt: now
          }
        ],
        total: 1
      };
    } else if (path === "/api/accounts/stats") {
      data = {
        total: 1,
        online: 1,
        offline: 0,
        pendingOnline: 0,
        banned: 0,
        unbound: 0,
        muted: 0,
        exported: 0,
        restricted: 0,
        restrictedTotal: 0,
        risk: 0,
        assigned: 0,
        unassigned: 1
      };
    } else if (path === "/api/account/wb-companion/summaries") {
      data = [];
    } else if (path === `${base}/preview`) {
      state.previews.push(request.postDataJSON());
      data = {
        eligible: 3,
        excluded: 1,
        excludedReasons: [{ reason: "账号离线", count: 1 }],
        previewToken: "local-preview"
      };
    } else if (path === base && request.method() === "POST") {
      state.creates.push(request.postDataJSON());
      data = { ...task, id: 13, status: 1 };
    } else if (path === base) {
      data = { list: [state.current], total: 1, page: 1, pageSize: 20 };
    } else if (/\/tier-check-tasks\/\d+\/items$/.test(path)) {
      state.itemQueries.push(url.searchParams);
      const filter = url.searchParams.get("filter");
      const list =
        filter === "lost"
          ? items.slice(3)
          : filter === "changed"
            ? items.filter(item => [2, 3, 4].includes(item.tierChange))
            : items;
      data = {
        list,
        total: filter ? list.length : 24,
        page: Number(url.searchParams.get("page")),
        pageSize: 20
      };
    } else if (
      /\/tier-check-tasks\/\d+\/(stop|retry-failed|recheck)$/.test(path)
    ) {
      state.actions.push(path.split("/").at(-1)!);
      if (path.endsWith("/stop")) state.current.status = 2;
      data = path.endsWith("/retry-failed") ? 1 : { ...task, id: 13 };
    } else if (/\/tier-check-tasks\/\d+$/.test(path)) {
      state.detailReads++;
      data = state.current;
    } else if (/\/accounts\/\d+\/tier-history$/.test(path)) {
      data = {
        accountId: 101,
        phone: "0000***01",
        serverUserType: "BUSINESS",
        phoneCountryCode: "ZZ",
        joinDateMs: now - 86400000,
        entries: [
          {
            itemId: 1,
            taskId: 12,
            taskName: task.name,
            mode: 1,
            checkedAt: now,
            trustTier: "TIER_1",
            prevTrustTier: "TIER_0",
            tierChange: 2,
            status: 3
          },
          {
            itemId: 5,
            taskId: 9,
            taskName: "本地商业号 · 首查",
            mode: 2,
            checkedAt: now - 86400000,
            trustTier: "TIER_0",
            tierChange: 0,
            status: 3
          }
        ]
      };
    } else return route.abort();
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto(`/#${path}`);
  return state;
}

async function screenshot(page: Page, name: string) {
  await mkdir(captured, { recursive: true });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .map(animation => animation.finished.catch(() => undefined))
    );
  });
  await page.screenshot({
    path: `${captured}/${name}.png`,
    animations: "disabled"
  });
}

async function createDrawer(page: Page) {
  await page.getByRole("button", { name: "新建检测", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "新建检测" });
  await drawer.getByText("选择要检测的账号分组", { exact: true }).click();
  await page.getByRole("option", { name: /本地商业号/ }).click();
  await drawer.locator(".el-drawer__title").click();
  return drawer;
}

test("self preview is invalidated by edits and creation carries the preview and idempotency keys", async ({
  page
}) => {
  const state = await setup(page);
  await expect(page.getByText(task.name, { exact: true })).toBeVisible();
  await screenshot(page, "1-批次列表");
  const drawer = await createDrawer(page);
  await expect(drawer.getByRole("button", { name: "开始检测" })).toHaveCount(0);
  await drawer.getByRole("button", { name: "预览参与范围" }).click();
  await expect(drawer.getByText("可检测 3 个，排除 1 个。")).toBeVisible();
  await screenshot(page, "2-新建检测-自查");
  await drawer
    .getByPlaceholder("例如：巴基斯坦商业号 · 11-19")
    .fill("本地自查");
  await expect(drawer.getByRole("button", { name: "开始检测" })).toHaveCount(0);
  await drawer.getByRole("button", { name: "预览参与范围" }).click();
  await drawer.getByRole("button", { name: "开始检测" }).click();
  await expect(drawer).not.toBeVisible();
  expect(state.creates).toHaveLength(1);
  expect(state.creates[0]).toMatchObject({
    name: "本地自查",
    accountGroupIds: [7],
    mode: 1,
    probeAccountIds: [],
    previewToken: "local-preview",
    requestId: state.previews[1].requestId
  });
  expect(state.previews[0].requestId).not.toBe(state.previews[1].requestId);
});

test("probe mode requires an online Web probe and invalidates the earlier self preview", async ({
  page
}) => {
  const state = await setup(page);
  const drawer = await createDrawer(page);
  await drawer.getByRole("button", { name: "预览参与范围" }).click();
  await drawer.getByText("探针号代查", { exact: true }).click();
  await expect(drawer.getByRole("button", { name: "开始检测" })).toHaveCount(0);
  await expect(
    drawer.getByRole("button", { name: "预览参与范围" })
  ).toBeDisabled();
  await screenshot(page, "3-新建检测-探针代查");
  await drawer.getByRole("combobox").last().click();
  await page.getByRole("option", { name: "0000***01", exact: true }).click();
  await drawer.locator(".el-drawer__title").click();
  await expect(
    page.getByRole("option", { name: "0000***01", exact: true })
  ).not.toBeVisible();
  await drawer.getByRole("button", { name: "预览参与范围" }).click();
  await expect.poll(() => state.previews.length).toBe(2);
  expect(state.previews[1]).toMatchObject({ mode: 2, probeAccountIds: [101] });
  expect(
    state.accountQueries.some(
      query =>
        query.get("loginState") === "1" && query.get("protocolId") === "WEB"
    )
  ).toBe(true);
  expect(state.creates).toHaveLength(0);
});

test("detail filters reset pagination, empty results keep the failure reason, and history is readable", async ({
  page
}) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "详情", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "档位检测详情",
    exact: true
  });
  await expect(
    drawer.getByText("各账号与最近一次成功检测相比：", { exact: false })
  ).toBeVisible();
  await screenshot(page, "4-批次详情");
  await drawer.getByRole("button", { name: "时间线" }).first().click();
  const timeline = page.getByRole("dialog", { name: "档位时间线 · 0000***01" });
  await expect(timeline.getByText("上次 TIER_0")).toBeVisible();
  await screenshot(page, "5-账号时间线");
  await timeline.locator(".el-drawer__close-btn").click();
  await drawer.locator(".el-pager li").filter({ hasText: /^2$/ }).click();
  await expect.poll(() => state.itemQueries.at(-1)?.get("page")).toBe("2");
  await drawer.getByText("只看有变化", { exact: true }).click();
  await expect
    .poll(() => state.itemQueries.at(-1)?.get("filter"))
    .toBe("changed");
  expect(state.itemQueries.at(-1)?.get("page")).toBe("1");
  await drawer.getByText("未查到", { exact: true }).click();
  await expect(
    drawer.getByText("返回为空，疑似被限流", { exact: true })
  ).toBeVisible();
  await expect(drawer.getByText("本次未查到", { exact: true })).toBeVisible();
  expect(state.actions).toEqual([]);
});

test("running detail refreshes only reads and supports explicit stop", async ({
  page
}) => {
  const state = await setup(page);
  state.current.status = 1;
  await page.getByRole("button", { name: "详情", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "档位检测详情",
    exact: true
  });
  await expect
    .poll(() => state.detailReads, { timeout: 8000 })
    .toBeGreaterThan(1);
  expect(state.actions).toEqual([]);
  await drawer.getByRole("button", { name: "停止", exact: true }).click();
  await expect(
    drawer.getByRole("button", { name: "停止", exact: true })
  ).toBeDisabled();
  expect(state.actions).toEqual(["stop"]);
});

test("view-only permissions hide all tier mutations", async ({ page }) => {
  const state = await setup(page, false);
  await expect(
    page.getByRole("button", { name: "详情", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "新建检测", exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "复查", exact: true })
  ).toHaveCount(0);
  await page.getByRole("button", { name: "详情", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "档位检测详情",
    exact: true
  });
  await expect(drawer.getByText("本次分布：", { exact: false })).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: /停止|重试失败项|复查此批/ })
  ).toHaveCount(0);
  expect(state.actions).toEqual([]);
  expect(state.creates).toEqual([]);
  await drawer.locator(".el-drawer__close-btn").click();
  await page.goto("/#/account/index");
  await page.getByRole("button", { name: /批量操作/ }).click();
  await expect(
    page.getByRole("menuitem", { name: "检测档位", exact: true })
  ).toHaveCount(0);
});

test("retry is explicit and recheck requires the existing confirmation", async ({
  page
}) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "详情", exact: true }).click();
  const drawer = page.getByRole("dialog", {
    name: "档位检测详情",
    exact: true
  });
  await drawer.getByRole("button", { name: "重试失败项" }).click();
  await expect.poll(() => state.actions.length).toBe(1);
  expect(state.actions).toEqual(["retry-failed"]);
  await drawer.getByRole("button", { name: "复查此批" }).click();
  const confirmation = page.getByRole("dialog", {
    name: "复查此批",
    exact: true
  });
  await confirmation.getByRole("button", { name: "取消", exact: true }).click();
  expect(state.actions).toEqual(["retry-failed"]);
  await drawer.getByRole("button", { name: "复查此批" }).click();
  await confirmation
    .getByRole("button", { name: "开始复查", exact: true })
    .click();
  await expect.poll(() => state.actions.length).toBe(2);
  expect(state.actions).toEqual(["retry-failed", "recheck"]);
});

test("account-list entry carries the selected IDs into the existing drawer", async ({
  page
}) => {
  const state = await setup(page, true, "/account/index");
  await expect(page.getByText("0000***01", { exact: true })).toBeVisible();
  await page.locator(".el-table__body-wrapper .el-checkbox").first().click();
  await page.getByRole("button", { name: /批量操作/ }).click();
  await page.getByRole("menuitem", { name: "检测档位", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "新建检测" });
  await expect(drawer.getByText("已选择 1 个账号")).toBeVisible();
  await expect(drawer.getByPlaceholder("选择要检测的账号分组")).toHaveCount(0);
  await drawer.getByRole("button", { name: "预览参与范围" }).click();
  await drawer.getByRole("button", { name: "开始检测" }).click();
  await expect(drawer).not.toBeVisible();
  expect(state.creates[0]).toMatchObject({
    accountIds: [101],
    accountGroupIds: []
  });
});

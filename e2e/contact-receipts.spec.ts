import { test, expect } from "@playwright/test";

test("receipt drilldown, paging, sorting, late ACK and polling cleanup", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const metrics = {
    scopeId: 42,
    plannedNum: 100,
    attemptedNum: 95,
    confirmedNum: 80,
    deliveredNum: 60,
    readNum: 25,
    failedNum: 10,
    unknownNum: 5,
    skippedNum: 5,
    processedNum: 100,
    pendingNum: 0,
    sendingNum: 0,
    inconsistentNum: 0
  };
  const accounts = {
    taskId: 42,
    selectedAccountNum: 2,
    preparingAccountNum: 0,
    readyAccountNum: 2,
    failedAccountNum: 1
  };
  let statsReads = 0;
  const queries: URL[] = [];
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost")
      return route.abort();
    if (!url.pathname.startsWith("/api/")) return route.continue();
    queries.push(url);
    let data: unknown = [];
    if (url.pathname.endsWith("/stats")) {
      statsReads++;
      data = {
        taskId: 42,
        runStatus: 2,
        metrics,
        accounts,
        reasons: [
          {
            sendStatus: "UNKNOWN",
            errorCode: "ACK_TIMEOUT",
            count: metrics.unknownNum
          }
        ]
      };
    } else if (url.pathname.endsWith("/recipients")) {
      const status = url.searchParams.get("sendStatus") ?? "SUCCESS";
      const current = Number(url.searchParams.get("page") ?? 1);
      const total = status === "UNKNOWN" ? metrics.unknownNum : 25;
      const row = {
        id: current === 2 ? 21 : 1,
        contactJid: "synthetic-contact@lid",
        taskAccountId: 10,
        accountId: 110,
        sendStatus: status,
        deliveredAt: status === "UNKNOWN" ? null : 1000,
        readAt: status === "UNKNOWN" ? null : 2000,
        firstSentAt: null,
        errorCode: status === "UNKNOWN" ? "ACK_TIMEOUT" : null
      };
      data = { list: [row], total, page: current, pageSize: 20 };
    } else if (url.pathname.endsWith("/data")) {
      data = {
        list: [{ taskAccountId: 10, accountId: 110, state: "DONE", metrics }],
        total: 1,
        page: 1,
        pageSize: 20
      };
    }
    await route.fulfill({ json: { code: 0, data } });
  });
  await page.goto("/e2e/fixtures/contact-receipts/index.html");
  await expect(page.getByText("送达率 75.00%")).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "结果未知 5", exact: true }).click();
  await expect(page.getByText("尚无确认回执", { exact: true })).toBeVisible();
  expect(queries.at(-1)?.searchParams.get("sendStatus")).toBe("UNKNOWN");
  await page.getByRole("tab", { name: "概览", exact: true }).click();
  await page.getByRole("button", { name: "已读 25", exact: true }).click();
  await page.locator(".el-pagination .btn-next").click();
  await expect.poll(() => queries.at(-1)?.searchParams.get("page")).toBe("2");
  expect(queries.at(-1)?.searchParams.get("receiptStatus")).toBe("READ");
  await page.getByRole("tab", { name: "账号数据", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "110", exact: true })
  ).toBeVisible();
  await page.getByRole("columnheader", { name: /已读/ }).click();
  await expect
    .poll(() => queries.at(-1)?.searchParams.get("sortBy"))
    .toBe("readNum");
  await page.getByRole("button", { name: "查看", exact: true }).click();
  await expect
    .poll(() => queries.at(-1)?.searchParams.get("taskAccountId"))
    .toBe("10");
  await page.getByRole("tab", { name: "概览", exact: true }).click();
  metrics.confirmedNum = 81;
  metrics.deliveredNum = 61;
  metrics.readNum = 26;
  metrics.unknownNum = 4;
  await page.getByRole("button", { name: "刷新", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "结果未知 4", exact: true })
  ).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/contact-receipts-product.png",
    fullPage: true
  });
  await page.clock.install();
  // Explicit switch off/on schedules the application timer on the test clock.
  await page.locator(".el-switch").click();
  await page.locator(".el-switch").click();
  const beforeTick = statsReads;
  await page.clock.fastForward(10_100);
  await expect.poll(() => statsReads).toBe(beforeTick + 1);
  await page.getByRole("button", { name: "close this dialog" }).click();
  const afterClose = statsReads;
  await page.clock.fastForward(30_000);
  expect(statsReads).toBe(afterClose);
  await page.getByRole("button", { name: "打开结果" }).click();
  await expect(
    page.getByRole("button", { name: "结果未知 4", exact: true })
  ).toBeVisible();
  // Visibility changes cancel timers, including after a drawer is reopened.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const beforeHidden = statsReads;
  await page.clock.fastForward(30_000);
  expect(statsReads).toBe(beforeHidden);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(10_100);
  await expect.poll(() => statsReads).toBe(beforeHidden + 1);
  accounts.preparingAccountNum = 1;
  await page.getByRole("button", { name: "刷新", exact: true }).click();
  await expect(page.getByText("名单准备 1 / 2 个账号")).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toHaveCount(0);
  accounts.preparingAccountNum = 0;
  Object.assign(metrics, {
    confirmedNum: 0,
    deliveredNum: 0,
    readNum: 0,
    failedNum: 0,
    unknownNum: 100,
    skippedNum: 0
  });
  await page.getByRole("button", { name: "刷新", exact: true }).click();
  await expect(page.getByText("送达率 —", { exact: true })).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({
    path: "/private/tmp/contact-receipts-product-mobile.png",
    fullPage: true
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("real task list separates progress, exports consistent CSV and opens a metric filter", async ({
  page
}) => {
  const permissions = [
    "tenant:contact_task:view",
    "tenant:contact_task:operate"
  ];
  await page.addInitScript(
    ({ permissions }) => {
      const session = {
        accessToken: "local-fixture",
        expires: Date.now() + 3600000,
        refreshToken: "",
        roles: ["operator"],
        permissions,
        username: "local-test",
        nickname: "合成验收"
      };
      localStorage.setItem("user-info", JSON.stringify(session));
      document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
      document.cookie = "multiple-tabs=true; path=/";
    },
    { permissions }
  );
  const stats = {
    taskId: 42,
    runStatus: 2,
    metrics: {
      scopeId: 42,
      plannedNum: 100,
      attemptedNum: 95,
      confirmedNum: 80,
      deliveredNum: 60,
      readNum: 25,
      failedNum: 10,
      unknownNum: 5,
      skippedNum: 5,
      processedNum: 100,
      pendingNum: 0,
      sendingNum: 0,
      inconsistentNum: 0
    },
    accounts: {
      taskId: 42,
      selectedAccountNum: 2,
      preparingAccountNum: 0,
      readyAccountNum: 2,
      failedAccountNum: 1
    },
    reasons: []
  };
  let filter: string | null = null;
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost")
      return route.abort();
    if (!url.pathname.startsWith("/api/")) return route.continue();
    let data: unknown = [];
    if (url.pathname === "/api/tenant/me/menus")
      data = [
        {
          path: "/contact",
          name: "ContactMarketing",
          meta: { title: "通讯录营销", rank: 3 },
          children: [
            {
              path: "/contact/hyperlink",
              name: "ContactHyperlinkTask",
              component: "contact/hyperlink/index",
              meta: {
                title: "通讯录超链任务",
                auths: permissions,
                module_key: "contact",
                perm_key: permissions[0]
              }
            }
          ]
        }
      ];
    else if (url.pathname === "/api/contact-tasks")
      data = {
        list: [
          {
            id: 42,
            name: "合成任务",
            messageType: 1,
            content: "test",
            isEnabled: 1,
            runStatus: 2,
            stats,
            accountFilter: "{}"
          }
        ],
        total: 1,
        page: 1,
        pageSize: 20
      };
    else if (url.pathname.endsWith("/stats")) data = stats;
    else if (url.pathname.endsWith("/recipients")) {
      filter = url.searchParams.get("receiptStatus");
      data = { list: [], total: 60, page: 1, pageSize: 20 };
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("/#/contact/hyperlink");
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByText("送达率：75.00%")).toBeVisible();
  await expect(page.getByText("执行异常账号数：1")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出本页 CSV" }).click();
  const { readFile } = await import("node:fs/promises");
  const artifact = await download;
  const csv = await readFile((await artifact.path())!, "utf8");
  expect(csv).toContain("已处理条数");
  expect(csv).toContain('"75.00%"');
  expect(csv).not.toContain("封号数");
  await page.getByRole("button", { name: "✓✓ 60", exact: true }).click();
  await expect.poll(() => filter).toBe("DELIVERED");
  await expect(page.getByRole("tab", { name: "联系人明细" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

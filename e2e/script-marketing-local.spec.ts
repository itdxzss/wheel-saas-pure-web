import { test, expect } from "@playwright/test";

const permissions = ["view", "create", "edit", "operate"].map(
  key => `tenant:script_marketing:${key}`
);

test("shared message material flows through the script library into a task snapshot", async ({
  page
}) => {
  let material: Record<string, unknown> | undefined;
  let definition: Record<string, unknown> | undefined;
  let taskWrites = 0;
  const menu = [
    [
      "剧本素材库",
      "ScriptMaterialLibrary",
      "/group-maintenance/materials",
      "material/script-material/index"
    ],
    [
      "养群剧本",
      "ScriptDefinitionLibrary",
      "/group-maintenance/scripts",
      "task/script-definition/index"
    ],
    [
      "养群任务",
      "TaskScriptMarketing",
      "/task/script-marketing",
      "task/script-marketing/index"
    ]
  ];
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.startsWith("/api/")) {
      await route.continue();
      return;
    }
    const paged = (list: unknown[]) => ({ list, total: list.length });
    let data: unknown;
    if (path === "/api/tenant/me/menus")
      data = [
        {
          path: "/group-maintenance",
          name: "GroupMaintenance",
          meta: { title: "养群管理", rank: 4 },
          children: menu.map(([title, name, routePath, component]) => ({
            path: routePath,
            name,
            component,
            meta: {
              title,
              auths: permissions,
              module_key: "task",
              perm_key: permissions[0]
            }
          }))
        }
      ];
    else if (path === "/api/script-materials") {
      if (request.method() === "POST")
        material = {
          ...request.postDataJSON(),
          id: 501,
          updatedAt: Date.now()
        };
      data =
        request.method() === "POST"
          ? material
          : paged(material ? [material] : []);
    } else if (path === "/api/script-definitions") {
      if (request.method() === "POST")
        definition = {
          ...request.postDataJSON(),
          id: 601,
          updatedAt: Date.now()
        };
      data =
        request.method() === "POST"
          ? definition
          : paged(definition ? [definition] : []);
    } else if (path === "/api/script-definitions/601") data = definition;
    else if (path === "/api/script-marketing-tasks") {
      if (request.method() === "POST") taskWrites++;
      data = paged([]);
    } else if (path.endsWith("/options/account-groups")) data = [];
    else if (path.endsWith("/options/accounts")) data = paged([]);
    else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("http://127.0.0.1:5194/#/group-maintenance/materials");
  await page.getByRole("button", { name: "新建消息素材" }).click();
  let drawer = page.getByRole("dialog", { name: "新建消息素材" });
  await drawer.getByRole("textbox", { name: "素材名称" }).fill("开场素材");
  await drawer
    .getByRole("textbox", { name: "消息内容" })
    .fill("来自公共素材库的开场");
  await drawer.getByRole("button", { name: "保存素材", exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(material?.content).toBe("来自公共素材库的开场");

  await page.goto("http://127.0.0.1:5194/#/group-maintenance/scripts");
  await page.getByRole("button", { name: "新建剧本", exact: true }).click();
  drawer = page.getByRole("dialog", { name: "新建养群剧本" });
  await drawer.getByRole("textbox", { name: "剧本名称" }).fill("素材复用剧本");
  const first = drawer.locator(".el-collapse-item").nth(0);
  await first
    .locator(".el-form-item")
    .filter({ has: page.getByText("复用素材", { exact: true }) })
    .locator(".el-select")
    .click();
  await page.getByRole("option", { name: "开场素材", exact: true }).click();
  await expect(first.locator("textarea").first()).toHaveValue(
    "来自公共素材库的开场"
  );
  const second = drawer.locator(".el-collapse-item").nth(1);
  await second.locator(".el-collapse-item__header").click();
  await second.locator("textarea").first().fill("推手回应");
  await drawer.getByRole("button", { name: "保存剧本", exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(
    (definition?.steps as { accountId: number | null }[]).every(
      step => step.accountId === null
    )
  ).toBe(true);

  await page.goto("http://127.0.0.1:5194/#/task/script-marketing");
  await page.getByRole("button", { name: "新建剧本任务", exact: true }).click();
  drawer = page.getByRole("dialog", { name: "新建剧本任务" });
  await drawer
    .locator(".el-form-item")
    .filter({ has: page.getByText("选用剧本", { exact: true }) })
    .locator(".el-select")
    .click();
  await page.getByRole("option", { name: "素材复用剧本", exact: true }).click();
  await expect(drawer.getByRole("textbox", { name: "任务名称" })).toHaveValue(
    "素材复用剧本"
  );
  await expect(
    drawer.locator(".el-collapse-item").nth(0).locator("textarea").first()
  ).toHaveValue("来自公共素材库的开场");
  expect(taskWrites).toBe(0);
});

test("a short group shows the complete gap report and rechecking never starts a task", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  let starts = 0;
  let ready = false;
  let status = 0;
  const paths: string[] = [];
  const task = () => ({
    id: 88,
    taskName: "缺口检查任务",
    status,
    accountGroupId: 30,
    intervalSeconds: 10,
    startAt: 1,
    endAt: null,
    groupCount: 2,
    successCount: 0,
    failedCount: 0,
    unknownCount: 0,
    inFlightCount: 0
  });
  const report = () => ({
    ready,
    accountCount: 6,
    requiredPromoters: 5,
    poolReason: null,
    checkedAt: Date.now(),
    groups: [
      {
        groupLinkId: 40,
        groupJid: "120040@g.us",
        groupName: "达标群",
        ready: true,
        required: 5,
        available: 5,
        shortage: 0,
        offline: 0,
        noPermission: 0,
        unconfirmed: 0,
        reasons: []
      },
      {
        groupLinkId: 41,
        groupJid: "120041@g.us",
        groupName: "需要补齐群",
        ready,
        required: 5,
        available: ready ? 5 : 1,
        shortage: ready ? 0 : 4,
        offline: 0,
        noPermission: 0,
        unconfirmed: 0,
        reasons: ready
          ? []
          : [
              "需要 5 个推手，已确认可用 1 个，缺 4 个",
              "请到进群任务补齐推手，完成后重新检查"
            ]
      }
    ]
  });
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) {
      await route.continue();
      return;
    }
    paths.push(path);
    let data: unknown;
    let code = 0;
    if (path === "/api/tenant/me/menus")
      data = [
        {
          path: "/group-maintenance",
          name: "GroupMaintenance",
          meta: { title: "养群管理" },
          children: [
            {
              path: "/task/script-marketing",
              name: "TaskScriptMarketing",
              component: "task/script-marketing/index",
              meta: {
                title: "养群任务",
                auths: permissions,
                module_key: "task",
                perm_key: permissions[0]
              }
            }
          ]
        }
      ];
    else if (path === "/api/script-marketing-tasks")
      data = { list: [task()], total: 1 };
    else if (path.endsWith("/88/check")) data = report();
    else if (path.endsWith("/88/start")) {
      starts++;
      if (ready) {
        status = 1;
        data = null;
      } else {
        code = 409;
        data = report();
      }
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({
      json: { code, message: code ? "所选群不满足启动条件" : "ok", data }
    });
  });
  await page.goto("http://127.0.0.1:5194/#/task/script-marketing");
  await expect(page.locator(".script-marketing-page")).toBeVisible({
    timeout: 10000
  });
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "启动", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "目标群资格检查" });
  await expect(
    dialog.getByRole("cell", { name: /^需要补齐群 / })
  ).toBeVisible();
  await expect(dialog.getByText("缺 4 个", { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "启动任务", exact: true })
  ).toHaveCount(0);
  await dialog.getByText("只看不达标群", { exact: true }).click();
  await expect(
    dialog.getByRole("checkbox", { name: "只看不达标群" })
  ).not.toBeChecked();
  await expect(dialog.getByRole("cell", { name: /^达标群 / })).toBeVisible();
  expect(starts).toBe(1);
  ready = true;
  await dialog.getByRole("button", { name: "重新检查", exact: true }).click();
  await expect(
    dialog.getByText("所选 2 个群均满足条件，可以启动任务", { exact: true })
  ).toBeVisible();
  expect(starts).toBe(1);
  expect(paths.some(path => path.startsWith("/api/join"))).toBe(false);
  await dialog.getByRole("button", { name: "启动任务", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(starts).toBe(2);
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ permissions }) => {
      // 普通 HTTP 环境没有此 API；localhost 默认可用，会掩盖线上兼容性问题。
      Object.defineProperty(crypto, "randomUUID", { value: undefined });
      const session = {
        accessToken: "local-fixture",
        expires: Date.now() + 3600000,
        refreshToken: "",
        roles: ["admin"],
        permissions,
        username: "local-test",
        nickname: "页面验证"
      };
      localStorage.setItem("user-info", JSON.stringify(session));
      document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
      document.cookie = "multiple-tabs=true; path=/";
    },
    { permissions }
  );
});

/** 完整新页面的本地 API 契约夹具；所有 /api 请求被拦截，不接触真实环境。 */
test("default roles, additional promoter and ordered save stay independent", async ({
  page
}, testInfo) => {
  let saved: Record<string, unknown> | undefined;
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  const fixturePage = (list: unknown[]) => ({
    list,
    total: list.length,
    page: 1,
    pageSize: 100,
    totalPages: 1
  });
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.startsWith("/api/")) {
      await route.continue();
      return;
    }
    let data: unknown;
    if (path === "/api/tenant/me/menus")
      data = [
        {
          path: "/task",
          name: "TaskCenter",
          meta: { title: "任务中心", rank: 3 },
          children: [
            {
              path: "/task/script-marketing",
              name: "TaskScriptMarketing",
              component: "task/script-marketing/index",
              meta: {
                title: "剧本营销任务",
                auths: permissions,
                module_key: "task",
                perm_key: permissions[0]
              }
            }
          ]
        }
      ];
    else if (path.endsWith("/options/account-groups"))
      data = [{ id: 30, name: "推手分组 A" }];
    else if (path.endsWith("/options/accounts"))
      data = fixturePage(
        [1, 2, 3].map(id => ({ id, wsPhone: `1555000000${id}`, loginState: 1 }))
      );
    else if (path.endsWith("/options/groups"))
      data = fixturePage([
        { id: 42, groupName: "本地测试群", groupJid: "120001@g.us" }
      ]);
    else if (
      path === "/api/script-marketing-tasks" &&
      request.method() === "POST"
    ) {
      saved = request.postDataJSON();
      data = { task: { id: 99 }, steps: saved?.steps, groups: [] };
    } else if (path === "/api/script-marketing-tasks") data = fixturePage([]);
    else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("http://127.0.0.1:5194/#/task/script-marketing");
  await page.getByRole("button", { name: "新建剧本任务" }).click();
  const drawer = page.locator(".el-drawer").filter({ hasText: "新建剧本任务" });
  await expect(
    drawer.locator(".el-collapse-item__header").nth(0)
  ).toBeVisible();
  await expect(
    drawer.locator(".el-collapse-item__header").nth(1)
  ).toBeVisible();
  await drawer
    .locator(".el-form-item")
    .filter({ has: page.getByText("任务名称", { exact: true }) })
    .locator("input")
    .fill("三人顺序消息测试");
  await drawer
    .locator(".el-form-item")
    .filter({ has: page.getByText("推手分组", { exact: true }) })
    .locator(".el-select")
    .click();
  await page.getByRole("option", { name: "推手分组 A", exact: true }).click();
  await drawer
    .locator(".el-form-item")
    .filter({ has: page.getByText("目标群", { exact: true }) })
    .locator(".el-select")
    .click();
  await page.getByRole("option", { name: "本地测试群" }).click();
  await page.keyboard.press("Escape");
  async function fillStep(index: number, accountId: number, text: string) {
    const section = drawer.locator(".el-collapse-item").nth(index);
    if (index) await section.locator(".el-collapse-item__header").click();
    if (index === 0) {
      await section
        .locator(".el-form-item")
        .filter({ has: page.getByText("管理员账号", { exact: true }) })
        .locator(".el-select")
        .click();
      await page
        .getByRole("option", {
          name: `1555000000${accountId} · #${accountId}`,
          exact: true
        })
        .click();
    }
    await section.locator("textarea").first().fill(text);
  }
  await fillStep(0, 1, "管理员开场消息");
  await fillStep(1, 2, "第一位推手消息");
  await drawer.getByRole("button", { name: "添加发送项" }).click();
  const third = drawer.locator(".el-collapse-item").nth(2);
  await third.locator("textarea").first().fill("第二位推手消息");
  await third.getByText("按钮消息", { exact: true }).click();
  await third.getByPlaceholder("按钮文字").fill("查看详情");
  await third.getByPlaceholder("链接或复制内容").fill("https://example.com");
  await third.getByRole("button", { name: "添加按钮", exact: true }).click();
  await expect(third.getByPlaceholder("按钮文字")).toHaveCount(2);
  await third.getByPlaceholder("按钮文字").nth(1).fill("联系团队");
  await third
    .getByPlaceholder("链接或复制内容")
    .nth(1)
    .fill("https://example.com/contact");
  await third.getByRole("button", { name: "复制此项", exact: true }).click();
  const copied = drawer.locator(".el-collapse-item").nth(3);
  await copied.locator(".el-collapse-item__header").click();
  await expect(copied.getByPlaceholder("按钮文字").first()).toHaveValue(
    "查看详情"
  );
  await copied.getByPlaceholder("按钮文字").first().fill("独立副本");
  await copied.getByRole("button", { name: "删除", exact: true }).click();
  await third.locator(".el-collapse-item__header").click();
  await expect(third.getByPlaceholder("按钮文字").first()).toHaveValue(
    "查看详情"
  );
  await third.getByRole("button", { name: "上移", exact: true }).click();
  await drawer.locator(".el-drawer__body").evaluate(element => {
    element.scrollTop = 0;
  });
  await page.screenshot({
    path: testInfo.outputPath("create.png"),
    fullPage: true,
    animations: "disabled"
  });
  await drawer.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByText("草稿已保存，可在任务列表启动")).toBeVisible();
  expect(saved?.taskName).toBe("三人顺序消息测试");
  expect(saved?.groupLinkIds).toEqual([42]);
  const steps = saved?.steps as {
    accountId: number;
    message: { content: string };
  }[];
  expect(saved?.accountGroupId).toBe(30);
  expect(steps.map(step => step.accountId)).toEqual([1, null, null]);
  expect(steps.map(step => step.message.content)).toEqual([
    "管理员开场消息",
    "第二位推手消息",
    "第一位推手消息"
  ]);
  expect(pageErrors).toEqual([]);
});

for (const delayed of ["detail", "records"] as const) {
  test(`late ${delayed} replies and failed details never show another task`, async ({
    page
  }) => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    let started!: () => void;
    const waiting = new Promise<void>(resolve => {
      started = resolve;
    });
    let failSecond = false;
    const tasks = [1, 2].map(id => ({
      id,
      taskName: `任务 ${id}`,
      status: 0,
      intervalSeconds: 10,
      startAt: 1,
      endAt: null,
      groupCount: 1,
      successCount: 0,
      failedCount: 0,
      unknownCount: 0,
      inFlightCount: 0
    }));
    const paged = (list: unknown[]) => ({ list, total: list.length });
    await page.route("**/api/**", async route => {
      const path = new URL(route.request().url()).pathname;
      if (!path.startsWith("/api/")) return route.continue();
      let data: unknown;
      if (path === "/api/tenant/me/menus") {
        data = [
          {
            path: "/task",
            name: "TaskCenter",
            meta: { title: "任务中心" },
            children: [
              {
                path: "/task/script-marketing",
                name: "TaskScriptMarketing",
                component: "task/script-marketing/index",
                meta: { title: "剧本营销任务", auths: permissions }
              }
            ]
          }
        ];
      } else if (path === "/api/script-marketing-tasks") {
        data = paged(tasks);
      } else {
        const match = path.match(
          /^\/api\/script-marketing-tasks\/(1|2)(\/records)?$/
        );
        if (!match) return route.abort();
        const id = Number(match[1]);
        const records = !!match[2];
        if (id === 1 && records === (delayed === "records")) {
          started();
          await gate;
        }
        if (id === 2 && !records && failSecond) {
          return route.fulfill({
            json: { code: 500, message: "详情读取失败", data: null }
          });
        }
        data = records
          ? paged([
              {
                id,
                groupId: id,
                stepIndex: 0,
                accountId: id,
                status: 2,
                messageId: `message-task-${id}`,
                commandId: `command-task-${id}`
              }
            ])
          : {
              task: tasks[id - 1],
              steps: [],
              groups: [{ id, groupName: `群 ${id}`, nextStep: 0 }]
            };
      }
      await route.fulfill({ json: { code: 0, message: "ok", data } });
    });
    await page.goto("http://127.0.0.1:5194/#/task/script-marketing");
    const openTask = (id: number) =>
      page
        .locator(".script-marketing-page .el-table__body tr")
        .filter({ hasText: `任务 ${id}` })
        .getByRole("button", { name: "详情", exact: true })
        .click();
    const drawer = page
      .locator(".el-drawer")
      .filter({ hasText: "剧本任务详情" });
    await openTask(1);
    await waiting;
    await drawer.locator(".el-drawer__close-btn").click();
    await expect(drawer).not.toBeVisible();
    await openTask(2);
    await expect(
      drawer.getByRole("heading", { name: "任务 2", exact: true })
    ).toBeVisible();
    await expect(
      drawer.getByText("message-task-2", { exact: true })
    ).toBeVisible();
    const finished = page.waitForResponse(
      response =>
        new URL(response.url()).pathname ===
        `/api/script-marketing-tasks/1${delayed === "records" ? "/records" : ""}`
    );
    release();
    await finished;
    // 响应完成后给 Vue 一个渲染窗口，断言当前任务仍保持正确。
    await page.waitForTimeout(150);
    await expect(
      drawer.getByRole("heading", { name: "任务 2", exact: true })
    ).toBeVisible();
    await expect(
      drawer.getByText("message-task-2", { exact: true })
    ).toBeVisible();
    await expect(
      drawer.getByText("message-task-1", { exact: true })
    ).toHaveCount(0);
    await drawer.locator(".el-drawer__close-btn").click();
    await expect(drawer).not.toBeVisible();
    await openTask(1);
    await expect(
      drawer.getByRole("heading", { name: "任务 1", exact: true })
    ).toBeVisible();
    await drawer.locator(".el-drawer__close-btn").click();
    await expect(drawer).not.toBeVisible();
    failSecond = true;
    await openTask(2);
    await expect(page.getByText("详情读取失败", { exact: true })).toBeVisible();
    await expect(
      drawer.getByRole("heading", { name: "任务 1", exact: true })
    ).toHaveCount(0);
  });
}

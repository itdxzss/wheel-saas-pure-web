import { expect, test, type Page, type Route } from "@playwright/test";

test.use({ viewport: { width: 1920, height: 1080 } });

/** 全部 API 由本地合成夹具拦截，不访问真实租户或执行 WhatsApp 操作。 */
async function setup(page: Page) {
  const permissions = [
    "tenant:pull_task:view",
    "tenant:pull_task:create",
    "tenant:pull_task:operate",
    "tenant:group_data_package:view"
  ];
  const state = {
    requests: [] as string[],
    creates: [] as Record<string, unknown>[],
    pending: null as Route | null
  };
  await page.addInitScript(
    ({ permissions }) => {
      const session = {
        accessToken: "local-direct-link-fixture",
        expires: Date.now() + 3600000,
        refreshToken: "",
        roles: ["operator"],
        permissions,
        username: "local-test"
      };
      localStorage.setItem("user-info", JSON.stringify(session));
      document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
      document.cookie = "multiple-tabs=true; path=/";
    },
    { permissions }
  );
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    state.requests.push(`${request.method()} ${path}`);
    let data: unknown;
    if (path === "/api/tenant/me/menus") {
      data = [
        {
          path: "/task",
          name: "Task",
          meta: { title: "任务中心" },
          children: [
            {
              path: "/task/pull",
              name: "TaskPull",
              component: "task/pull-task/index",
              meta: {
                title: "拉群任务",
                auths: permissions,
                module_key: "pull_task",
                perm_key: permissions[0]
              }
            }
          ]
        }
      ];
    } else if (path === "/api/account-groups") {
      data = {
        list: [
          { id: 12, name: "合成拉手组", totalAccounts: 5, onlineAccounts: 5 }
        ],
        total: 1
      };
    } else if (path === "/api/group-folders") {
      data = {
        list: [
          { id: 21, name: "合成群分组", groupCount: 3, systemBuiltin: false }
        ],
        total: 1
      };
    } else if (path === "/api/pull-tasks/standard/draft") {
      data = {
        draftTaskId: 7,
        creationMode: "PASTED_LINK",
        rows: [],
        linkLines: [],
        fileResults: [],
        matchedCount: 0,
        remainingLinkCount: 0,
        ignoredFileCount: 0
      };
    } else if (path === "/api/pull-tasks") {
      data = { list: [], total: 0 };
    } else if (path === "/api/pull-tasks/standard/direct-link") {
      const body = request.postData() ?? "";
      const json = body.match(/\r\n\r\n(\{[^\r\n]+\})\r\n/);
      expect(json, "multipart JSON request").toBeTruthy();
      state.creates.push(JSON.parse(json![1]));
      state.pending = route;
      return;
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("/#/task/pull");
  await page.getByRole("button", { name: "新建拉群任务", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "群链接模式", exact: true })
  ).toBeVisible();
  return state;
}

test("switches between isolated forms and reopens the new mode without reading a draft", async ({
  page
}) => {
  const state = await setup(page);
  const drawer = page.locator(".pull-task-create-drawer:visible");
  await drawer
    .locator(".task-base-block input[type=text]")
    .fill("旧模式保留名称");
  await page
    .getByRole("tab", { name: "群链接模式（新）", exact: true })
    .click();
  const direct = drawer.locator(".direct-link-content");
  await expect(direct).toBeVisible();
  for (const label of ["执行策略", "群信息设置", "管理分组", "管理完成归档"]) {
    await expect(direct.getByText(label, { exact: true })).toHaveCount(0);
  }
  const baselineRequests = state.requests.length;
  await direct
    .locator(".el-form-item")
    .filter({ hasText: "任务名称" })
    .locator("input")
    .fill("新模式保留名称");
  await direct
    .locator("textarea")
    .first()
    .fill("https://chat.whatsapp.com/example");
  await direct.locator("input[type=file]").setInputFiles({
    name: "members.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("12345678900\n")
  });
  await expect(direct.getByText("members.txt", { exact: true })).toBeVisible();
  expect(
    state.requests
      .slice(baselineRequests)
      .filter(item => item.includes("/draft"))
  ).toEqual([]);
  await drawer.getByRole("button", { name: "取消", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  const beforeReopen = state.requests.length;
  await page.getByRole("button", { name: "新建拉群任务", exact: true }).click();
  await expect(direct).toBeVisible();
  await expect(
    direct
      .locator(".el-form-item")
      .filter({ hasText: "任务名称" })
      .locator("input")
  ).toHaveValue("新模式保留名称");
  expect(
    state.requests.slice(beforeReopen).filter(item => item.includes("/draft"))
  ).toEqual([]);
  await page.getByRole("tab", { name: "群链接模式", exact: true }).click();
  await expect(drawer.locator(".task-base-block input[type=text]")).toHaveValue(
    "旧模式保留名称"
  );
  const pullers = drawer
    .locator(".account-block .el-form-item")
    .filter({ hasText: /^拉手分组/ });
  await pullers.locator(".el-select").click();
  await expect(
    page
      .locator(".el-select-dropdown__item:visible")
      .filter({ hasText: "合成拉手组" })
  ).toBeVisible();
});

test("keeps resources visible and the form within the drawer at desktop widths", async ({
  page
}, testInfo) => {
  await setup(page);
  await page
    .getByRole("tab", { name: "群链接模式（新）", exact: true })
    .click();
  const drawer = page.locator(".pull-task-create-drawer:visible");
  const direct = drawer.locator(".direct-link-content");
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      direct.getByText("料子资源", { exact: true })
    ).toBeInViewport();
    await expect(
      direct.getByRole("button", { name: "选择数据包", exact: true })
    ).toBeInViewport();
    const overflow = await drawer
      .locator(".create-scroll")
      .evaluate(element => element.scrollWidth > element.clientWidth);
    expect(overflow).toBe(false);
    await expect(
      drawer.getByRole("button", { name: "创建并启动", exact: true })
    ).toHaveCount(1);
    await page.screenshot({
      animations: "disabled",
      path: testInfo.outputPath(`direct-link-${width}.png`)
    });
  }
  await direct.locator(".el-switch").click();
  await expect(
    drawer.getByRole("button", { name: "创建任务", exact: true })
  ).toHaveCount(1);
});

test("submits only the direct request and keeps retry identity while blocking close and tab switching", async ({
  page
}) => {
  const state = await setup(page);
  await page
    .getByRole("tab", { name: "群链接模式（新）", exact: true })
    .click();
  const drawer = page.locator(".pull-task-create-drawer:visible");
  const direct = drawer.locator(".direct-link-content");
  await direct
    .locator("textarea")
    .first()
    .fill("https://chat.whatsapp.com/example");
  await direct.locator("input[type=file]").setInputFiles({
    name: "members.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("12345678900\n")
  });
  await direct
    .locator(".el-form-item")
    .filter({ hasText: /^拉手分组/ })
    .locator(".el-select")
    .click();
  await page
    .locator(".el-select-dropdown__item:visible")
    .filter({ hasText: "合成拉手组" })
    .click();
  const beforeSubmit = state.requests.length;
  await drawer
    .getByRole("button", { name: "创建并启动", exact: true })
    .first()
    .click();
  await expect.poll(() => state.creates.length).toBe(1);
  await expect(
    drawer.getByRole("button", { name: "取消", exact: true })
  ).toBeDisabled();
  await expect(
    page.getByRole("tab", { name: "群链接模式", exact: true })
  ).toHaveClass(/is-disabled/);
  await page.getByRole("tab", { name: "群链接模式", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "群链接模式（新）", exact: true })
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(direct).toBeVisible();
  const first = state.creates[0];
  expect(first.pullerGroupId).toBe(12);
  expect(first).not.toHaveProperty("draftTaskId");
  expect(first).not.toHaveProperty("managerGroupId");
  expect(first).not.toHaveProperty("groupSetting");
  await state.pending!.fulfill({
    json: { code: 500, message: "合成失败，请重试", data: null }
  });
  await expect(
    direct.getByText("合成失败，请重试", { exact: true })
  ).toBeVisible();
  await drawer
    .getByRole("button", { name: "创建并启动", exact: true })
    .first()
    .click();
  await expect.poll(() => state.creates.length).toBe(2);
  expect(state.creates[1].requestId).toBe(first.requestId);
  await state.pending!.fulfill({
    json: {
      code: 0,
      message: "ok",
      data: {
        id: 9,
        taskName: "合成任务",
        status: "WAIT_START",
        groupCount: 1,
        expectedPullCount: 1
      }
    }
  });
  await expect(drawer).toHaveCount(0);
  expect(
    state.requests.slice(beforeSubmit).filter(item => item.includes("/draft"))
  ).toEqual([]);
});

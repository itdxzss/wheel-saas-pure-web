import { test, expect, type Page } from "@playwright/test";

const permissions = ["view", "create", "edit", "operate"].map(
  key => `tenant:contact_task:${key}`
);
const options = {
  groups: [
    { id: 17, name: "通讯录测试组" },
    { id: 29, name: "备用测试组" }
  ],
  channels: [{ id: 83, name: "推广测试渠道" }]
};

/** 所有业务请求均由本地夹具响应，测试不会创建真实任务。 */
async function setup(page: Page, initialFilter?: object) {
  const state = {
    optionFailure: false,
    emptyOptions: false,
    optionRequests: 0,
    previews: [] as Record<string, unknown>[],
    saved: undefined as Record<string, unknown> | undefined
  };
  const detail = {
    id: 91,
    name: "已有通讯录任务",
    messageType: 1,
    content: "测试正文",
    accountFilter: JSON.stringify(initialFilter ?? {}),
    msgIntervalMinSec: 0.5,
    msgIntervalMaxSec: 1,
    concurrency: 10,
    maxSendsPerAccount: 50,
    retryMax: 3,
    startMode: "now",
    taskDelayMinutes: 0,
    isEnabled: 0,
    runStatus: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await page.addInitScript(
    ({ permissions }) => {
      const session = {
        accessToken: "local-fixture",
        expires: Date.now() + 3600000,
        refreshToken: "",
        roles: ["operator"],
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
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let data: unknown;
    if (path === "/api/tenant/me/menus") {
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
    } else if (path === "/api/contact-tasks/account-options") {
      state.optionRequests++;
      if (state.optionFailure) {
        await route.fulfill({
          json: { code: 5000, message: "选项查询暂不可用", data: null }
        });
        return;
      }
      data = state.emptyOptions ? { groups: [], channels: [] } : options;
    } else if (path === "/api/contact-tasks/account-preview") {
      state.previews.push(JSON.parse(request.postDataJSON().accountFilterJson));
      data = { matchedAccountCount: 3 };
    } else if (path === "/api/contact-tasks/91") {
      data = detail;
    } else if (path === "/api/contact-tasks" && request.method() === "POST") {
      state.saved = request.postDataJSON();
      data = detail;
    } else if (path === "/api/contact-tasks") {
      const list = initialFilter ? [detail] : [];
      data = { list, total: list.length, page: 1, pageSize: 20, totalPages: 1 };
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("/#/contact/hyperlink");
  if (initialFilter)
    await page.getByRole("button", { name: "编辑", exact: true }).click();
  else
    await page.getByRole("button", { name: "新建任务", exact: true }).click();
  return state;
}

async function openFilter(page: Page) {
  await page.getByRole("button", { name: "设置账号范围", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "账号范围", exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("names are searchable, cancel is isolated and numeric IDs reach preview and save", async ({
  page
}) => {
  const state = await setup(page);
  let dialog = await openFilter(page);
  const group = dialog.getByRole("combobox", { name: "账号分组", exact: true });
  await expect(group).toBeEnabled();
  await group.fill("通讯录");
  await page.getByRole("option", { name: "通讯录测试组", exact: true }).click();
  await dialog.getByRole("heading", { name: "账号范围", exact: true }).click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  const channel = dialog.getByRole("combobox", { name: "渠道", exact: true });
  await channel.click();
  await page.getByRole("option", { name: "推广测试渠道", exact: true }).click();
  await dialog.getByRole("heading", { name: "账号范围", exact: true }).click();
  await expect(channel).toHaveAttribute("aria-expanded", "false");
  await dialog.getByRole("button", { name: "确定", exact: true }).click();
  await expect.poll(() => state.previews.at(-1)?.groupIds).toEqual([17]);
  expect(state.previews.at(-1)?.channelIds).toEqual([83]);

  dialog = await openFilter(page);
  await expect(dialog.getByText("通讯录测试组", { exact: true })).toBeVisible();
  await expect(dialog.getByText("推广测试渠道", { exact: true })).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "账号分组", exact: true })
    .fill("备用");
  await page.getByRole("option", { name: "备用测试组", exact: true }).click();
  await dialog.getByRole("heading", { name: "账号范围", exact: true }).click();
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  dialog = await openFilter(page);
  await expect(dialog.getByText("备用测试组", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("通讯录测试组", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "取消", exact: true }).click();

  await page.getByPlaceholder("给任务起个名字").fill("按分组发送测试");
  await page.getByRole("textbox", { name: "图文文案" }).fill("测试消息");
  await page.getByRole("button", { name: "停用 仅保存草稿，不发送" }).click();
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect.poll(() => state.saved).toBeDefined();
  const savedFilter = JSON.parse(String(state.saved?.accountFilterJson));
  expect(savedFilter.groupIds).toEqual([17]);
  expect(savedFilter.channelIds).toEqual([83]);
  expect(state.saved?.isEnabled).toBe(0);
  expect(state.optionRequests).toBe(3);
});

test("failed options are visible and retry distinguishes an empty tenant", async ({
  page
}) => {
  const state = await setup(page);
  state.optionFailure = true;
  const dialog = await openFilter(page);
  await expect(
    dialog.getByRole("alert").filter({ hasText: "分组和渠道加载失败" })
  ).toBeVisible();
  await expect(
    dialog.getByRole("combobox", { name: "账号分组", exact: true })
  ).toBeDisabled();
  state.optionFailure = false;
  state.emptyOptions = true;
  await dialog.getByRole("button", { name: "重新加载" }).click();
  await expect(
    dialog.getByText("分组和渠道加载失败", { exact: false })
  ).toHaveCount(0);
  await dialog.getByRole("combobox", { name: "账号分组", exact: true }).click();
  await expect(page.getByText("暂无账号分组", { exact: true })).toBeVisible();
  expect(state.optionRequests).toBe(2);
});

test("editing preserves unavailable IDs until the user explicitly clears filters", async ({
  page
}) => {
  const state = await setup(page, {
    filterSchemaVersion: 1,
    groupIds: [17, 999],
    channelIds: [83]
  });
  let dialog = await openFilter(page);
  await expect(dialog.getByText("通讯录测试组", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("已选分组 #999（当前不可选）", { exact: true })
  ).toBeVisible();
  await dialog.getByRole("button", { name: "确定", exact: true }).click();
  await expect.poll(() => state.previews.at(-1)?.groupIds).toEqual([17, 999]);
  dialog = await openFilter(page);
  await dialog.getByRole("button", { name: "清空条件", exact: true }).click();
  await dialog.getByRole("button", { name: "确定", exact: true }).click();
  await expect.poll(() => state.previews.at(-1)?.groupIds).toEqual([]);
  expect(state.previews.at(-1)?.channelIds).toEqual([]);
});

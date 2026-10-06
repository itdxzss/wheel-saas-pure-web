import { expect, test, type Page, type Route } from "@playwright/test";

/** 仅使用本地 API 夹具，不发送真实 WhatsApp 配对请求。 */
async function setup(page: Page) {
  const permissions = ["tenant:account:view", "tenant:account:edit"];
  const state = {
    result: null as Record<string, unknown> | null,
    listReads: 0,
    creates: [] as { phone: string; accountGroupId: number }[],
    holdCreate: false,
    failCreate: false,
    recoveries: 0,
    requesting: false,
    failPoll: false,
    holdPoll: false,
    pendingCreate: null as Route | null,
    pendingPoll: null as Route | null
  };
  await page.addInitScript(permissions => {
    const session = {
      accessToken: "local-pairing-fixture",
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
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.startsWith("/api/")) {
      await route.continue();
      return;
    }
    let data: unknown;
    if (path === "/api/tenant/me/menus") {
      data = [
        {
          path: "/account",
          name: "Account",
          meta: { title: "账号管理" },
          children: [
            {
              path: "/account/import",
              name: "AccountImport",
              component: "account/import/index",
              meta: {
                title: "账号导入",
                auths: permissions,
                module_key: "account",
                perm_key: permissions[0]
              }
            }
          ]
        }
      ];
    } else if (path === "/api/account-groups") {
      data = {
        list: [
          { id: 12, name: "配对测试组", totalAccounts: 0, onlineAccounts: 0 }
        ],
        total: 1
      };
    } else if (path === "/api/account-imports") {
      state.listReads += 1;
      data = { list: [], total: 0 };
    } else if (
      path === "/api/account-pairing-sessions" &&
      request.method() === "POST"
    ) {
      state.creates.push(request.postDataJSON());
      if (state.failCreate) {
        await route.abort("failed");
        return;
      }
      if (state.holdCreate) {
        state.pendingCreate = route;
        return;
      }
      data = {
        sessionId: state.creates.length,
        status: "REQUESTING",
        expiresAt: Date.now() + 90000
      };
    } else if (
      path === "/api/account-pairing-sessions" &&
      request.method() === "GET"
    ) {
      state.recoveries += 1;
      data = [
        { sessionId: 1, status: "REQUESTING", expiresAt: Date.now() + 180000 }
      ];
    } else if (path.startsWith("/api/account-pairing-sessions/")) {
      if (state.failPoll) {
        await route.abort("failed");
        return;
      }
      if (state.holdPoll) {
        state.pendingPoll = route;
        return;
      }
      data = {
        status: state.requesting ? "REQUESTING" : "WAITING_CONFIRMATION",
        pairingCode: "88888888",
        expiresAt: Date.now() + 90000,
        ...state.result
      };
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("/#/account/import");
  await page.getByRole("button", { name: "认证码登录", exact: true }).click();
  return state;
}

async function submit(page: Page, phone: string, selectGroup = false) {
  const dialog = page.getByRole("dialog", { name: "认证码登录导号" });
  await dialog.getByPlaceholder("例如 919876543210（不含 + 号）").fill(phone);
  if (selectGroup) {
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: /配对测试组/ }).click();
  }
  await dialog.getByRole("button", { name: "生成认证码", exact: true }).click();
  return dialog;
}

test("switches accounts and reopens a blank form while keeping the chosen group", async ({
  page
}) => {
  const state = await setup(page);
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  await expect(dialog.getByText("当前手机号：15555550101")).toBeVisible();
  await dialog.getByRole("button", { name: "切换账号", exact: true }).click();
  await expect(
    dialog.getByPlaceholder("例如 919876543210（不含 + 号）")
  ).toHaveValue("");
  await submit(page, "15555550102");
  await expect(dialog.getByText("当前手机号：15555550102")).toBeVisible();
  expect(state.creates).toEqual([
    { phone: "15555550101", accountGroupId: 12, remark: null },
    { phone: "15555550102", accountGroupId: 12, remark: null }
  ]);
  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "认证码登录", exact: true }).click();
  await expect(
    dialog.getByPlaceholder("例如 919876543210（不含 + 号）")
  ).toHaveValue("");
  await expect(dialog.getByText("等待主设备确认", { exact: true })).toHaveCount(
    0
  );
});

test("ignores a delayed old poll after switching accounts", async ({
  page
}) => {
  const state = await setup(page);
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  state.holdPoll = true;
  await expect.poll(() => Boolean(state.pendingPoll)).toBe(true);
  await dialog.getByRole("button", { name: "切换账号", exact: true }).click();
  await dialog
    .getByPlaceholder("例如 919876543210（不含 + 号）")
    .fill("15555550102");
  const response = page.waitForResponse(response =>
    response.url().endsWith("/api/account-pairing-sessions/1")
  );
  await state.pendingPoll!.fulfill({
    json: { code: 0, data: { status: "SUCCEEDED", accountId: 777 } }
  });
  await response;
  await expect(
    dialog.getByPlaceholder("例如 919876543210（不含 + 号）")
  ).toHaveValue("15555550102");
  await expect(dialog.getByText("认证码登录成功", { exact: true })).toHaveCount(
    0
  );
});

test("ignores a delayed create after close and keeps a newer request pending", async ({
  page
}) => {
  const state = await setup(page);
  state.holdCreate = true;
  const dialog = await submit(page, "15555550101", true);
  await expect.poll(() => Boolean(state.pendingCreate)).toBe(true);
  const oldCreate = state.pendingCreate!;
  await dialog.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "认证码登录", exact: true }).click();
  await expect(
    dialog.getByPlaceholder("例如 919876543210（不含 + 号）")
  ).toHaveValue("");
  state.pendingCreate = null;
  await submit(page, "15555550102");
  await expect.poll(() => Boolean(state.pendingCreate)).toBe(true);
  const response = page.waitForResponse(response =>
    response.url().endsWith("/api/account-pairing-sessions")
  );
  await oldCreate.fulfill({
    json: {
      code: 0,
      data: {
        sessionId: 1,
        status: "REQUESTING",
        expiresAt: Date.now() + 90000
      }
    }
  });
  await response;
  await expect(
    dialog.getByText("正在向 WhatsApp 申请认证码", { exact: true })
  ).toBeVisible();
  await expect(dialog.getByText("当前手机号：15555550102")).toBeVisible();
  await state.pendingCreate!.fulfill({
    json: {
      code: 0,
      data: {
        sessionId: 2,
        status: "REQUESTING",
        expiresAt: Date.now() + 90000
      }
    }
  });
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
});

test("recovers a lost create response without another POST", async ({
  page
}) => {
  const state = await setup(page);
  state.failCreate = true;
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  expect(state.creates).toHaveLength(1);
  expect(state.recoveries).toBe(1);
});

test("keeps waiting when code generation takes longer than ten seconds", async ({
  page
}) => {
  const state = await setup(page);
  state.requesting = true;
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("正在向 WhatsApp 申请认证码", { exact: true })
  ).toBeVisible();
  await page.waitForTimeout(11000);
  await expect(
    dialog.getByText("正在向 WhatsApp 申请认证码", { exact: true })
  ).toBeVisible();
  state.requesting = false;
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  expect(state.creates).toHaveLength(1);
});

test("poll network failures remain unknown and resume the same session", async ({
  page
}) => {
  const state = await setup(page);
  state.failPoll = true;
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("配对状态待确认", { exact: true })
  ).toBeVisible();
  await expect(dialog.getByText("认证码登录失败", { exact: true })).toHaveCount(
    0
  );
  state.failPoll = false;
  await dialog.getByRole("button", { name: "继续查询", exact: true }).click();
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  expect(state.creates).toHaveLength(1);
});

test("shows a late success and refreshes the list after waiting for the result", async ({
  page
}) => {
  const state = await setup(page);
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  const reads = state.listReads;
  state.result = { status: "WAITING_CONFIRMATION", pairingCode: null };
  await expect(
    dialog.getByText("正在等待后台返回关联结果", { exact: true })
  ).toBeVisible();
  state.result = { status: "SUCCEEDED", accountId: 777, pairingCode: null };
  await expect(
    dialog.getByText("认证码登录成功", { exact: true })
  ).toBeVisible();
  await expect.poll(() => state.listReads).toBeGreaterThan(reads);
});

test("shows the backend failure reason", async ({ page }) => {
  const state = await setup(page);
  const dialog = await submit(page, "15555550101", true);
  await expect(
    dialog.getByText("等待主设备确认", { exact: true })
  ).toBeVisible();
  state.result = {
    status: "FAILED",
    errorMessage: "WhatsApp 配对失败，请重试",
    pairingCode: null
  };
  await expect(
    dialog.getByText("认证码登录失败", { exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByText("WhatsApp 配对失败，请重试", { exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "重新发起", exact: true })
  ).toBeVisible();
});

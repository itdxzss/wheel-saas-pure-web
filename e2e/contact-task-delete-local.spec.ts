import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1920, height: 1080 } });

/** 所有 API 请求由本地夹具拦截，不登录真实账号或删除真实任务。 */
async function setup(page: Page, canDelete = true, total = 5) {
  const permissions = ["view", "operate", ...(canDelete ? ["delete"] : [])].map(
    key => `tenant:contact_task:${key}`
  );
  const state = {
    deleted: [] as number[][],
    rows: Array.from({ length: total }, (_, index) => ({
      id: index + 1,
      name:
        index === 0
          ? "通讯录营销任务名称展示验证：这是一个用于验证长名称省略与悬浮提示的任务"
          : `测试任务 ${index + 1}`,
      messageType: 1,
      content: "测试消息",
      isEnabled: 1,
      runStatus: total === 5 ? index : 0,
      totalSendNum: 23,
      successMessageNum: 3,
      usedAccountCount: 3,
      invalidAccountNum: 0,
      avgSendPerAccount: 1,
      accountFilter: "{}",
      taskStartAt: 1788930000000
    }))
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
    const url = new URL(request.url());
    let data: unknown;
    if (url.pathname === "/api/tenant/me/menus") {
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
    } else if (url.pathname === "/api/contact-tasks/batch-delete") {
      const { ids } = request.postDataJSON();
      state.deleted.push(ids);
      state.rows = state.rows.filter(row => !ids.includes(row.id));
      data = ids.length;
    } else if (url.pathname === "/api/contact-tasks") {
      const current = Number(url.searchParams.get("page") ?? 1);
      const size = Number(url.searchParams.get("pageSize") ?? 20);
      data = {
        list: state.rows.slice((current - 1) * size, current * size),
        total: state.rows.length,
        page: current,
        pageSize: size
      };
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("/#/contact/hyperlink");
  await expect(
    page.locator(".el-table__body-wrapper tbody tr").first()
  ).toBeVisible();
  return state;
}

test("shows identity columns, selects allowed states, cancels and then deletes selected tasks", async ({
  page
}) => {
  const state = await setup(page);
  const remove = page.getByRole("button", { name: /批量删除/ });
  await expect(
    page.getByRole("columnheader", { name: "ID", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "任务名称", exact: true })
  ).toBeVisible();
  await expect(remove).toBeDisabled();
  const checkboxes = page.locator(
    ".el-table__body-wrapper tbody tr input[type=checkbox]"
  );
  await expect(checkboxes.nth(1)).toBeDisabled();
  await expect(checkboxes.nth(3)).toBeDisabled();
  await page.locator(".el-table__header-wrapper .el-checkbox").click();
  await expect(remove).toContainText("3");
  await remove.click();
  const confirm = page.getByRole("dialog", { name: "批量删除任务" });
  await confirm.getByRole("button", { name: "取消", exact: true }).click();
  await expect(confirm).toBeHidden();
  await expect(checkboxes.nth(0)).toBeChecked();
  await expect(checkboxes.nth(0)).toBeEnabled();
  expect(state.deleted).toEqual([]);
  await expect(remove).toContainText("3");
  await page.screenshot({
    path: "/tmp/contact-task-delete-list.png",
    fullPage: true
  });
  await remove.click();
  await confirm.getByRole("button", { name: "删除", exact: true }).click();
  await expect.poll(() => state.deleted).toEqual([[1, 3, 5]]);
  await expect(page.locator(".el-table__body-wrapper tbody tr")).toHaveCount(2);
  await expect(remove).toBeDisabled();
});

test("deleting the final row on page two returns to page one", async ({
  page
}) => {
  const state = await setup(page, true, 21);
  await page.locator(".el-pagination .btn-next").click();
  await expect(page.locator(".el-table__body-wrapper tbody tr")).toHaveCount(1);
  await page.locator(".el-table__body-wrapper .el-checkbox").click();
  await page.getByRole("button", { name: /批量删除/ }).click();
  await page
    .getByRole("dialog", { name: "批量删除任务" })
    .getByRole("button", { name: "删除", exact: true })
    .click();
  await expect.poll(() => state.deleted).toEqual([[21]]);
  await expect(page.locator(".el-table__body-wrapper tbody tr")).toHaveCount(
    20
  );
  await expect(page.locator(".el-pagination .number.is-active")).toHaveText(
    "1"
  );
});

test("view and operate permissions do not show the delete button", async ({
  page
}) => {
  await setup(page, false);
  await expect(page.getByRole("button", { name: /批量删除/ })).toHaveCount(0);
});

test("shared toolbar refreshes, changes density and columns, and enters fullscreen without a title", async ({
  page
}) => {
  await setup(page);
  const bar = page.locator(".contact-table-bar");
  await expect(bar.locator("p.font-bold")).toHaveText("");
  async function clickTool(name: string) {
    const targets = bar.locator("*");
    for (const target of await targets.all()) {
      const content = await target.evaluate(
        element =>
          (
            element as HTMLElement & {
              _tippy?: { props: { content: unknown } };
            }
          )._tippy?.props.content
      );
      if (content === name) {
        await target.click();
        return;
      }
    }
    throw new Error(`Missing toolbar tool: ${name}`);
  }
  const response = page.waitForResponse(
    response => new URL(response.url()).pathname === "/api/contact-tasks"
  );
  await clickTool("刷新");
  await response;
  await clickTool("密度");
  await page.getByRole("menuitem", { name: "紧凑" }).click();
  await expect(bar.locator(".el-table")).toHaveClass(/el-table--small/);
  await clickTool("列设置");
  await page
    .locator(".el-popover:visible .el-checkbox")
    .filter({ hasText: "任务名称" })
    .click();
  await expect(
    page.getByRole("columnheader", { name: "任务名称", exact: true })
  ).toHaveCount(0);
  await page.getByRole("button", { name: "重置", exact: true }).last().click();
  await expect(
    page.getByRole("columnheader", { name: "任务名称", exact: true })
  ).toBeVisible();
  await clickTool("全屏");
  await expect(bar).toHaveCSS("position", "fixed");
  await clickTool("退出全屏");
  await expect(bar).not.toHaveCSS("position", "fixed");
});

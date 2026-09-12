import { test, expect, type Page } from "@playwright/test";
import type { ScriptDefinition } from "../src/api/script-library";

async function setup(page: Page, count = 3) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined });
    const session = {
      accessToken: "local-fixture",
      expires: Date.now() + 3600000,
      refreshToken: "",
      roles: ["admin"],
      permissions: ["view", "create", "edit"].map(
        key => `tenant:script_marketing:${key}`
      ),
      username: "local-test",
      nickname: "页面验证"
    };
    localStorage.setItem("user-info", JSON.stringify(session));
    document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
    document.cookie = "multiple-tabs=true; path=/";
  });
  let definition: ScriptDefinition = {
    id: 901,
    name: "日常互动剧本",
    enabled: true,
    updatedAt: Date.now(),
    steps: Array.from({ length: count }, (_, i) => ({
      role: i === 0 ? "ADMIN" : "PROMOTER",
      roleKey: i === 0 ? "管理员" : "推手1",
      accountId: null,
      waitMinSeconds: 10,
      waitMaxSeconds: 20,
      message: {
        templateName: "",
        content: `消息 ${i + 1}：欢迎大家交流，今天分享一份使用心得。`,
        linkMode: 1,
        bodyText: "",
        promotionLink: "",
        imageFileId: null,
        buttons: [],
        mentionAll: false
      }
    }))
  };
  let writes = 0;
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    let data: unknown;
    if (path === "/api/tenant/me/menus")
      data = [
        {
          path: "/group-maintenance",
          name: "GroupMaintenance",
          meta: { title: "养群管理" },
          children: [
            {
              path: "/group-maintenance/scripts",
              name: "ScriptDefinitionLibrary",
              component: "task/script-definition/index",
              meta: { title: "养群剧本", auths: [] }
            }
          ]
        }
      ];
    else if (path === "/api/script-definitions/901") {
      if (request.method() === "PUT") {
        definition = { ...definition, ...request.postDataJSON() };
        writes++;
      }
      data = definition;
    } else if (path === "/api/script-definitions")
      data = { list: [definition], total: 1 };
    else if (path === "/api/script-materials")
      data = {
        list: [
          {
            id: 902,
            templateName: "图片素材",
            content: "",
            linkMode: 3,
            imageFileId: 88,
            buttons: [],
            mentionAll: false
          }
        ],
        total: 1
      };
    else return route.abort();
    return route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto("http://127.0.0.1:5194/#/group-maintenance/scripts");
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "编辑养群剧本" });
  await expect(drawer.locator(".message-card")).toHaveCount(count);
  return { drawer, errors, saved: () => definition, writes: () => writes };
}

test("roles, selection, ordering, defaults and content round-trip through the save contract", async ({
  page
}) => {
  const state = await setup(page);
  const { drawer } = state;
  const inspector = drawer.locator(".inspector-pane");
  const cards = drawer.locator(".message-card");
  const roles = drawer.locator(".role-card");
  await roles.nth(1).getByRole("textbox").fill("体验分享");
  await roles.nth(1).getByRole("textbox").press("Tab");
  await expect(cards.nth(1)).toContainText("体验分享");
  await expect(cards.nth(2)).toContainText("体验分享");
  await roles.nth(1).getByRole("textbox").fill("管理员");
  await roles.nth(1).getByRole("textbox").press("Tab");
  await expect(
    page.getByText("角色名称不能重复", { exact: true })
  ).toBeVisible();
  await expect(roles.nth(1).getByRole("textbox")).toHaveValue("体验分享");
  await drawer
    .getByRole("button", { name: "编辑第 2 条消息", exact: true })
    .click();
  await inspector
    .getByRole("textbox", { name: /消息内容$/ })
    .fill("第二句独立编辑");
  await cards.nth(1).getByRole("button", { name: "复制", exact: true }).click();
  await expect(cards).toHaveCount(4);
  await expect(inspector).toContainText("第 3 句 · 体验分享");
  await inspector
    .getByRole("textbox", { name: /消息内容$/ })
    .fill("复制后修改");
  await inspector.getByText("按钮消息", { exact: true }).click();
  await inspector.getByPlaceholder("按钮文字").fill("了解详情");
  await inspector
    .getByPlaceholder("链接或复制内容")
    .fill("https://example.com");
  await inspector.getByText("预览", { exact: true }).click();
  await expect(inspector.locator(".message-preview")).toContainText("了解详情");
  await cards.nth(2).getByRole("button", { name: "上移第 3 条消息" }).click();
  await expect(cards.nth(1)).toContainText("复制后修改");
  await expect(cards.nth(2)).toContainText("第二句独立编辑");
  await drawer
    .getByRole("button", { name: "编辑第 2 条消息", exact: true })
    .click();
  await cards.nth(1).getByRole("button", { name: "插入", exact: true }).click();
  await expect(inspector).toContainText("第 3 句 · 体验分享");
  await inspector.getByRole("textbox", { name: /消息内容$/ }).fill("中间插入");
  await drawer.getByRole("spinbutton", { name: "默认最小等待秒数" }).fill("5");
  await drawer.getByRole("spinbutton", { name: "默认最大等待秒数" }).fill("8");
  await drawer
    .getByRole("spinbutton", { name: "默认最大等待秒数" })
    .press("Tab");
  await expect(cards.nth(2)).toContainText("等待 5–8 秒");
  await expect(cards.nth(1)).toContainText("等待 10–20 秒");
  await drawer.getByRole("button", { name: "应用到全部", exact: true }).click();
  await page
    .getByRole("dialog", { name: "应用到全部消息" })
    .getByRole("button", { name: "应用到全部", exact: true })
    .click();
  await expect(cards.nth(1)).toContainText("等待 5–8 秒");
  await cards.nth(4).getByRole("button", { name: "删除", exact: true }).click();
  await drawer.getByRole("button", { name: "保存剧本", exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(state.saved().steps.map(step => step.message.content)).toEqual([
    "消息 1：欢迎大家交流，今天分享一份使用心得。",
    "复制后修改",
    "中间插入",
    "第二句独立编辑"
  ]);
  expect(state.saved().steps.map(step => step.roleKey)).toEqual([
    "管理员",
    "体验分享",
    "体验分享",
    "体验分享"
  ]);
  expect(
    state
      .saved()
      .steps.every(
        step =>
          step.accountId === null &&
          step.waitMinSeconds === 5 &&
          step.waitMaxSeconds === 8 &&
          !("key" in step)
      )
  ).toBe(true);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await expect(cards).toHaveCount(4);
  await drawer
    .getByRole("button", { name: "编辑第 2 条消息", exact: true })
    .click();
  await expect(inspector.getByPlaceholder("按钮文字")).toHaveValue("了解详情");
  expect(state.errors).toEqual([]);
});

test("100 messages keep the editor and save action visible, and sorting preserves selected content", async ({
  page
}, testInfo) => {
  const { drawer, errors } = await setup(page, 100);
  const cards = drawer.locator(".message-card");
  await expect(
    drawer.getByRole("button", { name: "+ 对话", exact: true })
  ).toBeDisabled();
  await expect(
    cards.first().getByRole("button", { name: "复制", exact: true })
  ).toBeDisabled();
  await drawer
    .getByRole("button", { name: "编辑第 100 条消息", exact: true })
    .click();
  const inspector = drawer.locator(".inspector-pane");
  await expect(
    inspector.getByRole("textbox", { name: /消息内容$/ })
  ).toHaveValue(/消息 100/);
  await cards.last().getByRole("button", { name: "上移第 100 条消息" }).click();
  await expect(inspector).toContainText("第 99 句 · 推手1");
  await expect(
    inspector.getByRole("textbox", { name: /消息内容$/ })
  ).toHaveValue(/消息 100/);
  await expect(
    drawer.getByRole("button", { name: "保存剧本", exact: true })
  ).toBeInViewport();
  const body = drawer.locator(".el-drawer__body");
  expect(
    await body.evaluate(el => el.scrollHeight <= el.clientHeight + 1)
  ).toBe(true);
  expect(
    await drawer
      .locator(".timeline-list")
      .evaluate(el => el.scrollHeight > el.clientHeight)
  ).toBe(true);
  await drawer
    .getByRole("button", { name: "编辑第 1 条消息", exact: true })
    .click();
  await cards.nth(1).locator(".drag-handle").dragTo(cards.nth(2));
  await expect(cards.nth(2)).toContainText("消息 2：");
  await page.screenshot({
    path: testInfo.outputPath("composer-desktop.png"),
    animations: "disabled"
  });
  for (const width of [1100, 900, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      drawer.getByRole("button", { name: "保存剧本", exact: true })
    ).toBeInViewport();
    expect(
      await drawer.evaluate(el => el.scrollWidth <= el.clientWidth + 1)
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("role reuse, deletion and validation focus the right message", async ({
  page
}) => {
  const { drawer, writes, errors } = await setup(page);
  const roles = drawer.locator(".role-card");
  const cards = drawer.locator(".message-card");
  const inspector = drawer.locator(".inspector-pane");
  await drawer.getByRole("button", { name: "+ 角色", exact: true }).click();
  await page.getByRole("menuitem", { name: "添加推手角色" }).click();
  await expect(roles).toHaveCount(3);
  await roles
    .last()
    .getByRole("button", { name: "+ 以此角色添加消息" })
    .click();
  await expect(cards).toHaveCount(4);
  await expect(inspector).toContainText("第 4 句 · 推手2");
  await drawer
    .getByRole("button", { name: "编辑第 1 条消息", exact: true })
    .click();
  await drawer.getByRole("button", { name: "保存剧本", exact: true }).click();
  await expect(inspector).toContainText("第 4 句 · 推手2");
  expect(writes()).toBe(0);
  await inspector
    .getByRole("textbox", { name: /消息内容$/ })
    .fill("新角色发言");
  await inspector
    .locator(".el-form-item")
    .filter({ hasText: "发言角色" })
    .locator(".el-select")
    .click();
  await page.getByRole("option", { name: "推手1 推手", exact: true }).click();
  await expect(roles.last()).toContainText("0 句");
  await roles
    .last()
    .getByRole("button", { name: "删除角色 推手2", exact: true })
    .click();
  await expect(roles).toHaveCount(2);
  await cards.last().getByRole("button", { name: "删除", exact: true }).click();
  await expect(inspector).toContainText("第 3 句 · 推手1");
  await expect(
    cards.first().getByRole("button", { name: "删除", exact: true })
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("quoted replies round-trip, locate originals, and protect message ordering", async ({
  page
}, testInfo) => {
  const state = await setup(page);
  const { drawer } = state;
  const inspector = drawer.locator(".inspector-pane");
  const cards = drawer.locator(".message-card");
  const reply = inspector.getByRole("combobox", { name: "回复哪一句" });
  await expect(reply).toBeDisabled();
  await drawer
    .getByRole("button", { name: "编辑第 3 条消息", exact: true })
    .click();
  await reply.click();
  await page.getByRole("option", { name: /第 2 句/ }).click();
  await expect(cards.nth(2).locator(".reply-quote")).toContainText("第 2 句");
  await page.screenshot({
    path: testInfo.outputPath("quoted-reply-editor.png"),
    animations: "disabled"
  });
  await expect(
    cards.nth(1).getByRole("button", { name: "删除", exact: true })
  ).toBeDisabled();
  await cards.nth(2).getByRole("button", { name: "上移第 3 条消息" }).click();
  await expect(cards.nth(2)).toContainText("消息 3：");
  await cards.nth(2).locator(".reply-quote button").click();
  await expect(inspector).toContainText("第 2 句 · 推手1");
  await drawer
    .getByRole("button", { name: "编辑第 3 条消息", exact: true })
    .click();
  await inspector.getByText("预览", { exact: true }).click();
  await expect(inspector.locator(".reply-quote:visible")).toContainText(
    "消息 2："
  );
  await page.screenshot({
    path: testInfo.outputPath("quoted-reply-desktop.png"),
    animations: "disabled"
  });
  await drawer.getByRole("button", { name: "保存剧本", exact: true }).click();
  await expect(drawer).toBeHidden();
  const saved = state.saved().steps;
  expect(saved[2].replyToStepId).toBe(saved[1].stepId);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await drawer
    .getByRole("button", { name: "编辑第 3 条消息", exact: true })
    .click();
  await expect(
    inspector
      .locator(".el-select")
      .filter({ has: page.getByRole("combobox", { name: "回复哪一句" }) })
  ).toContainText("第 2 句");
  await reply.click();
  await page
    .getByRole("option", { name: "不指定（普通消息）", exact: true })
    .click();
  await expect(cards.nth(2).locator(".reply-quote")).toHaveCount(0);
  await expect(
    cards.nth(1).getByRole("button", { name: "删除", exact: true })
  ).toBeEnabled();
  expect(state.errors).toEqual([]);
});

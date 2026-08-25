import { expect, type Page, type Response } from "@playwright/test";
import { resolveLoginCredentials, type LoginCredentials } from "./environment";
import { clearLoginFields } from "./privacy";

interface ArmadaEnvelope {
  code?: number;
  message?: string;
  data?: unknown;
}

export interface LoginOptions {
  localCredentials?: LoginCredentials;
}

export interface SmokeRoute {
  path: string;
  title: string;
}

interface MenuNode {
  path?: unknown;
  route_path?: unknown;
  component?: unknown;
  view_path?: unknown;
  name?: unknown;
  meta?: {
    title?: unknown;
    showLink?: unknown;
    show_link?: unknown;
  };
  children?: unknown;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

async function readEnvelope(
  response: Response,
  label: string
): Promise<ArmadaEnvelope> {
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error(`${label} 未返回 JSON 对象`);
  }
  return payload as ArmadaEnvelope;
}

/** 使用测试账号登录，并等待真实租户菜单装配完成。 */
export async function loginAsTestUser(
  page: Page,
  options: LoginOptions = {}
): Promise<unknown[]> {
  const { username, password } = resolveLoginCredentials(
    options.localCredentials
  );
  const configuredCaptcha = optionalEnv("ARMADA_E2E_CAPTCHA_CODE");

  try {
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("用户名").fill(username);
    await page.getByPlaceholder("密码").fill(password);

    const captcha = page.getByPlaceholder("图片验证码");
    const captchaVisible = await captcha
      .isVisible({ timeout: 1_000 })
      .catch(() => false);
    if (captchaVisible) {
      if (!configuredCaptcha) {
        throw new Error("页面要求验证码，但缺少 ARMADA_E2E_CAPTCHA_CODE");
      }
      await captcha.fill(configuredCaptcha);
    }

    const loginResponsePromise = page.waitForResponse(
      response =>
        response.url().includes("/api/public/auth/login") &&
        response.request().method() === "POST",
      { timeout: 20_000 }
    );
    const menusResponsePromise = page.waitForResponse(
      response =>
        response.url().includes("/api/tenant/me/menus") &&
        response.request().method() === "GET",
      { timeout: 20_000 }
    );
    // 登录失败时菜单响应不会出现，先挂 rejection handler 避免超时成为未处理 Promise。
    void menusResponsePromise.catch(() => undefined);

    await page.getByRole("button", { name: "登录", exact: true }).click();
    const loginPayload = await readEnvelope(
      await loginResponsePromise,
      "登录接口"
    );
    expect(loginPayload.code, loginPayload.message ?? "登录失败").toBe(0);

    const menusPayload = await readEnvelope(
      await menusResponsePromise,
      "租户菜单接口"
    );
    expect(menusPayload.code, menusPayload.message ?? "租户菜单加载失败").toBe(
      0
    );
    expect(Array.isArray(menusPayload.data), "租户菜单 data 必须是数组").toBe(
      true
    );

    await expect(page).not.toHaveURL(/#\/login(?:$|[/?])/);
    await expect(page.locator(".app-wrapper")).toBeVisible();
    return menusPayload.data as unknown[];
  } finally {
    await clearLoginFields(page);
  }
}

function asMenuNode(value: unknown): MenuNode | null {
  return value && typeof value === "object" ? (value as MenuNode) : null;
}

function routePath(node: MenuNode): string | null {
  const value =
    typeof node.path === "string"
      ? node.path
      : typeof node.route_path === "string"
        ? node.route_path
        : null;
  if (!value?.startsWith("/") || /[:*]/.test(value)) return null;
  return value;
}

function collectMenuRoutes(nodes: unknown[], result: SmokeRoute[]): void {
  for (const value of nodes) {
    const node = asMenuNode(value);
    if (!node) continue;
    const children = Array.isArray(node.children) ? node.children : [];
    if (children.length > 0) {
      collectMenuRoutes(children, result);
      continue;
    }

    const path = routePath(node);
    const hasComponent =
      typeof node.component === "string" || typeof node.view_path === "string";
    const hidden =
      node.meta?.showLink === false || node.meta?.show_link === false;
    if (
      !path ||
      !hasComponent ||
      hidden ||
      /\/(create|edit|detail)(\/|$)/.test(path)
    ) {
      continue;
    }
    const title =
      typeof node.meta?.title === "string"
        ? node.meta.title
        : typeof node.name === "string"
          ? node.name
          : path;
    result.push({ path, title });
  }
}

const preferredReadOnlyPaths = [
  "/account/index",
  "/account/group/index",
  "/group/list",
  "/task/pull",
  "/task/join",
  "/task/group-marketing",
  "/resource/ip"
];

/** 从当前账号的真实菜单中选择 3–5 个只读页面；也可由环境变量显式指定。 */
export function resolveSmokeRoutes(menuPayload: unknown[]): SmokeRoute[] {
  const available: SmokeRoute[] = [];
  collectMenuRoutes(menuPayload, available);
  const byPath = new Map(available.map(route => [route.path, route]));
  const configured = process.env.ARMADA_E2E_SMOKE_ROUTES?.split(",")
    .map(path => path.trim())
    .filter(Boolean);

  if (configured?.length && (configured.length < 3 || configured.length > 5)) {
    throw new Error("ARMADA_E2E_SMOKE_ROUTES 必须恰好包含 3–5 个路由");
  }
  const unknownConfiguredRoute = configured?.find(
    path => path !== "/welcome" && !byPath.has(path)
  );
  if (unknownConfiguredRoute) {
    throw new Error(
      `ARMADA_E2E_SMOKE_ROUTES 包含当前账号菜单外的路由：${unknownConfiguredRoute}`
    );
  }

  const selected = configured?.length
    ? configured.map(path =>
        path === "/welcome"
          ? { path, title: "首页" }
          : (byPath.get(path) as SmokeRoute)
      )
    : [
        { path: "/welcome", title: "首页" },
        ...preferredReadOnlyPaths
          .map(path => byPath.get(path))
          .filter((route): route is SmokeRoute => Boolean(route)),
        ...available
      ];
  const unique = Array.from(
    new Map(selected.map(route => [route.path, route])).values()
  ).slice(0, 5);

  if (unique.length < 3) {
    throw new Error(
      `当前账号只能解析出 ${unique.length} 个 smoke 页面，至少需要 3 个；` +
        "可通过 ARMADA_E2E_SMOKE_ROUTES 指定 3–5 个已授权只读路由"
    );
  }
  return unique;
}

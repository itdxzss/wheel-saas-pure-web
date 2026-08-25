import {
  expect,
  test,
  type Page,
  type Request,
  type TestInfo
} from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  loginAsTestUser,
  resolveSmokeRoutes,
  type SmokeRoute
} from "./support/auth";
import {
  markSensitiveScreenshotContent,
  takeMaskedScreenshot
} from "./support/privacy";
import { apiFailures, isAllowedSmokeRequest } from "./support/smoke-policy";

interface NetworkRecord {
  method: string;
  resourceType: string;
  url: string;
  status: number | null;
  businessCode?: number;
  businessMessage?: string;
  failure?: string;
}

interface BrowserEvidence {
  consoleErrors: string[];
  network: NetworkRecord[];
  responseTasks: Promise<void>[];
  pendingApiRequests: Map<Request, string>;
  lastApiActivityAt: number;
  blockedWrites: string[];
  trace: TraceRecord[];
}

interface TraceRecord {
  stage: string;
  status: "PASS" | "FAIL";
  startedAt: string;
  durationMs: number;
  url?: string;
  error?: string;
}

// Playwright 原生 trace 会保存认证 Cookie；改存脱敏步骤 trace，避免 token 进入产物。
test.use({ trace: "off" });
test.setTimeout(240_000);

const errorPageUrl =
  /#\/(?:login|access-denied|server-error|error(?:\/(?:403|404|500))?)(?:[/?]|$)/i;
const errorPageMessages = [
  "抱歉，你无权访问该页面",
  "抱歉，你访问的页面不存在",
  "抱歉，服务器出错了"
];

function urlPathname(raw: string): string | null {
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.pathname : null;
  } catch {
    return null;
  }
}

/** 证据只保留路径/Hash，不记录环境域名、IP、query 或 fragment 参数。 */
function sanitizedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const hashPath = url.hash.match(/^#(\/[^?]*)/)?.[1];
    return hashPath ? `${url.pathname}#${hashPath}` : url.pathname;
  } catch {
    return null;
  }
}

function redact(value: string): string {
  let redacted = value
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(
      /(password|secret|token|authorization|credential|api[-_]?key)(["']?\s*[:=]\s*["']?)[^,\s"']+/gi,
      "$1$2[REDACTED]"
    )
    .replace(/\b\d{5,}(?::\d+)?@(?:s\.whatsapp\.net|g\.us)\b/gi, "[JID]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]")
    .replace(/\+?\d(?:[\s().-]*\d){8,}/g, "[PHONE]")
    .replace(/https?:\/\/(?:\[[^\]]+\]|[^/\s]+)(?=\/|\s|$)/gi, "[ORIGIN]");
  for (const secret of [
    process.env.ARMADA_E2E_PASSWORD,
    process.env.ARMADA_E2E_USERNAME,
    process.env.ARMADA_E2E_CAPTCHA_CODE
  ]) {
    if (secret) redacted = redacted.split(secret).join("[REDACTED]");
  }
  return redacted;
}

function isApiRequest(request: Request): boolean {
  return urlPathname(request.url())?.startsWith("/api/") ?? false;
}

function finishApiRequest(evidence: BrowserEvidence, request: Request): void {
  if (!evidence.pendingApiRequests.delete(request)) return;
  evidence.lastApiActivityAt = Date.now();
}

function captureEvidence(page: Page): BrowserEvidence {
  const evidence: BrowserEvidence = {
    consoleErrors: [],
    network: [],
    responseTasks: [],
    pendingApiRequests: new Map(),
    lastApiActivityAt: Date.now(),
    blockedWrites: [],
    trace: []
  };
  page.on("console", message => {
    if (message.type() === "error") {
      evidence.consoleErrors.push(redact(message.text()));
    }
  });
  page.on("pageerror", error => {
    evidence.consoleErrors.push(redact(error.message));
  });
  page.on("request", request => {
    if (!isApiRequest(request)) return;
    evidence.pendingApiRequests.set(
      request,
      `${request.method()} ${sanitizedUrl(request.url()) ?? "[invalid-url]"}`
    );
    evidence.lastApiActivityAt = Date.now();
  });
  page.on("requestfinished", request => {
    finishApiRequest(evidence, request);
  });
  page.on("requestfailed", request => {
    finishApiRequest(evidence, request);
    const url = sanitizedUrl(request.url());
    if (!url) return;
    evidence.network.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url,
      status: null,
      failure: redact(request.failure()?.errorText ?? "request failed")
    });
  });
  page.on("response", response => {
    const url = sanitizedUrl(response.url());
    if (!url) return;
    const record: NetworkRecord = {
      method: response.request().method(),
      resourceType: response.request().resourceType(),
      url,
      status: response.status()
    };
    evidence.network.push(record);
    if (!urlPathname(response.url())?.startsWith("/api/")) return;
    const task = response
      .json()
      .then((payload: unknown) => {
        if (!payload || typeof payload !== "object") return;
        const envelope = payload as { code?: unknown; message?: unknown };
        if (typeof envelope.code === "number") {
          record.businessCode = envelope.code;
        }
        if (typeof envelope.message === "string") {
          record.businessMessage = redact(envelope.message);
        }
      })
      .catch(() => undefined);
    evidence.responseTasks.push(task);
  });
  return evidence;
}

async function waitForApiStability(
  page: Page,
  evidence: BrowserEvidence,
  navigationStartedAt: number
): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    await settleEvidence(evidence);
    const loadingCount = await page.locator(".el-loading-mask:visible").count();
    const idleSince = Math.max(navigationStartedAt, evidence.lastApiActivityAt);
    if (
      evidence.pendingApiRequests.size === 0 &&
      loadingCount === 0 &&
      Date.now() - idleSince >= 750
    ) {
      return;
    }
    await page.waitForTimeout(100);
  }

  const pending = Array.from(evidence.pendingApiRequests.values()).map(redact);
  throw new Error(
    `页面关键 API 在 15 秒内未稳定；pending=${JSON.stringify(pending)}`
  );
}

async function assertNotErrorPage(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(errorPageUrl);
  for (const message of errorPageMessages) {
    await expect(page.getByText(message, { exact: true })).toHaveCount(0);
  }
}

async function settleEvidence(evidence: BrowserEvidence): Promise<void> {
  let settled = 0;
  while (settled < evidence.responseTasks.length) {
    const pending = evidence.responseTasks.slice(settled);
    settled = evidence.responseTasks.length;
    await Promise.allSettled(pending);
  }
}

function screenshotName(index: number, route: SmokeRoute): string {
  const suffix = route.path.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-");
  return `${String(index + 1).padStart(2, "0")}-${suffix || "home"}.png`;
}

async function attachJson(
  testInfo: TestInfo,
  name: string,
  value: unknown
): Promise<void> {
  const path = testInfo.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
  await testInfo.attach(name, {
    path,
    contentType: "application/json"
  });
}

async function recordStep<T>(
  evidence: BrowserEvidence,
  page: Page,
  stage: string,
  action: () => Promise<T>
): Promise<T> {
  const startedAt = new Date();
  try {
    const result = await action();
    evidence.trace.push({
      stage,
      status: "PASS",
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      url: sanitizedUrl(page.url()) ?? undefined
    });
    return result;
  } catch (error) {
    const sanitizedError = redact(
      error instanceof Error ? error.message : String(error)
    );
    evidence.trace.push({
      stage,
      status: "FAIL",
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      url: sanitizedUrl(page.url()) ?? undefined,
      error: sanitizedError
    });
    // 丢弃 Playwright matcher 附带的未脱敏 ariaSnapshot，只传播脱敏文本。
    throw new Error(sanitizedError);
  }
}

test("smoke 截图会遮罩敏感列和值", async ({ page }) => {
  await page.setContent(`
    <table>
      <thead>
        <tr>
          <th>手机号</th><th>凭据</th><th>password</th><th>secret</th>
          <th>token</th><th>Resource</th><th>IP</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>8613912345678</td><td>credential-value</td><td>password-value</td>
          <td>secret-value</td><td>token-value</td><td>resource-42</td>
          <td>10.20.30.40</td>
        </tr>
      </tbody>
    </table>
    <input type="password" value="should-not-appear" />
    <span id="jid">8613912345678@s.whatsapp.net</span>
    <span class="el-dropdown-link navbar-bg-hover">
      <span id="current-user">staging-smoke-user</span>
    </span>
  `);

  await markSensitiveScreenshotContent(page, ["staging-smoke-user"]);
  const maskedCells = page.locator('tbody td[data-armada-e2e-mask="true"]');
  await expect(maskedCells).toHaveCount(7);
  await expect(page.locator('input[type="password"]')).toHaveAttribute(
    "data-armada-e2e-mask",
    "true"
  );
  await expect(page.locator("#jid")).toHaveAttribute(
    "data-armada-e2e-mask",
    "true"
  );
  await expect(
    page.locator(".el-dropdown-link.navbar-bg-hover")
  ).toHaveAttribute("data-armada-e2e-mask", "true");
  await expect(page.locator("#current-user")).toHaveAttribute(
    "data-armada-e2e-mask",
    "true"
  );
});

test("test1 登录与只读页面 smoke", async ({ page }, testInfo) => {
  const evidence = captureEvidence(page);
  let routes: SmokeRoute[] = [];

  try {
    await page.route("**/api/**", async route => {
      const request = route.request();
      const method = request.method();
      if (isAllowedSmokeRequest(method, request.url())) {
        await route.continue();
        return;
      }
      const url = sanitizedUrl(request.url()) ?? "[invalid-url]";
      evidence.blockedWrites.push(`${method} ${url}`);
      await route.abort("blockedbyclient");
    });

    const loginStage = "登录并装配真实租户菜单";
    const menus = await test.step(loginStage, () =>
      recordStep(evidence, page, loginStage, async () => {
        if (!process.env.ARMADA_E2E_BASE_URL?.trim()) {
          throw new Error("缺少必需环境变量 ARMADA_E2E_BASE_URL");
        }
        return loginAsTestUser(page);
      })
    );
    routes = resolveSmokeRoutes(menus);
    await attachJson(testInfo, "smoke-routes", routes);

    for (const [index, route] of routes.entries()) {
      const stage = `${index + 1}/${routes.length} ${route.title} ${route.path}`;
      await test.step(stage, () =>
        recordStep(evidence, page, stage, async () => {
          const networkStart = evidence.network.length;
          const consoleStart = evidence.consoleErrors.length;
          const writeStart = evidence.blockedWrites.length;
          const navigationStartedAt = Date.now();
          await page.goto(`/#${route.path}`, { waitUntil: "domcontentloaded" });
          await assertNotErrorPage(page);
          await expect(page.locator(".app-wrapper")).toBeVisible();
          await waitForApiStability(page, evidence, navigationStartedAt);
          await assertNotErrorPage(page);

          expect(
            apiFailures(evidence.network.slice(networkStart)),
            `${route.path} 出现 API 失败`
          ).toEqual([]);
          expect(
            evidence.consoleErrors.slice(consoleStart),
            `${route.path} 出现 console/page error`
          ).toEqual([]);
          expect(
            evidence.blockedWrites.slice(writeStart),
            `${route.path} 尝试发起非只读 API 请求`
          ).toEqual([]);

          const screenshotPath = testInfo.outputPath(
            screenshotName(index, route)
          );
          await takeMaskedScreenshot(page, screenshotPath, [
            process.env.ARMADA_E2E_USERNAME ?? ""
          ]);
          await testInfo.attach(`page-${index + 1}-${route.title}`, {
            path: screenshotPath,
            contentType: "image/png"
          });
        })
      );
    }

    await settleEvidence(evidence);
    expect(apiFailures(evidence.network), "整次 smoke 出现 API 失败").toEqual(
      []
    );
    expect(
      evidence.consoleErrors,
      "整次 smoke 出现 console/page error"
    ).toEqual([]);
    expect(
      evidence.blockedWrites,
      "整次 smoke 尝试发起非只读 API 请求"
    ).toEqual([]);
  } finally {
    await settleEvidence(evidence);
    await attachJson(testInfo, "trace", evidence.trace);
    await attachJson(testInfo, "console-errors", evidence.consoleErrors);
    await attachJson(testInfo, "network", evidence.network);
    await attachJson(testInfo, "blocked-writes", evidence.blockedWrites);
    if (routes.length > 0) await attachJson(testInfo, "visited-routes", routes);
  }
});

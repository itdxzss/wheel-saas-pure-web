import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./support/auth";
import {
  markSensitiveScreenshotContent,
  takeMaskedScreenshot
} from "./support/privacy";

const sentinel = process.env.ARMADA_E2E_ARTIFACT_REDACTION_SENTINEL;
const expectedFailureMarker =
  process.env.ARMADA_E2E_ARTIFACT_REDACTION_FAILURE_MARKER;
test.skip(
  !sentinel || !expectedFailureMarker,
  "仅由 test:e2e:artifact-redaction 启动"
);

test("失败报告与截图不复制登录凭据", async ({ page }, testInfo) => {
  if (!sentinel || !expectedFailureMarker) {
    throw new Error("脱敏探针配置缺失");
  }

  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() === "document") {
      await route.fulfill({
        headers: { "content-type": "text/html; charset=utf-8" },
        body: `
          <input placeholder="用户名" />
          <input placeholder="密码" type="password" />
          <button type="button">登录</button>
          <span class="el-dropdown-link navbar-bg-hover">
            <span id="current-user"></span>
          </span>
          <span id="explicit-user"></span>
          <script>
            document.querySelector("button").addEventListener("click", () => {
              void fetch("/api/public/auth/login", { method: "POST" });
            });
          </script>
        `
      });
      return;
    }
    if (url.pathname === "/api/public/auth/login") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ code: 401, message: "expected login failure" })
      });
      return;
    }
    await route.abort("blockedbyclient");
  });

  let loginRejected = false;
  try {
    await loginAsTestUser(page);
  } catch {
    loginRejected = true;
  }
  expect(loginRejected).toBe(true);
  // loginAsTestUser 的 finally 必须在报告采集前清空异常页上的真实凭据。
  await page.locator("#current-user").evaluate((element, value) => {
    element.textContent = value;
  }, sentinel);
  await page.locator("#explicit-user").evaluate((element, value) => {
    element.textContent = value;
  }, sentinel);

  await expect(page.getByPlaceholder("用户名")).toHaveValue("");
  await expect(page.getByPlaceholder("密码")).toHaveValue("");

  await markSensitiveScreenshotContent(page, [sentinel]);
  await expect(
    page.locator(".el-dropdown-link.navbar-bg-hover")
  ).toHaveAttribute("data-armada-e2e-mask", "true");
  await expect(page.locator("#explicit-user")).toHaveAttribute(
    "data-armada-e2e-mask",
    "true"
  );

  const screenshotPath = testInfo.outputPath("masked-page.png");
  await takeMaskedScreenshot(page, screenshotPath, [sentinel]);
  await testInfo.attach("masked-page", {
    path: screenshotPath,
    contentType: "image/png"
  });

  // 模拟 smoke 的错误包装：丢弃 locator matcher 自带的未脱敏 ariaSnapshot。
  try {
    await expect(page.locator("#intentionally-missing")).toBeVisible({
      timeout: 100
    });
  } catch {
    throw new Error(expectedFailureMarker);
  }
  throw new Error("脱敏探针的 matcher 意外通过");
});

import { defineConfig } from "@playwright/test";

// Playwright 1.62 的失败辅助会额外生成未脱敏的 aria page snapshot。
// Smoke 自己保留脱敏证据，禁止把真实页面文本复制到 error-context.md。
process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";

const browserChannel = process.env.ARMADA_E2E_BROWSER_CHANNEL?.trim();
const artifactRedactionProbe = Boolean(
  process.env.ARMADA_E2E_ARTIFACT_REDACTION_SENTINEL
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["line"],
    [
      "html",
      {
        outputFolder: artifactRedactionProbe
          ? "playwright-report/artifact-redaction"
          : "playwright-report",
        open: "never"
      }
    ]
  ],
  outputDir: artifactRedactionProbe
    ? "test-results/artifact-redaction"
    : "test-results",
  use: {
    baseURL: process.env.ARMADA_E2E_BASE_URL ?? "http://127.0.0.1:8848",
    browserName: "chromium",
    ...(browserChannel ? { channel: browserChannel } : {}),
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    ignoreHTTPSErrors: process.env.ARMADA_E2E_IGNORE_HTTPS_ERRORS === "true",
    // 真实登录态的原生 trace / 自动截图会携带 Cookie 或未遮罩页面数据。
    trace: "off",
    screenshot: "off",
    viewport: { width: 1440, height: 1000 }
  }
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["line"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  outputDir: "test-results",
  use: {
    baseURL: process.env.ARMADA_E2E_BASE_URL ?? "http://127.0.0.1:8848",
    browserName: "chromium",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 1000 }
  }
});

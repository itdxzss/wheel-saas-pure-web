import { defineConfig } from "@playwright/test";

/** 本地新页面验收，测试拦截全部业务 API，不需要业务账号或后端。 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "script-marketing-local.spec.ts",
  timeout: 45000,
  use: {
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1080 }
  },
  outputDir: "test-results/script-marketing",
  reporter: "list",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5194",
    url: "http://127.0.0.1:5194",
    reuseExistingServer: true
  }
});

import { defineConfig } from "@playwright/test";

/** 本地浏览器交互使用合成夹具，真实SQL/事务由后端H2套件验证。 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "group-data-package-local.spec.ts",
  timeout: 45_000,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "test-results/group-data-package",
  use: {
    baseURL: "http://127.0.0.1:5199",
    channel: "chrome",
    headless: true,
    actionTimeout: 10_000,
    viewport: { width: 1600, height: 1000 }
  },
  webServer: {
    command: "node_modules/.bin/vite --host 127.0.0.1 --port 5199 --strictPort",
    url: "http://127.0.0.1:5199",
    env: { CHOKIDAR_USEPOLLING: "1", CHOKIDAR_INTERVAL: "1000" },
    reuseExistingServer: false
  }
});

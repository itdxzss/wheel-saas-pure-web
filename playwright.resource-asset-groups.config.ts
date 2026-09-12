import { defineConfig } from "@playwright/test";

/** 本地素材分组交互验收：全部业务 API 使用测试夹具。 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "resource-asset-groups-local.spec.ts",
  timeout: 45000,
  use: {
    actionTimeout: 10000,
    baseURL: "http://127.0.0.1:5198",
    channel: "chrome",
    headless: true,
    viewport: { width: 1600, height: 1000 }
  },
  outputDir: "test-results/resource-asset-groups",
  reporter: "list",
  webServer: {
    command:
      "node_modules/.bin/vite build --outDir /tmp/resource-asset-groups-e2e-dist && node_modules/.bin/vite preview --outDir /tmp/resource-asset-groups-e2e-dist --host 127.0.0.1 --port 5198",
    url: "http://127.0.0.1:5198",
    reuseExistingServer: false
  }
});

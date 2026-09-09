import { test, expect } from "@playwright/test";

test("LID audience refresh, pending state, readiness and drawer polling cleanup", async ({
  page
}) => {
  page.on("pageerror", error => console.error("fixture error", error.message));
  let audience = {
    status: "FAILED",
    source: "CLOUD_LID",
    count: 0,
    failReason: "合成测试：分页未完成"
  };
  let reads = 0;
  let prepares = 0;
  await page.route(
    url => url.pathname.startsWith("/api/"),
    async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/feed-tasks/42/data/101/audience/refresh") {
        prepares++;
        audience = {
          status: "SYNCING",
          source: "CLOUD_LID",
          count: 0,
          failReason: ""
        };
        await route.fulfill({ json: { code: 0, data: audience } });
      } else if (path === "/api/feed-tasks/42/data") {
        reads++;
        await route.fulfill({
          json: {
            code: 0,
            data: {
              list: [
                {
                  id: 101,
                  accountId: 12,
                  accountPhone: "12025550101",
                  sendStatus: "failed",
                  retryNum: 0,
                  retryMax: 0,
                  audience
                }
              ],
              total: 1,
              page: 1,
              pageSize: 20
            }
          }
        });
      } else {
        await route.fulfill({ json: { code: 0, data: [] } });
      }
    }
  );
  await page.goto("/e2e/fixtures/feed-status-lid/index.html");
  await expect(page.getByText("准备失败 · 云端 LID")).toBeVisible();
  await page.getByRole("button", { name: "重新准备" }).click();
  await expect(page.getByText("准备中 · 云端 LID")).toBeVisible();
  await expect(page.getByRole("button", { name: "重新准备" })).toHaveCount(0);
  expect(prepares).toBe(1);
  audience = { status: "READY", source: "CLOUD_LID", count: 2, failReason: "" };
  await expect(page.getByText("已就绪 · 云端 LID")).toBeVisible({
    timeout: 10000
  });
  await expect(page.getByText("2 人", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/lid-status-page.png",
    fullPage: true
  });
  await page.getByRole("button", { name: "close this dialog" }).click();
  const readsAtClose = reads;
  await page.getByRole("button", { name: "移除测试操作权限" }).click();
  await page.waitForTimeout(5500);
  expect(reads).toBe(readsAtClose);
  await page.getByRole("button", { name: "打开明细" }).click();
  await expect(page.getByText("已就绪 · 云端 LID")).toBeVisible();
  await expect(page.getByRole("button", { name: "重新准备" })).toHaveCount(0);
});

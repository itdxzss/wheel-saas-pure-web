import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./support/auth";

const composeFile = fileURLToPath(
  new URL("../../armada/armada-api/src/test/e2e/compose.yaml", import.meta.url)
);
const expectedJids = ["120363-e2e-01@g.us", "120363-e2e-11@g.us"];

function composeExec(service: string, ...args: string[]): string {
  return execFileSync(
    "docker",
    ["compose", "-f", composeFile, "exec", "-T", service, ...args],
    { encoding: "utf8" }
  ).trim();
}

function activeOccupancyCount(): number {
  const result = composeExec(
    "mysql",
    "mysql",
    "-uarmada_e2e",
    "-parmada_e2e",
    "--batch",
    "--skip-column-names",
    "armada_e2e",
    "-e",
    "SELECT COUNT(*) FROM pull_task_group_marketing_group_occupancy " +
      "WHERE tenant_id = 1 AND released_at IS NULL"
  );
  return Number(result);
}

test("真实前后端完成跨页选群、等待池恢复、移出和取消释放", async ({ page }) => {
  const consoleErrors: string[] = [];
  const apiFailures: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", response => {
    if (response.url().includes("/api/") && response.status() >= 400) {
      apiFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  await loginAsTestUser(page, {
    localCredentials: { username: "admin", password: "armada123" }
  });
  const firstCandidateResponse = page.waitForResponse(response =>
    response.url().includes("/api/pull-tasks/group-marketing/candidate-groups")
  );
  await page.goto("/#/task/pull-task/create");
  const firstPagePayload = await (await firstCandidateResponse).json();
  expect(firstPagePayload.data.total).toBe(12);
  await expect(page.getByTestId("pull-task-create-page")).toBeVisible();
  await expect(page.getByTestId("candidate-summary")).toContainText(
    "当前筛选 12 个"
  );

  const candidateTable = page.getByTestId("candidate-table");
  const firstRow = candidateTable.locator("tbody tr").first();
  await expect(firstRow).toContainText("E2E候选群01");
  await firstRow.locator(".el-checkbox").click();

  const secondCandidateResponse = page.waitForResponse(response => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith(
        "/api/pull-tasks/group-marketing/candidate-groups"
      ) && url.searchParams.get("page") === "2"
    );
  });
  await page.locator(".el-pagination .btn-next").click();
  await secondCandidateResponse;
  const secondPageFirstRow = candidateTable.locator("tbody tr").first();
  await expect(secondPageFirstRow).toContainText("E2E候选群11");
  await secondPageFirstRow.locator(".el-checkbox").click();
  await expect(page.getByTestId("candidate-summary")).toContainText(
    "已勾选 2 个"
  );

  const addResponse = page.waitForResponse(
    response =>
      response.url().endsWith("/api/pull-tasks/group-marketing/waiting-pool") &&
      response.request().method() === "POST"
  );
  await page.getByTestId("add-to-waiting-pool").click();
  const addPayload = await (await addResponse).json();
  expect(
    addPayload.data.groups.map((group: { groupJid: string }) => group.groupJid)
  ).toEqual(expectedJids);

  const waitingTable = page.getByTestId("waiting-pool-table");
  await expect(waitingTable.locator("tbody tr")).toHaveCount(2);
  const waitingToken = await page.evaluate(() =>
    sessionStorage.getItem("pull-task-group-marketing-waiting-token")
  );
  expect(waitingToken).toBeTruthy();
  expect(activeOccupancyCount()).toBe(2);

  const restoreResponse = page.waitForResponse(
    response =>
      response
        .url()
        .includes(
          "/api/pull-tasks/group-marketing/waiting-pool?reservationToken="
        ) && response.request().method() === "GET"
  );
  await page.reload();
  expect((await (await restoreResponse).json()).data.groups).toHaveLength(2);
  await expect(
    page.getByTestId("waiting-pool-table").locator("tbody tr")
  ).toHaveCount(2);
  await page.getByRole("tab", { name: "等待任务池 (2)" }).click();
  await expect(
    page.getByTestId(`remove-waiting-${expectedJids[0]}`)
  ).toBeVisible();

  const removeResponse = page.waitForResponse(
    response =>
      response
        .url()
        .endsWith("/api/pull-tasks/group-marketing/waiting-pool/remove") &&
      response.request().method() === "POST"
  );
  await page.getByTestId(`remove-waiting-${expectedJids[0]}`).click();
  expect((await (await removeResponse).json()).data.groups).toHaveLength(1);
  await expect(
    page.getByTestId("waiting-pool-table").locator("tbody tr")
  ).toHaveCount(1);

  await page.screenshot({
    path: ".e2e-artifacts/group-marketing-desktop.png",
    fullPage: true
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator(".app-wrapper")).toHaveClass(/mobile/);
  await expect(page.locator(".app-wrapper")).toHaveClass(/hideSidebar/);
  await expect(page.getByTestId("pull-task-create-page")).toBeVisible();
  await page.screenshot({
    path: ".e2e-artifacts/group-marketing-mobile.png",
    fullPage: true
  });

  const releaseResponse = page.waitForResponse(
    response =>
      response
        .url()
        .includes(
          "/api/pull-tasks/group-marketing/waiting-pool?reservationToken="
        ) && response.request().method() === "DELETE"
  );
  await page.getByTestId("cancel-create").click();
  expect((await (await releaseResponse).json()).code).toBe(0);
  await expect(page).toHaveURL(/#\/task\/pull$/);
  expect(activeOccupancyCount()).toBe(0);
  expect(consoleErrors).toEqual([]);
  expect(apiFailures).toEqual([]);
});

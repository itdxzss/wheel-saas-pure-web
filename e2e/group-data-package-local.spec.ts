import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { GroupDataPackage } from "../src/api/group-data-package";

const ROOT = "/api/group-data-packages";
const epoch = Date.UTC(2026, 8, 15, 1);
const zeroMetrics = {
  totalCount: 0,
  unusedCount: 0,
  claimedCount: 0,
  successCount: 0,
  failedCount: 0,
  privacyRejectedCount: 0,
  unregisteredCount: 0,
  unknownCount: 0
};

function emptyPackage(id: number, name: string): GroupDataPackage {
  return {
    id,
    name,
    remark: "合成页面验收数据",
    generation: 1,
    version: 1,
    primaryCountryIso2: null,
    continent: null,
    usageBusinesses: [],
    metrics: { ...zeroMetrics },
    createdAt: epoch,
    updatedAt: epoch
  };
}

/** 仅拦截本地测试API，不联系真实租户；逐个记录页面实际发出的写请求。 */
async function setup(
  page: Page,
  actions = ["create", "edit", "import", "export", "delete"]
) {
  const permissions = ["view", ...actions].map(
    value => `tenant:group_data_package:${value}`
  );
  const populated = emptyPackage(101, "拉群验收包");
  populated.primaryCountryIso2 = "PH";
  populated.continent = "ASIA";
  populated.usageBusinesses = ["STANDARD_PULL"];
  populated.metrics = {
    totalCount: 7,
    unusedCount: 2,
    claimedCount: 1,
    successCount: 1,
    failedCount: 2,
    privacyRejectedCount: 1,
    unregisteredCount: 0,
    unknownCount: 1
  };
  const state = {
    rows: [populated, emptyPackage(102, "待导入包")],
    requests: [] as { method: string; path: string; body: string }[],
    queries: [] as string[],
    failCreate: false
  };
  await page.addInitScript(
    ({ permissions }) => {
      const session = {
        accessToken: "local-group-data-fixture",
        expires: Date.now() + 3_600_000,
        refreshToken: "",
        roles: ["operator"],
        permissions,
        username: "local-test",
        nickname: "数据包页面验收"
      };
      localStorage.setItem("user-info", JSON.stringify(session));
      document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
      document.cookie = "multiple-tabs=true; path=/";
    },
    { permissions }
  );
  await page.route(
    url => url.pathname.startsWith("/api/"),
    async route => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      const body = req.postData() ?? "";
      let data: unknown;
      if (path === "/api/tenant/me/menus") {
        data = [
          {
            path: "/resource",
            name: "Resources",
            meta: { title: "资源管理" },
            children: [
              {
                path: "/resource/group-data-package",
                name: "GroupDataPackage",
                component: "resource/group-data-package/index",
                meta: {
                  title: "拉群数据包",
                  auths: permissions,
                  module_key: "pull_task",
                  perm_key: permissions[0]
                }
              }
            ]
          }
        ];
      } else if (path === `${ROOT}/countries`) {
        data = [
          { iso2: "PH", nameZh: "菲律宾", continent: "ASIA" },
          { iso2: "BR", nameZh: "巴西", continent: "SOUTH_AMERICA" }
        ];
      } else if (path === ROOT && method === "GET") {
        state.queries.push(url.search);
        const name = url.searchParams.get("name") ?? "";
        const list = state.rows.filter(row => row.name.includes(name));
        data = {
          list,
          page: 1,
          pageSize: 20,
          total: list.length,
          totalPages: 1
        };
      } else if (path === ROOT && method === "POST") {
        state.requests.push({ method, path, body });
        if (state.failCreate) {
          await route.fulfill({
            json: { code: 40901, message: "保存暂时失败，请重试", data: null }
          });
          return;
        }
        const input = req.postDataJSON();
        const row = { ...emptyPackage(103, input.name), remark: input.remark };
        state.rows.push(row);
        data = row;
      } else if (path.endsWith("/export")) {
        state.requests.push({ method, path, body });
        await route.fulfill({
          contentType: "text/plain;charset=UTF-8",
          headers: {
            "Content-Disposition": "attachment; filename=group-data.txt",
            "X-Export-Count": "2"
          },
          body: "639170000001A\n639170000002\n"
        });
        return;
      } else if (/\/\d+\/phones$/.test(path)) {
        data = {
          list: [
            {
              id: 1,
              phone: "639170000001",
              adminRequired: true,
              memberSeq: 1,
              sourceLineNo: 2,
              countryIso2: "PH",
              status: "UNUSED",
              createdAt: epoch
            }
          ],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        };
      } else if (/\/\d+\/imports$/.test(path)) {
        data = {
          list: [
            {
              id: 1,
              mode: "append",
              fileName: "原料.txt",
              generation: 1,
              status: 2,
              totalRows: 4,
              acceptedRows: 2,
              invalidRows: 1,
              duplicatedRows: 1,
              privacyFilteredRows: 0,
              failureReason: null,
              createdBy: 1,
              createdAt: epoch,
              finishedAt: epoch
            }
          ],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        };
      } else if (/\/\d+\/import$/.test(path)) {
        state.requests.push({ method, path, body });
        const id = Number(path.split("/").at(-2));
        const row = state.rows.find(item => item.id === id)!;
        row.metrics.totalCount += 2;
        row.metrics.unusedCount += 2;
        data = {
          importId: 2,
          mode: "append",
          generation: 1,
          totalRows: 4,
          acceptedRows: 2,
          invalidRows: 1,
          duplicatedRows: 1,
          privacyFilteredRows: 0,
          phoneCountAfterImport: row.metrics.totalCount
        };
      } else if (/\/\d+\/reset-failed$/.test(path)) {
        state.requests.push({ method, path, body });
        populated.metrics.failedCount = 1;
        populated.metrics.unusedCount = 3;
        data = 1;
      } else if (/\/\d+$/.test(path)) {
        const id = Number(path.split("/").at(-1));
        const row = state.rows.find(item => item.id === id)!;
        if (method === "PUT") {
          state.requests.push({ method, path, body });
          Object.assign(row, req.postDataJSON(), { version: row.version + 1 });
        } else if (method === "DELETE") {
          state.requests.push({ method, path, body });
          state.rows = state.rows.filter(item => item.id !== id);
        }
        data = row;
      } else {
        await route.abort();
        return;
      }
      await route.fulfill({ json: { code: 0, message: "ok", data } });
    }
  );
  await page.goto("/#/resource/group-data-package");
  await expect(
    page.getByRole("row").filter({ hasText: "拉群验收包" })
  ).toBeVisible();
  return state;
}

test("shows resource state combinations and sends a real server name filter", async ({
  page
}) => {
  const state = await setup(page);
  for (const title of [
    "数据包",
    "消费业务",
    "号码使用情况",
    "创建时间",
    "操作"
  ]) {
    await expect(
      page.getByRole("columnheader", { name: new RegExp(`^${title}`) })
    ).toBeVisible();
  }
  await expect(
    page.getByText("隐私拒绝", { exact: false }).first()
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/group-data-package-page.png",
    fullPage: true,
    animations: "disabled"
  });
  await page.getByPlaceholder(/名称/).first().fill("待导入");
  await page.getByRole("button", { name: "搜索", exact: true }).click();
  await expect
    .poll(() =>
      state.queries.some(
        query => new URLSearchParams(query).get("name") === "待导入"
      )
    )
    .toBeTruthy();
  await expect(
    page.getByRole("row").filter({ hasText: "拉群验收包" })
  ).toHaveCount(0);
});

test("retains create inputs after a backend failure, then saves on retry", async ({
  page
}) => {
  const state = await setup(page);
  state.failCreate = true;
  await page.getByRole("button", { name: "新建数据包", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "新建数据包" });
  await dialog.locator("input").first().fill("保存失败保留输入");
  await dialog.locator("textarea").fill("失败后不丢失备注");
  await dialog.getByRole("button", { name: /保存|确定/ }).click();
  await expect(
    page.getByText("保存暂时失败，请重试", { exact: false }).first()
  ).toBeVisible();
  await expect(dialog.locator("input").first()).toHaveValue("保存失败保留输入");
  await expect(dialog.locator("textarea")).toHaveValue("失败后不丢失备注");
  state.failCreate = false;
  await dialog.getByRole("button", { name: /保存|确定/ }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("row").filter({ hasText: "保存失败保留输入" })
  ).toBeVisible();
});

test("opens row export and verifies downloaded material content", async ({
  page
}) => {
  await setup(page);
  const row = page.getByRole("row").filter({ hasText: "拉群验收包" });
  await row.getByRole("button", { name: /^导出/ }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: /^全部/ }).click();
  await page
    .getByRole("menuitem", { name: "TXT（保留 A 标记）", exact: true })
    .click();
  const download = await downloadEvent;
  const localFile = await download.path();
  expect(localFile).not.toBeNull();
  expect(await readFile(localFile!, "utf8")).toBe(
    "639170000001A\n639170000002\n"
  );
});

test("view-only operator cannot see mutating or export entry points", async ({
  page
}) => {
  await setup(page, []);
  await expect(
    page.getByRole("button", { name: "新建数据包", exact: true })
  ).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: "拉群验收包" });
  for (const name of ["导入", "导出", "编辑", "重置失败", "删除", "更多"]) {
    await expect(
      row.getByRole("button", { name: new RegExp(`^${name}`) })
    ).toHaveCount(0);
  }
});

test("previews TXT and imports only after confirming the selected mode", async ({
  page
}) => {
  const state = await setup(page);
  const row = page.getByRole("row").filter({ hasText: "待导入包" });
  await row.getByRole("button", { name: /^导入/ }).click();
  const dialog = page.getByRole("dialog", { name: "导入手机号" });
  await dialog.locator("input[type=file]").setInputFiles({
    name: "号码验收.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("639170000001\n639170000001A\n639170000002\ninvalid\n")
  });
  await expect(dialog.getByText("639170000001", { exact: true })).toBeVisible();
  await expect(
    dialog.getByRole("cell", { name: "A", exact: true })
  ).toBeVisible();
  expect(
    state.requests.filter(item => item.path.endsWith("/import"))
  ).toHaveLength(0);
  await dialog
    .getByRole("button", { name: /导入/, exact: false })
    .last()
    .click();
  const confirmation = page.getByRole("dialog", { name: "导入确认" });
  await expect(confirmation).toBeVisible();
  await confirmation
    .getByRole("button", { name: "确认导入", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: "导入结果" })).toBeVisible();
  const requests = state.requests.filter(item => item.path.endsWith("/import"));
  expect(requests).toHaveLength(1);
  expect(requests[0].path).toBe(`${ROOT}/102/import`);
  expect(requests[0].body).toContain('name="mode"');
  expect(requests[0].body).toContain("append");
  expect(requests[0].body).toContain('name="privacyFilterDays"');
  expect(requests[0].body).toContain("60");
});

test("edits with version and confirms failure reset and deletion", async ({
  page
}) => {
  const state = await setup(page);
  const row = page.getByRole("row").filter({ hasText: "拉群验收包" });
  await row.getByRole("button", { name: /^更多/ }).click();
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "编辑数据包" });
  await edit.locator("textarea").fill("修改后的备注");
  await edit.getByRole("button", { name: "保存", exact: true }).click();
  await expect(edit).toBeHidden();
  await expect(row).toContainText("修改后的备注");
  const request = state.requests.find(item => item.method === "PUT")!;
  expect(JSON.parse(request.body)).toEqual({
    name: "拉群验收包",
    remark: "修改后的备注",
    version: 1
  });
  await row.getByRole("button", { name: /^更多/ }).click();
  await page.getByRole("menuitem", { name: /^重置失败/ }).click();
  const reset = page.getByRole("dialog", { name: "重置失败号码" });
  await expect(reset).toContainText("待确认号码不会重置");
  expect(
    state.requests.some(item => item.path.endsWith("/reset-failed"))
  ).toBeFalsy();
  await reset.getByRole("button", { name: "确认重置", exact: true }).click();
  await expect(reset).toBeHidden();
  await expect
    .poll(() =>
      state.requests.some(item => item.path.endsWith("/reset-failed"))
    )
    .toBeTruthy();
  await row.getByRole("button", { name: /^更多/ }).click();
  await page.getByRole("menuitem", { name: "删除", exact: true }).click();
  const removal = page.getByRole("dialog", { name: "删除数据包" });
  await removal.getByRole("button", { name: "确认删除", exact: true }).click();
  await expect(row).toHaveCount(0);
  expect(state.requests.filter(item => item.method === "DELETE")).toHaveLength(
    1
  );
});

test("opens phone details and import audit from the row menu", async ({
  page
}) => {
  await setup(page);
  const row = page.getByRole("row").filter({ hasText: "拉群验收包" });
  await row.getByRole("button", { name: /^详情/ }).click();
  await page.getByRole("menuitem", { name: "查看号码", exact: true }).click();
  const details = page.getByRole("dialog", { name: "拉群验收包 · 数据包详情" });
  await expect(
    details.getByRole("cell", { name: "639170000001", exact: true })
  ).toBeVisible();
  await expect(
    details.getByRole("cell", { name: "A", exact: true })
  ).toBeVisible();
  await details.getByRole("tab", { name: "导入记录", exact: true }).click();
  await expect(
    details.getByRole("cell", { name: "原料.txt", exact: true })
  ).toBeVisible();
});

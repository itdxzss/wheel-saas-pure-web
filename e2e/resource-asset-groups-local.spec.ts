import { expect, test, type Page } from "@playwright/test";

/** 本地交互夹具不接触真实素材；数据库行为另由后端 H2 验证。 */
async function setup(
  page: Page,
  actions = ["edit", "delete", "upload"],
  business: "HYPERLINK" | "SCRIPT" = "HYPERLINK"
) {
  const permissions = ["view", ...actions].map(key =>
    business === "SCRIPT"
      ? `tenant:script_marketing:${key === "upload" ? "create" : key}`
      : `tenant:resource_asset:${key}`
  );
  const state = {
    groups: [
      { id: 10, groupName: "产品图", scope: "HYPERLINK" },
      { id: 20, groupName: "养群图", scope: "SCRIPT" }
    ],
    rows: [
      {
        id: 1,
        assetName: "产品展示.png",
        groupId: 10 as number | null,
        assetScope: 1 as number | null
      },
      {
        id: 2,
        assetName: "活动海报.png",
        groupId: null as number | null,
        assetScope: null as number | null
      },
      {
        id: 3,
        assetName: "养群新图.png",
        groupId: 20 as number | null,
        assetScope: 2 as number | null
      }
    ],
    moves: [] as { assetIds: number[]; groupId: number | null }[],
    deletes: [] as number[],
    uploadedGroup: "",
    queries: [] as string[],
    mutations: [] as string[]
  };
  await page.addInitScript(
    ({ permissions }) => {
      const session = {
        accessToken: "local-fixture",
        expires: Date.now() + 3600000,
        refreshToken: "",
        roles: ["operator"],
        permissions,
        username: "local-test",
        nickname: "页面验证"
      };
      localStorage.setItem("user-info", JSON.stringify(session));
      document.cookie = `authorized-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
      document.cookie = "multiple-tabs=true; path=/";
    },
    { permissions }
  );
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/")) {
      await route.continue();
      return;
    }
    const scope = url.searchParams.get("scope") ?? "HYPERLINK";
    let data: unknown;
    if (url.pathname === "/api/tenant/me/menus") {
      data = [
        {
          path: "/hyperlink",
          name: "Hyperlink",
          meta: { title: "超链营销" },
          children: [
            {
              path:
                business === "SCRIPT"
                  ? "/material/script-material"
                  : "/hyperlink/library",
              name:
                business === "SCRIPT"
                  ? "ScriptMaterialLibrary"
                  : "HyperlinkResourceAsset",
              component:
                business === "SCRIPT"
                  ? "material/script-material/index"
                  : "hyperlink/library/index",
              meta: {
                title: "图片素材",
                auths: permissions,
                module_key: "hyperlink",
                perm_key: permissions[0]
              }
            }
          ]
        }
      ];
    } else if (url.pathname.endsWith("/content")) {
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=",
          "base64"
        )
      });
      return;
    } else if (url.pathname === "/api/resource-assets/groups") {
      if (request.method() === "POST") {
        const group = {
          id: 11,
          groupName: request.postDataJSON().groupName,
          scope
        };
        state.mutations.push(scope);
        state.groups.push(group);
        data = group;
      } else
        data = state.groups
          .filter(group => group.scope === scope)
          .map(group => ({
            ...group,
            assetCount: state.rows.filter(
              row =>
                row.groupId === group.id &&
                (row.assetScope == null ||
                  row.assetScope === (scope === "SCRIPT" ? 2 : 1))
            ).length
          }));
    } else if (url.pathname.startsWith("/api/resource-assets/groups/")) {
      const id = Number(url.pathname.split("/").pop());
      state.deletes.push(id);
      state.groups = state.groups.filter(group => group.id !== id);
      state.rows.forEach(row => {
        if (row.groupId === id) row.groupId = null;
      });
    } else if (url.pathname === "/api/resource-assets/group") {
      const move = request.postDataJSON();
      state.moves.push(move);
      state.rows.forEach(row => {
        if (move.assetIds.includes(row.id)) row.groupId = move.groupId;
      });
    } else if (url.pathname === "/api/resource-assets/tags") {
      data = { tags: [] };
    } else if (url.pathname === "/api/resource-assets") {
      if (request.method() === "POST") {
        state.uploadedGroup =
          request.postDataBuffer()?.toString("latin1") ?? "";
        const groupId = state.uploadedGroup.match(
          /name="groupId"\r\n\r\n(\d+)/
        )?.[1];
        const row = {
          id: Math.max(...state.rows.map(row => row.id)) + 1,
          assetName: "test.png",
          groupId: groupId ? Number(groupId) : null,
          assetScope: state.uploadedGroup.includes('name="scope"\r\n\r\nSCRIPT')
            ? 2
            : 1
        };
        state.rows.push(row);
        data = row;
      } else {
        state.queries.push(scope);
        const groupId = url.searchParams.get("groupId");
        const rows = state.rows.filter(
          row =>
            (row.assetScope == null ||
              row.assetScope === (scope === "SCRIPT" ? 2 : 1)) &&
            (groupId == null ||
              (Number(groupId) === 0
                ? row.groupId == null
                : row.groupId === Number(groupId)))
        );
        data = {
          list: rows.map(row => ({
            ...row,
            tags: [],
            referenceCount: row.id > 3 ? 0 : 1,
            sizeBytes: 100,
            width: 1,
            height: 1,
            createdAt: 1,
            updatedAt: 1,
            createdBy: 1
          })),
          total: rows.length,
          page: 1,
          pageSize: 24
        };
      }
    } else if (
      /^\/api\/resource-assets\/\d+$/.test(url.pathname) &&
      request.method() === "DELETE"
    ) {
      const id = Number(url.pathname.split("/").pop());
      state.rows = state.rows.filter(row => row.id !== id);
    } else if (url.pathname === "/api/script-materials") {
      data = { list: [], total: 0, page: 1, pageSize: 24 };
    } else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: { code: 0, message: "ok", data } });
  });
  await page.goto(
    business === "SCRIPT"
      ? "/#/material/script-material"
      : "/#/hyperlink/library"
  );
  if (business === "SCRIPT")
    await page.getByRole("button", { name: "管理养群图片" }).click();
  await expect(page.locator(".asset-item")).toHaveCount(2);
  return state;
}

async function chooseGroup(page: Page, name: string) {
  await page.locator(".group-filter").click();
  await page
    .getByRole("option", {
      name: name === "未分组" ? name : new RegExp(`^${name}（\\d+）$`),
      exact: true
    })
    .click();
}

test("creates, moves, filters, cancels deletion, then deletes group while retaining assets", async ({
  page
}) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "管理分组", exact: true }).click();
  const manager = page.getByRole("dialog", { name: "管理素材分组" });
  await manager.getByPlaceholder("输入新分组名称").fill("活动图");
  await manager.getByRole("button", { name: "新增分组" }).click();
  await expect(manager.getByText("活动图（0）", { exact: true })).toBeVisible();
  await manager.locator(".el-dialog__headerbtn").click();
  await page.locator(".batch-toolbar .el-checkbox").click();
  await page.getByRole("button", { name: "移动到分组" }).click();
  const move = page.getByRole("dialog", { name: "移动到分组" });
  await move.locator(".el-select").click();
  await page.getByRole("option", { name: "活动图（0）", exact: true }).click();
  await move.getByRole("button", { name: "确认移动" }).click();
  await expect
    .poll(() => state.moves)
    .toEqual([{ assetIds: [1, 2], groupId: 11 }]);
  await chooseGroup(page, "活动图");
  await expect(page.locator(".asset-item")).toHaveCount(2);
  await page.screenshot({
    path: "/tmp/resource-asset-groups-page.png",
    fullPage: true
  });
  await page.getByRole("button", { name: "管理分组", exact: true }).click();
  await expect(manager.getByText("活动图（2）", { exact: true })).toBeVisible();
  await expect(manager.getByText("产品图（0）", { exact: true })).toBeVisible();
  const row = manager.getByRole("row").filter({ hasText: "活动图" });
  await row.getByRole("button", { name: "删除分组" }).click();
  const confirmation = page.getByRole("dialog", {
    name: "删除分组",
    exact: true
  });
  await expect(confirmation).toContainText("图片和已有模板引用均保留");
  await confirmation.getByRole("button", { name: "取消", exact: true }).click();
  expect(state.deletes).toEqual([]);
  await row.getByRole("button", { name: "删除分组" }).click();
  await confirmation
    .getByRole("button", { name: "删除分组", exact: true })
    .click();
  await expect.poll(() => state.deletes).toEqual([11]);
  await manager.locator(".el-dialog__headerbtn").click();
  await chooseGroup(page, "未分组");
  await expect(page.locator(".asset-item")).toHaveCount(2);
});

test("upload defaults to selected group and includes groupId in multipart", async ({
  page
}) => {
  const state = await setup(page);
  await chooseGroup(page, "产品图");
  await page.getByRole("button", { name: "批量上传", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "批量上传图片" });
  await expect(dialog.locator(".el-select").first()).toContainText("产品图");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=",
      "base64"
    )
  });
  await dialog.getByRole("button", { name: "上传", exact: true }).click();
  await expect
    .poll(() => state.uploadedGroup)
    .toContain('name="groupId"\r\n\r\n10');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".group-filter")).toContainText("产品图（2）");
  const uploaded = page.locator(".asset-item").filter({ hasText: "test.png" });
  await uploaded.getByRole("button", { name: "删除", exact: true }).click();
  await page
    .locator(".el-popconfirm")
    .getByRole("button", { name: "删除", exact: true })
    .click();
  await expect(page.locator(".group-filter")).toContainText("产品图（1）");
});

test("edit-only users can create groups but cannot delete them", async ({
  page
}) => {
  await setup(page, ["edit"]);
  await page.getByRole("button", { name: "管理分组", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "管理素材分组" });
  await expect(dialog.getByRole("button", { name: "新增分组" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "删除分组" })).toHaveCount(0);
});

test("script image management shows legacy and script uploads and always sends script scope", async ({
  page
}) => {
  const state = await setup(page, ["edit", "delete", "upload"], "SCRIPT");
  const library = page.getByRole("dialog", {
    name: "养群图片素材",
    exact: true
  });
  await expect(library.locator(".asset-name")).toHaveText([
    "活动海报.png",
    "养群新图.png"
  ]);
  expect(state.queries).toEqual(["SCRIPT"]);
  await library.getByRole("button", { name: "管理分组", exact: true }).click();
  const manager = page.getByRole("dialog", { name: "管理素材分组" });
  await expect(manager.getByText("产品图", { exact: true })).toHaveCount(0);
  await expect(manager.getByText("养群图（1）", { exact: true })).toBeVisible();
  await manager.getByPlaceholder("输入新分组名称").fill("独立养群分组");
  await manager.getByRole("button", { name: "新增分组" }).click();
  await expect.poll(() => state.mutations).toEqual(["SCRIPT"]);
  await manager.locator(".el-dialog__headerbtn").click();
  await library.getByRole("button", { name: "批量上传", exact: true }).click();
  const upload = page.getByRole("dialog", { name: "批量上传图片" });
  await upload.locator("input[type=file]").setInputFiles({
    name: "script.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=",
      "base64"
    )
  });
  await upload.getByRole("button", { name: "上传", exact: true }).click();
  await expect
    .poll(() => state.uploadedGroup)
    .toContain('name="scope"\r\n\r\nSCRIPT');
});

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsTestUser } from "./support/auth";

/**
 * 「群信息设置」总开关的端到端验收。
 *
 * 依赖与 group-marketing.spec.ts 完全一致的独立环境：
 * `armada-api/src/test/e2e/run-group-marketing-e2e.sh` 起 docker compose(MySQL+Redis)、
 * 真后端和真前端。本文件用真人操作建任务，再直接查库断言落库结果。
 * 单独运行：`pnpm test:e2e:pull-task-group-setting`（需先起好上述环境）。
 */
const composeFile = fileURLToPath(
  new URL("../../armada/armada-api/src/test/e2e/compose.yaml", import.meta.url)
);
const managerGroupName = "E2E管理分组";
const pullerGroupName = "E2E拉手分组";
/** 1x1 透明 PNG，用于验证群头像落库。 */
const avatarPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function composeExec(service: string, ...args: string[]): string {
  return execFileSync(
    "docker",
    ["compose", "-f", composeFile, "exec", "-T", service, ...args],
    { encoding: "utf8" }
  ).trim();
}

function mysqlQuery(sql: string): string {
  return composeExec(
    "mysql",
    "mysql",
    "-uarmada_e2e",
    "-parmada_e2e",
    "--batch",
    "--skip-column-names",
    "--default-character-set=utf8mb4",
    "armada_e2e",
    "-e",
    sql
  );
}

/** 建任务只要求分组存在，账号成员由拉起后的调度器消费，这里不需要。 */
function seedAccountGroups(): void {
  mysqlQuery(
    "DELETE FROM account_group WHERE tenant_id = 1 AND id IN (920001, 920002); " +
      "INSERT INTO account_group (id, tenant_id, name, remark, system_builtin, " +
      "created_at, updated_at, created_by, deleted_at) VALUES " +
      `(920001, 1, '${managerGroupName}', 'E2E', 0, 1700000000000, 1700000000000, 1, NULL), ` +
      `(920002, 1, '${pullerGroupName}', 'E2E', 0, 1700000000000, 1700000000000, 1, NULL)`
  );
}

/** 按任务名读回群信息设置行，NULL 统一转成字符串 `<null>` 便于断言。 */
function groupSettingRow(taskName: string): Record<string, string> {
  const columns = [
    "is_group_setting_enabled",
    "setting_timing",
    "group_name",
    "is_material_filename_as_group_name",
    "avatar_file_key",
    "group_description",
    "is_auto_unmute_after_task",
    "is_auto_close_invite_after_task",
    "edit_permission_mode",
    "mute_mode",
    "link_permission_mode",
    "disappearing_message_mode"
  ];
  const selected = columns
    .map(column => `IFNULL(s.${column}, '<null>')`)
    .join(", ");
  const raw = mysqlQuery(
    `SELECT ${selected} FROM pull_task_standard_group_setting s ` +
      "JOIN pull_task t ON t.id = s.task_id AND t.tenant_id = s.tenant_id " +
      `WHERE s.tenant_id = 1 AND t.task_name = '${taskName}'`
  );
  const values = raw.split("\t");
  expect(values).toHaveLength(columns.length);
  return Object.fromEntries(
    columns.map((column, index) => [column, values[index]])
  );
}

function groupSettingCard(page: Page): Locator {
  return page.locator(".el-card").filter({ hasText: "群信息设置" }).first();
}

function groupSettingToggle(page: Page): Locator {
  return groupSettingCard(page).locator(".el-card__header .el-switch").first();
}

function settingField(
  page: Page,
  blockSelector: string,
  label: string
): Locator {
  return page
    .locator(`${blockSelector} .el-form-item`)
    .filter({ has: page.locator(".el-form-item__label", { hasText: label }) })
    .first();
}

function groupSettingField(page: Page, label: string): Locator {
  return settingField(page, ".group-settings-form", label);
}

async function chooseAccountGroup(
  page: Page,
  label: string,
  groupName: string
): Promise<void> {
  await settingField(page, ".account-block", label)
    .locator(".el-select")
    .click();
  await page
    .locator(".el-select-dropdown__item:visible")
    .filter({ hasText: groupName })
    .first()
    .click();
}

/** 打开新建弹窗并填满「群信息设置」之外的必填项，停在可提交状态。 */
async function openCreateDrawerWithRequiredFields(
  page: Page,
  taskName: string
): Promise<void> {
  await page.goto("/#/task/pull");
  await page.getByRole("button", { name: "新建拉群任务" }).click();
  await expect(page.getByText("新建拉群任务")).toBeVisible();

  await page.getByPlaceholder("请输入任务名称").fill(taskName);
  // 关掉自动启动，任务停在待启动，落库结果不受调度器影响。
  await page.locator(".task-base-block .el-switch").first().click();
  await chooseAccountGroup(page, "管理分组", managerGroupName);
  await chooseAccountGroup(page, "拉手分组", pullerGroupName);

  const materialLines = Array.from(
    { length: 60 },
    (_unused, index) => `86139${String(index).padStart(8, "0")}`
  ).join("\n");
  await page.locator('.txt-upload input[type="file"]').setInputFiles({
    name: "e2e-material.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(materialLines, "utf8")
  });

  const planResponse = page.waitForResponse(
    response =>
      response.url().endsWith("/api/pull-tasks/standard/draft/plan") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "自定义粘贴链接" }).click();
  await page
    .getByPlaceholder("请输入群链接，一行一个")
    .fill(`https://chat.whatsapp.com/E2ETOGGLE${Date.now()}`);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  expect((await (await planResponse).json()).code).toBe(0);
}

async function submitCreate(page: Page): Promise<void> {
  const createResponse = page.waitForResponse(
    response =>
      response.url().endsWith("/api/pull-tasks/standard") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "创建任务" }).first().click();
  expect((await (await createResponse).json()).code).toBe(0);
}

test.beforeEach(() => {
  seedAccountGroups();
});

test("关着开关建任务时群信息设置整块按表默认值落库", async ({ page }) => {
  const taskName = `E2E群设置关闭_${Date.now()}`;
  await loginAsTestUser(page, {
    localCredentials: { username: "admin", password: "armada123" }
  });
  await openCreateDrawerWithRequiredFields(page, taskName);

  await expect(groupSettingToggle(page)).not.toHaveClass(/is-checked/);
  await expect(groupSettingCard(page).getByText("设置顺序")).toHaveCount(0);
  await expect(groupSettingCard(page).getByText("基础资料")).toHaveCount(0);
  await expect(groupSettingCard(page).getByText("权限控制")).toHaveCount(0);

  await submitCreate(page);

  expect(groupSettingRow(taskName)).toEqual({
    is_group_setting_enabled: "0",
    setting_timing: "2",
    group_name: "<null>",
    is_material_filename_as_group_name: "0",
    avatar_file_key: "<null>",
    group_description: "<null>",
    is_auto_unmute_after_task: "0",
    is_auto_close_invite_after_task: "0",
    edit_permission_mode: "0",
    mute_mode: "0",
    link_permission_mode: "2",
    disappearing_message_mode: "0"
  });
});

test("打开开关填完群信息后 12 个字段全部落库", async ({ page }) => {
  const taskName = `E2E群设置打开_${Date.now()}`;
  const groupName = "E2E群信息设置群名";
  const groupDescription = "E2E群描述";
  await loginAsTestUser(page, {
    localCredentials: { username: "admin", password: "armada123" }
  });
  await openCreateDrawerWithRequiredFields(page, taskName);

  await groupSettingToggle(page).click();
  await expect(groupSettingCard(page).getByText("设置顺序")).toBeVisible();

  await groupSettingField(page, "设置顺序")
    .getByText("拉人之前设置", { exact: true })
    .click();
  await groupSettingField(page, "群名称").getByRole("textbox").fill(groupName);
  await groupSettingField(page, "群描述")
    .getByRole("textbox")
    .fill(groupDescription);
  await groupSettingField(page, "群头像")
    .locator('input[type="file"]')
    .setInputFiles({
      name: "e2e-avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from(avatarPngBase64, "base64")
    });
  await groupSettingField(page, "是否任务完成后自动关闭禁言")
    .getByText("是", { exact: true })
    .click();
  await groupSettingField(page, "是否任务完成后自动关闭拉人权限")
    .getByText("是", { exact: true })
    .click();
  await groupSettingField(page, "允许任何人编辑群组设置")
    .getByText("允许", { exact: true })
    .click();
  await groupSettingField(page, "群禁言")
    .getByText("禁言", { exact: true })
    .click();
  await groupSettingField(page, "获取群链接权限")
    .getByText("所有人", { exact: true })
    .click();
  await groupSettingField(page, "限时消息")
    .getByText("24小时", { exact: true })
    .click();

  await submitCreate(page);

  const row = groupSettingRow(taskName);
  expect(row).toMatchObject({
    is_group_setting_enabled: "1",
    setting_timing: "1",
    group_name: groupName,
    is_material_filename_as_group_name: "0",
    group_description: groupDescription,
    is_auto_unmute_after_task: "1",
    is_auto_close_invite_after_task: "1",
    edit_permission_mode: "1",
    mute_mode: "1",
    link_permission_mode: "1",
    disappearing_message_mode: "1"
  });
  expect(row.avatar_file_key).toMatch(/\.png$/);
});

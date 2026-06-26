import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routesFile = join(root, "mock/asyncRoutes.ts");
const accountImportApi = join(root, "src/api/account-import.ts");
const resourceIpApi = join(root, "src/api/resource-ip.ts");
const accountImportPage = join(root, "src/views/account/import/index.vue");
const accountImportTable = join(
  root,
  "src/views/account/import/components/AccountImportTable.vue"
);
const accountImportDrawer = join(
  root,
  "src/views/account/import/components/AccountImportDrawer.vue"
);
const accountImportDetailDrawer = join(
  root,
  "src/views/account/import/components/AccountImportDetailDrawer.vue"
);
const accountImportColumns = join(
  root,
  "src/views/account/import/constants.ts"
);
const accountImportComposable = join(
  root,
  "src/views/account/import/composables/useAccountImportPage.ts"
);
const paginationComponent = join(
  root,
  "src/components/WheelPagination/index.vue"
);

const routes = readFileSync(routesFile, "utf8");
for (const snippet of [
  'path: "/task"',
  'title: "任务中心"',
  'module_key: "pull_task"',
  'path: "/account/import"',
  'component: "account/import/index"',
  'name: "AccountImport"',
  'title: "账号导入"',
  "showParent: true",
  'module_key: "account"',
  'perm_key: "tenant:account:edit"'
]) {
  if (!routes.includes(snippet)) {
    throw new Error(`account import route is incomplete: ${snippet}`);
  }
}

for (const file of [
  accountImportApi,
  resourceIpApi,
  accountImportPage,
  accountImportTable,
  accountImportDrawer,
  accountImportDetailDrawer,
  accountImportColumns,
  accountImportComposable,
  paginationComponent
]) {
  if (!existsSync(file)) {
    throw new Error(`account import file is missing: ${file}`);
  }
}

const api = readFileSync(accountImportApi, "utf8");
for (const snippet of [
  "AccountImportTask",
  "AccountImportTaskDetail",
  "CreateAccountImportTaskRequest",
  "listAccountImportTasks",
  "createAccountImportTask",
  "uploadAccountImportZip",
  "getAccountImportTask",
  "exportAccountImportTask",
  "Promise<ApiResponse",
  "/api/tenant/account-imports",
  "/api/tenant/account-imports/zip",
  "Content-Type"
]) {
  if (!api.includes(snippet)) {
    throw new Error(`account import api is incomplete: ${snippet}`);
  }
}

const resourceIp = readFileSync(resourceIpApi, "utf8");
for (const snippet of [
  "listTenantIpRegions",
  "Promise<ApiResponse<string[]>>",
  "/api/tenant/resource/ip-proxies/regions"
]) {
  if (!resourceIp.includes(snippet)) {
    throw new Error(`resource ip api is incomplete: ${snippet}`);
  }
}

const page = readFileSync(accountImportPage, "utf8");
for (const snippet of [
  "account-import-page",
  "account-import-search",
  "AccountImportTable",
  "AccountImportDrawer",
  "AccountImportDetailDrawer",
  "useAccountImportPage",
  "ID / 来源文件",
  "导入类型",
  "分组",
  "机型",
  "账号类型",
  "登录结果",
  "状态",
  "<el-form"
]) {
  if (!page.includes(snippet)) {
    throw new Error(`account import page is incomplete: ${snippet}`);
  }
}

const table = readFileSync(accountImportTable, "utf8");
for (const snippet of [
  "账号导入",
  "PureTableBar",
  "导入协议号",
  "刷新",
  "ID",
  "来源文件",
  "导入类型",
  "分组",
  "机型",
  "账号类型",
  "任务进度",
  "登录成功 / 失败",
  "登录异常",
  "创建时间",
  "状态",
  "操作",
  "明细",
  "exportOptions",
  '#default="{ dynamicColumns }"',
  "WheelPagination"
]) {
  if (!table.includes(snippet)) {
    throw new Error(`account import table is incomplete: ${snippet}`);
  }
}

const drawer = readFileSync(accountImportDrawer, "utf8");
for (const snippet of [
  "导入协议号",
  "el-drawer",
  "账号分组",
  "新增分组",
  "机型",
  "账号类型",
  "管理客服（二期）",
  "选择IP",
  "备注",
  "六段号",
  "JSON号",
  "全参账号",
  "el-upload",
  "确认导入",
  "确认新增分组",
  "createGroup",
  "readTextFile"
]) {
  if (!drawer.includes(snippet)) {
    throw new Error(`account import drawer is incomplete: ${snippet}`);
  }
}

for (const forbidden of ["客服A", "客服B", "Math.random", "mockTasks"]) {
  if (drawer.includes(forbidden) || page.includes(forbidden)) {
    throw new Error(
      `account import contains forbidden fake data: ${forbidden}`
    );
  }
}

const detail = readFileSync(accountImportDetailDrawer, "utf8");
for (const snippet of [
  "导入明细",
  "登录成功",
  "登录失败",
  "登录异常",
  "导入配置参数",
  "失败原因概览",
  "全部",
  "成功",
  "失败",
  "异常",
  "行号",
  "账号",
  "失败原因",
  "创建时间",
  "WheelPagination"
]) {
  if (!detail.includes(snippet)) {
    throw new Error(`account import detail drawer is incomplete: ${snippet}`);
  }
}

const columns = readFileSync(accountImportColumns, "utf8");
for (const snippet of [
  "accountImportColumns",
  "来源文件",
  "登录成功 / 失败",
  "登录异常",
  "操作",
  "导出全部",
  "导出失败"
]) {
  if (!columns.includes(snippet)) {
    throw new Error(`account import columns are incomplete: ${snippet}`);
  }
}

const composable = readFileSync(accountImportComposable, "utf8");
for (const snippet of [
  "AccountImportPageState",
  "useAccountImportPage(): AccountImportPageState",
  "listAccountImportTasks",
  "createAccountImportTask",
  "uploadAccountImportZip",
  "getAccountImportTask",
  "exportAccountImportTask",
  "createAccountGroup",
  "listAccountGroups",
  "listTenantIpRegions",
  "ElMessage.error",
  "ElMessage.warning"
]) {
  if (!composable.includes(snippet)) {
    throw new Error(`account import composable is incomplete: ${snippet}`);
  }
}

const pagination = readFileSync(paginationComponent, "utf8");
for (const snippet of ["500", "1000", "<el-pagination"]) {
  if (!pagination.includes(snippet)) {
    throw new Error(`common pagination component is incomplete: ${snippet}`);
  }
}

console.log("account import menu verification passed");

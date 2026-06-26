import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routesFile = join(root, "mock/asyncRoutes.ts");
const accountApi = join(root, "src/api/account.ts");
const accountListPage = join(root, "src/views/account/index/index.vue");
const accountListTable = join(
  root,
  "src/views/account/index/components/AccountListTable.vue"
);
const accountListColumns = join(root, "src/views/account/index/constants.ts");
const accountListComposable = join(
  root,
  "src/views/account/index/composables/useAccountListPage.ts"
);
const paginationComponent = join(
  root,
  "src/components/WheelPagination/index.vue"
);

const routes = readFileSync(routesFile, "utf8");
for (const snippet of [
  'path: "/account"',
  'title: "账号管理"',
  'module_key: "account"',
  'path: "/account/index"',
  'component: "account/index/index"',
  'name: "AccountIndex"',
  'title: "账号列表"',
  "showParent: true",
  'perm_key: "tenant:account:view"'
]) {
  if (!routes.includes(snippet)) {
    throw new Error(`account list route is incomplete: ${snippet}`);
  }
}

if (!existsSync(accountApi)) {
  throw new Error("account api is missing: src/api/account.ts");
}

if (!existsSync(accountListPage)) {
  throw new Error(
    "account list page is missing: src/views/account/index/index.vue"
  );
}

if (!existsSync(accountListTable)) {
  throw new Error(
    "account list table is missing: src/views/account/index/components/AccountListTable.vue"
  );
}

if (!existsSync(accountListColumns)) {
  throw new Error(
    "account list columns are missing: src/views/account/index/constants.ts"
  );
}

if (!existsSync(accountListComposable)) {
  throw new Error(
    "account list composable is missing: src/views/account/index/composables/useAccountListPage.ts"
  );
}

if (!existsSync(paginationComponent)) {
  throw new Error(
    "common pagination component is missing: src/components/WheelPagination/index.vue"
  );
}

const api = readFileSync(accountApi, "utf8");
for (const snippet of [
  "TenantAccount",
  "TenantAccountSummary",
  "listTenantAccounts",
  "getTenantAccountSummary",
  "Promise<ApiResponse",
  "/api/tenant/accounts/list",
  "/api/tenant/accounts/summary"
]) {
  if (!api.includes(snippet)) {
    throw new Error(`account api is incomplete: ${snippet}`);
  }
}

const page = readFileSync(accountListPage, "utf8");
for (const snippet of [
  "account-list-page",
  "account-list-stats",
  "account-list-search",
  "<el-form",
  "账号 / 国家 / 协议 / 备注 / 分组 / 状态搜索",
  "展开高级搜索",
  "收起高级搜索",
  "账号",
  "风控状态",
  "账号状态",
  "IP分组",
  "绑定分组",
  "国家",
  "绑定客服",
  "AccountListTable",
  "accountListColumns",
  "<el-drawer",
  "确认迁移"
]) {
  if (!page.includes(snippet)) {
    throw new Error(`account list page is incomplete: ${snippet}`);
  }
}

const table = readFileSync(accountListTable, "utf8");
for (const snippet of [
  "账号列表",
  "PureTableBar",
  "批量操作",
  "迁移到分组",
  "登录",
  "离线",
  "批量删除",
  'type="selection"',
  "头像",
  "IP来源",
  "账号类型",
  "协议",
  "IP地址",
  "渠道/来源",
  "分组",
  "状态",
  "好友 / 群",
  "拉人数量",
  "超链寿命",
  "封号错误码/封号原因",
  "入库时间",
  "失效时间",
  "操作",
  '#default="{ dynamicColumns }"',
  'v-if="!dynamicColumns[0].hide"',
  'v-if="!dynamicColumns[17].hide"',
  "WheelPagination"
]) {
  if (!table.includes(snippet)) {
    throw new Error(`account list table is incomplete: ${snippet}`);
  }
}

const columns = readFileSync(accountListColumns, "utf8");
for (const snippet of ["accountListColumns", "头像", "失效时间", "操作"]) {
  if (!columns.includes(snippet)) {
    throw new Error(`account list columns are incomplete: ${snippet}`);
  }
}

const composable = readFileSync(accountListComposable, "utf8");
for (const snippet of [
  "AccountListPageState",
  "useAccountListPage(): AccountListPageState",
  "listTenantAccounts",
  "getTenantAccountSummary",
  "listAccountGroups",
  "ElMessage.error",
  "ElMessage.warning"
]) {
  if (!composable.includes(snippet)) {
    throw new Error(`account list composable is incomplete: ${snippet}`);
  }
}

const pagination = readFileSync(paginationComponent, "utf8");
for (const snippet of ["500", "1000", "<el-pagination"]) {
  if (!pagination.includes(snippet)) {
    throw new Error(`common pagination component is incomplete: ${snippet}`);
  }
}

console.log("account list menu verification passed");

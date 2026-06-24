import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routesFile = join(root, "mock/asyncRoutes.ts");
const accountGroupPage = join(root, "src/views/account/group/index.vue");
const accountGroupApi = join(root, "src/api/account-group.ts");
const paginationComponent = join(
  root,
  "src/components/WheelPagination/index.vue"
);
const routes = readFileSync(routesFile, "utf8");

const requiredSnippets = [
  'path: "/account"',
  'title: "账号管理"',
  'path: "/account/group/index"',
  'component: "account/group/index"',
  'name: "AccountGroup"',
  'title: "账号分组"',
  "showParent: true",
  'module_key: "account"',
  'perm_key: "tenant:account-group:view"'
];

const missing = requiredSnippets.filter(snippet => !routes.includes(snippet));

if (missing.length > 0) {
  throw new Error(`account menu route is incomplete: ${missing.join(", ")}`);
}

if (!existsSync(accountGroupPage)) {
  throw new Error(
    "account group page is missing: src/views/account/group/index.vue"
  );
}

if (!existsSync(accountGroupApi)) {
  throw new Error("account group api is missing: src/api/account-group.ts");
}

if (!existsSync(paginationComponent)) {
  throw new Error(
    "common pagination component is missing: src/components/WheelPagination/index.vue"
  );
}

const page = readFileSync(accountGroupPage, "utf8");
for (const snippet of [
  "账号分组",
  "account-group-page",
  "account-group-search",
  "PureTableBar",
  "<el-form",
  "请输入分组ID",
  "请输入分组名称",
  "搜索",
  "重置",
  "删除选中",
  "selectedRows",
  "onSelectionChange",
  "isSelectable",
  "ElMessageBox.confirm",
  "showCreateDrawer",
  "createForm",
  "submitCreateAccountGroup",
  "batchDeleteAccountGroups",
  "createAccountGroup",
  "<el-drawer",
  'title="新增分组"',
  "请填写分组名称",
  "例如：巴铁推手-A / 印度进群-A",
  "填写分组用途、规则或说明，例如：用于进群账号，国家=巴基斯坦，账号状态=正常",
  "新增分组会保存到账号分组接口；系统默认分组不允许删除。",
  "确认新增分组",
  "新增分组成功",
  'type="selection"',
  'label="分组ID"',
  'label="分组名称"',
  'label="账号数量 (在线/异常/封号)"',
  'label="更新时间"',
  '#default="{ dynamicColumns }"',
  'v-if="!dynamicColumns[0].hide"',
  'v-if="!dynamicColumns[3].hide"',
  "<el-table",
  "WheelPagination"
]) {
  if (!page.includes(snippet)) {
    throw new Error(
      `account group page is missing required UI snippet: ${snippet}`
    );
  }
}

const pagination = readFileSync(paginationComponent, "utf8");
for (const snippet of ["500", "1000", "<el-pagination"]) {
  if (!pagination.includes(snippet)) {
    throw new Error(`common pagination component is incomplete: ${snippet}`);
  }
}

if (
  page.includes('<el-table-column prop="remark"') ||
  page.includes('label="备注" min-width')
) {
  throw new Error(
    "account group list must align old wheel columns: no remark column"
  );
}

const createIndex = page.indexOf("新增分组");
const deleteIndex = page.indexOf("删除选中");
if (createIndex === -1 || deleteIndex === -1 || createIndex > deleteIndex) {
  throw new Error("account group toolbar must place 新增分组 before 删除选中");
}

const api = readFileSync(accountGroupApi, "utf8");
for (const snippet of [
  '"/api/tenant/account-groups"',
  '"/api/tenant/account-groups/batch-delete"',
  "createAccountGroup",
  "batchDeleteAccountGroups"
]) {
  if (!api.includes(snippet)) {
    throw new Error(`account group api is incomplete: ${snippet}`);
  }
}

console.log("account menu verification passed");

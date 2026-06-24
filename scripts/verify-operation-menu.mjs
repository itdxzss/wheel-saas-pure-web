import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routesFile = join(root, "mock/asyncRoutes.ts");
const ipManagePage = join(root, "src/views/resource/ip/index.vue");
const paginationComponent = join(
  root,
  "src/components/WheelPagination/index.vue"
);
const routes = readFileSync(routesFile, "utf8");

for (const snippet of [
  'path: "/operation"',
  'title: "运营管理"',
  'module_key: "ops_management"',
  'path: "/resource/ip"',
  'component: "resource/ip/index"',
  'name: "ResourceIp"',
  'title: "IP 管理"',
  "showParent: true",
  'module_key: "resource_ip"',
  'perm_key: "tenant:resource:ips:list"'
]) {
  if (!routes.includes(snippet)) {
    throw new Error(`operation menu route is incomplete: ${snippet}`);
  }
}

if (!existsSync(ipManagePage)) {
  throw new Error(
    "IP management page is missing: src/views/resource/ip/index.vue"
  );
}

if (!existsSync(paginationComponent)) {
  throw new Error(
    "common pagination component is missing: src/components/WheelPagination/index.vue"
  );
}

const page = readFileSync(ipManagePage, "utf8");
for (const snippet of [
  "IP 管理",
  "温馨提示：",
  "guideCollapsed",
  "ipidea",
  "Thordata",
  "https://grassdata.net",
  "www.thordata.com",
  "WhatsApp",
  "优先推荐您使用目标国家的 HTTP 住宅动态 IP",
  "<el-card",
  "<el-alert",
  "PureTableBar",
  "<el-form",
  "countryOptions",
  "proxyTypeOptions",
  "请选择国家",
  "全部类型",
  "请输入来源",
  "<el-table",
  'type="selection"',
  "TXT 批量导入",
  "批量删除",
  "<el-drawer",
  "<el-upload",
  "代理地址:端口:用户名:密码",
  "开始导入",
  "国家",
  "类型",
  "代理地址",
  "用户名",
  "密码",
  "有效账号",
  "来源",
  "创建时间",
  '#default="{ dynamicColumns }"',
  'v-if="!dynamicColumns[0].hide"',
  'v-if="!dynamicColumns[7].hide"',
  "WheelPagination"
]) {
  if (!page.includes(snippet)) {
    throw new Error(`IP management page is incomplete: ${snippet}`);
  }
}

if (page.includes("绑定账号")) {
  throw new Error(
    "IP management table should align old SaaS columns without 绑定账号"
  );
}

const pagination = readFileSync(paginationComponent, "utf8");
for (const snippet of ["500", "1000", "<el-pagination"]) {
  if (!pagination.includes(snippet)) {
    throw new Error(`common pagination component is incomplete: ${snippet}`);
  }
}

console.log("operation menu verification passed");

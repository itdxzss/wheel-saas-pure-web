import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const routesFile = join(root, "mock/asyncRoutes.ts");
const groupImportPage = join(root, "src/views/group/imports/index.vue");
const paginationComponent = join(
  root,
  "src/components/WheelPagination/index.vue"
);

const routes = readFileSync(routesFile, "utf8");
for (const snippet of [
  'path: "/task"',
  'title: "任务中心"',
  'module_key: "pull_task"',
  'path: "/task/group-link/imports"',
  'component: "group/imports/index"',
  'name: "TaskGroupLinkImports"',
  'title: "导入链接"',
  "showParent: true",
  'module_key: "group_link"',
  'perm_key: "tenant:group_link:view"'
]) {
  if (!routes.includes(snippet)) {
    throw new Error(`group import route is incomplete: ${snippet}`);
  }
}

if (!existsSync(groupImportPage)) {
  throw new Error(
    "group import page is missing: src/views/group/imports/index.vue"
  );
}

if (!existsSync(paginationComponent)) {
  throw new Error(
    "common pagination component is missing: src/components/WheelPagination/index.vue"
  );
}

const page = readFileSync(groupImportPage, "utf8");
for (const snippet of [
  "导入链接",
  "group-import-page",
  "group-import-search",
  "PureTableBar",
  "<el-form",
  "搜索：WS链接分组 / 来源文件 / 导入批次 ID",
  "ID 精准",
  "导入时间",
  "全部状态",
  "导入群链接",
  "新增WS链接分组",
  "删除选中",
  'type="selection"',
  "ID",
  "WS链接分组",
  "活跃链接",
  "来源文件",
  "导入次数",
  "总行数",
  "成功",
  "失败",
  "最近导入",
  "状态",
  "操作",
  "明细",
  "导出失败",
  '#default="{ dynamicColumns }"',
  'v-if="!dynamicColumns[0].hide"',
  'v-if="!dynamicColumns[10].hide"',
  "<el-drawer",
  "请选择WS链接分组",
  "支持 TXT / CSV / Excel",
  "分组名称",
  "适用国家 / 区域",
  "确认新增分组",
  "WheelPagination"
]) {
  if (!page.includes(snippet)) {
    throw new Error(`group import page is incomplete: ${snippet}`);
  }
}

const pagination = readFileSync(paginationComponent, "utf8");
for (const snippet of ["500", "1000", "<el-pagination"]) {
  if (!pagination.includes(snippet)) {
    throw new Error(`common pagination component is incomplete: ${snippet}`);
  }
}

console.log("group import menu verification passed");

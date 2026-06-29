import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    throw new Error(`missing file: ${path}`);
  }
  return readFileSync(fullPath, "utf8");
}

function expectIncludes(content, snippets, label) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(`${label} is incomplete: ${snippet}`);
    }
  }
}

const routes = read("mock/asyncRoutes.ts");
expectIncludes(
  routes,
  [
    'path: "/task/join"',
    'component: "task/join-task/index"',
    'name: "TaskJoin"',
    'title: "进群任务"',
    'module_key: "join_task"',
    'perm_key: "tenant:join_task:view"'
  ],
  "join task route"
);

const requiredFiles = [
  "src/api/join-task.ts",
  "src/views/task/join-task/constants.ts",
  "src/views/task/join-task/composables/useJoinTaskPage.ts",
  "src/views/task/join-task/components/JoinTaskEditorDrawer.vue",
  "src/views/task/join-task/components/JoinTaskDetailDrawer.vue",
  "src/views/task/join-task/components/JoinTaskTable.vue",
  "src/views/task/join-task/index.vue"
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`required join task file is missing: ${file}`);
  }
}

const api = read("src/api/join-task.ts");
expectIncludes(
  api,
  [
    "export interface JoinTaskRow",
    "export interface JoinTaskDetail",
    "export interface CreateJoinTaskRequest",
    "export interface JoinResultRow",
    "listJoinTasks",
    '"/api/join-tasks"',
    "listJoinTaskIntervals",
    "createJoinTask",
    "getJoinTaskDetail",
    "updateJoinTask",
    "getJoinTaskResults",
    "batchDeleteJoinTasks"
  ],
  "join task api"
);

if (api.includes("startJoinTask") || api.includes("/start")) {
  throw new Error("join task api must not expose start before armada endpoint exists");
}

const constants = read("src/views/task/join-task/constants.ts");
expectIncludes(
  constants,
  [
    "joinTaskColumns",
    "joinTaskStatusOptions",
    "joinTaskStatusLabel",
    "joinTaskStatusTagType",
    "joinTaskDistributionOptions",
    "joinTaskDistributionLabel",
    "joinResultStatusLabel",
    "formatEpoch"
  ],
  "join task constants"
);

const composable = read(
  "src/views/task/join-task/composables/useJoinTaskPage.ts"
);
expectIncludes(
  composable,
  [
    "useJoinTaskPage",
    "refreshTasks",
    "openCreateDrawer",
    "openEditDrawer",
    "openCopyDrawer",
    "submitEditor",
    "openDetailDrawer",
    "deleteSelected",
    "group-list"
  ],
  "join task composable"
);

const page = read("src/views/task/join-task/index.vue");
expectIncludes(
  page,
  [
    'name: "TaskJoin"',
    "进群任务",
    "join-task-page",
    "join-task-search",
    "<el-form",
    "JoinTaskTable",
    "JoinTaskEditorDrawer",
    "JoinTaskDetailDrawer",
    "任务名称",
    "账号分组",
    "分配方式",
    "任务状态",
    "进群间隔",
    "创建时间"
  ],
  "join task page"
);

const table = read(
  "src/views/task/join-task/components/JoinTaskTable.vue"
);
expectIncludes(
  table,
  [
    "PureTableBar",
    "WheelPagination",
    "<el-table",
    'type="selection"',
    "创建进群任务",
    "批量删除",
    "明细",
    "编辑",
    "复制"
  ],
  "join task table"
);

const editorDrawer = read(
  "src/views/task/join-task/components/JoinTaskEditorDrawer.vue"
);
expectIncludes(
  editorDrawer,
  [
    "<el-drawer",
    "<el-form",
    "<el-select",
    "<el-table",
    "<el-input-number",
    "<el-switch",
    "基础信息",
    "选择账号",
    "进群链接",
    "分配方式",
    "失败处理",
    "保存进群任务"
  ],
  "join task editor drawer"
);

const detailDrawer = read(
  "src/views/task/join-task/components/JoinTaskDetailDrawer.vue"
);
expectIncludes(
  detailDrawer,
  [
    "<el-drawer",
    "<el-descriptions",
    "<el-table",
    "进群任务详情",
    "进群明细",
    "账号",
    "群链接",
    "进群状态"
  ],
  "join task detail drawer"
);

for (const [label, content] of [
  ["page", page],
  ["table", table],
  ["editor drawer", editorDrawer],
  ["detail drawer", detailDrawer]
]) {
  if (content.includes("<table") || content.includes("<select")) {
    throw new Error(`${label} must use Element Plus table/select`);
  }
  if (content.includes("@/utils/http") || content.includes("axios")) {
    throw new Error(`${label} must use src/api wrapper only`);
  }
}

console.log("join task menu verification passed");

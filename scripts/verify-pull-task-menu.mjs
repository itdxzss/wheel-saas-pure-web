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
    'path: "/task/pull"',
    'component: "task/pull-task/index"',
    'name: "TaskPull"',
    'title: "拉群任务"',
    'module_key: "pull_task"',
    'perm_key: "tenant:pull_task:view"'
  ],
  "pull task route"
);

const requiredFiles = [
  "src/api/pull-task.ts",
  "src/views/task/pull-task/constants.ts",
  "src/views/task/pull-task/composables/usePullTaskPage.ts",
  "src/views/task/pull-task/components/PullTaskCreateDrawer.vue",
  "src/views/task/pull-task/components/PullTaskDetailDrawer.vue",
  "src/views/task/pull-task/index.vue"
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`required pull task file is missing: ${file}`);
  }
}

const api = read("src/api/pull-task.ts");
expectIncludes(
  api,
  [
    "export interface PullTaskRow",
    "export interface CreatePullTaskRequest",
    "export interface PullTaskGroupRow",
    "listPullTasks",
    '"/api/pull-tasks"',
    "createPullTask",
    "getPullTaskDetail",
    "listPullTaskGroups",
    "startPullTask",
    "pausePullTask",
    "stopPullTask",
    "batchDeletePullTasks",
    "supplementPullTaskRows"
  ],
  "pull task api"
);

const constants = read("src/views/task/pull-task/constants.ts");
expectIncludes(
  constants,
  [
    "pullTaskColumns",
    "pullTaskStatusOptions",
    "pullTaskStatusLabel",
    "pullTaskStatusTagType",
    "groupRowStatusOptions",
    "formatEpoch"
  ],
  "pull task constants"
);

const composable = read(
  "src/views/task/pull-task/composables/usePullTaskPage.ts"
);
expectIncludes(
  composable,
  [
    "usePullTaskPage",
    "refreshTasks",
    "openCreateDrawer",
    "createTask",
    "openDetailDrawer",
    "refreshDetailGroups",
    "supplementPullers",
    "deleteSelected",
    "runTaskAction",
    "loadGroupLinks"
  ],
  "pull task composable"
);

const page = read("src/views/task/pull-task/index.vue");
expectIncludes(
  page,
  [
    'name: "TaskPull"',
    "拉群任务",
    "pull-task-page",
    "pull-task-search",
    "PureTableBar",
    "WheelPagination",
    "<el-form",
    "<el-table",
    'type="selection"',
    "PullTaskCreateDrawer",
    "PullTaskDetailDrawer",
    "新增拉群任务",
    "批量删除",
    "任务名称",
    "任务状态",
    "任务类型",
    "是否交单",
    "群组是否封禁",
    "操作员",
    "查看详情"
  ],
  "pull task page"
);

const createDrawer = read(
  "src/views/task/pull-task/components/PullTaskCreateDrawer.vue"
);
expectIncludes(
  createDrawer,
  [
    "<el-drawer",
    "<el-form",
    "<el-tabs",
    "基础信息",
    "角色分组",
    "拉群参数",
    "群信息与数据",
    "老群链接",
    "WS链接分组",
    "上传料子文件",
    "上传水军文件"
  ],
  "pull task create drawer"
);

const detailDrawer = read(
  "src/views/task/pull-task/components/PullTaskDetailDrawer.vue"
);
expectIncludes(
  detailDrawer,
  [
    "<el-drawer",
    "<el-table",
    "拉群任务详情",
    "批量补充拉手",
    "导出报表",
    "导出群链接",
    "导出任务资源",
    "批量群组操作",
    "批量任务操作"
  ],
  "pull task detail drawer"
);

for (const [label, content] of [
  ["page", page],
  ["create drawer", createDrawer],
  ["detail drawer", detailDrawer]
]) {
  if (content.includes("<table") || content.includes("<select")) {
    throw new Error(`${label} must use Element Plus table/select`);
  }
  if (content.includes("@/utils/http") || content.includes("axios")) {
    throw new Error(`${label} must use src/api wrapper only`);
  }
}

console.log("pull task menu verification passed");

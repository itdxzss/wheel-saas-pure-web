import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(path) {
  return readFileSync(join(root, path), "utf8");
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
    'path: "/task/group-marketing"',
    'component: "task/group-marketing/index"',
    'name: "TaskGroupMarketing"',
    'title: "群组营销任务"',
    'module_key: "marketing_task"',
    'perm_key: "tenant:marketing_task:view"'
  ],
  "group marketing route"
);

const requiredFiles = [
  "src/api/marketing-task.ts",
  "src/api/marketing-template.ts",
  "src/views/task/group-marketing/constants.ts",
  "src/views/task/group-marketing/composables/useGroupMarketingTaskPage.ts",
  "src/views/task/group-marketing/components/GroupMarketingTaskTable.vue",
  "src/views/task/group-marketing/components/GroupMarketingCreateDrawer.vue",
  "src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue",
  "src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.vue",
  "src/views/task/group-marketing/index.vue"
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`required group marketing file is missing: ${file}`);
  }
}

const api = read("src/api/marketing-task.ts");
expectIncludes(
  api,
  [
    "export interface MarketingTaskRow",
    "export interface CreateMarketingTaskRequest",
    "export interface MarketingAccountTree",
    "listMarketingTasks",
    '"/api/marketing-tasks"',
    "createMarketingTask",
    "getMarketingTaskDetail",
    "startMarketingTask",
    "stopMarketingTask",
    "batchDeleteMarketingTasks",
    "fetchMarketingAccountTree",
    "updateTaskMarketingTemplate"
  ],
  "marketing task api"
);

const page = read("src/views/task/group-marketing/index.vue");
expectIncludes(
  page,
  [
    'name: "TaskGroupMarketing"',
    "GroupMarketingTaskTable",
    "GroupMarketingCreateDrawer",
    "GroupMarketingDetailDrawer",
    "GroupMarketingMaterialDrawer",
    "群组营销任务",
    "新增群组营销任务",
    "批量删除",
    "最后发送时间"
  ],
  "group marketing page"
);

const composable = read(
  "src/views/task/group-marketing/composables/useGroupMarketingTaskPage.ts"
);
expectIncludes(
  composable,
  [
    "useGroupMarketingTaskPage",
    "loadTasks",
    "createTask",
    "deleteSelected",
    "openDetailDrawer",
    "openCreateDrawer",
    "openMaterialDrawer",
    "onSelectionChange"
  ],
  "group marketing composable"
);

const table = read(
  "src/views/task/group-marketing/components/GroupMarketingTaskTable.vue"
);
expectIncludes(
  table,
  [
    "PureTableBar",
    "<el-table",
    'type="selection"',
    "营销账号在线数量",
    "营销账号封禁/禁言",
    "营销群组数量",
    "发送条数",
    "发送状态",
    "明细",
    "停止",
    "启动",
    "修改营销素材",
    "WheelPagination"
  ],
  "group marketing table"
);

const createDrawer = read(
  "src/views/task/group-marketing/components/GroupMarketingCreateDrawer.vue"
);
expectIncludes(
  createDrawer,
  [
    "<el-drawer",
    "<el-form",
    "<el-tree",
    "选择账号分组",
    "营销模板",
    "发送状态",
    "单轮发送数量",
    "发送间隔",
    "发送前检查账号在线",
    "跳过异常群组",
    "失败后自动重试"
  ],
  "group marketing create drawer"
);

const detailDrawer = read(
  "src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue"
);
expectIncludes(
  detailDrawer,
  [
    "<el-drawer",
    "<el-table",
    "当前状态",
    "发言号码",
    "群组链接",
    "群组名称",
    "最近原因"
  ],
  "group marketing detail drawer"
);

const materialDrawer = read(
  "src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.vue"
);
expectIncludes(
  materialDrawer,
  [
    "<el-drawer",
    "<el-form",
    "修改营销素材",
    "模板名称",
    "正文",
    "推广链接",
    "按钮设置"
  ],
  "group marketing material drawer"
);

console.log("group marketing task verification passed");

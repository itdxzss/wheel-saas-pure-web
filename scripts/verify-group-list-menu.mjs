import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`missing file: ${relativePath}`);
  }
  return readFileSync(fullPath, "utf8");
}

function assertIncludes(content, snippets, label) {
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(`${label} is missing required snippet: ${snippet}`);
    }
  }
}

const routes = read("mock/asyncRoutes.ts");
assertIncludes(
  routes,
  [
    'path: "/group/list"',
    'component: "group/list/index"',
    'name: "GroupList"',
    'title: "群组列表"',
    'module_key: "ws_group"',
    'perm_key: "tenant:group_link:view"'
  ],
  "group list route"
);

const api = read("src/api/group.ts");
assertIncludes(
  api,
  [
    "GroupListRow",
    "GroupDetail",
    "GroupMember",
    "listGroups",
    "batchDeleteGroups",
    "getGroupDetail",
    "updateGroupProfile",
    "updateGroupSettings",
    "promoteGroupMembers",
    "demoteGroupMembers",
    "kickGroupMembers",
    "uploadGroupAvatar",
    '"/api/group-links"'
  ],
  "group api"
);

const constants = read("src/views/group/list/constants.ts");
assertIncludes(
  constants,
  [
    "groupListColumns",
    "groupStatusOptions",
    "groupOriginOptions",
    "membershipStateOptions",
    "群名称",
    "群链接",
    "来源文件",
    "群状态",
    "群人数",
    "管理员",
    "来源",
    "时间",
    "操作"
  ],
  "group list constants"
);

const page = read("src/views/group/list/index.vue");
assertIncludes(
  page,
  [
    "group-list-page",
    "group-list-search",
    "GroupListTable",
    "GroupMemberDrawer",
    "useGroupListPage",
    "<el-form",
    "<el-select",
    "搜索：群名称 / 群链接 / 管理员 / 来源文件",
    "全部状态",
    "全部来源",
    "全部关系"
  ],
  "group list page"
);

const composable = read("src/views/group/list/composables/useGroupListPage.ts");
assertIncludes(
  composable,
  [
    "useGroupListPage(): GroupListPageState",
    "listGroups",
    "batchDeleteGroups",
    "ElMessage",
    "ElMessageBox",
    "openMemberDrawer",
    "openJoinTask",
    "deleteSelectedGroups"
  ],
  "group list composable"
);

const table = read("src/views/group/list/components/GroupListTable.vue");
assertIncludes(
  table,
  [
    "PureTableBar",
    "WheelPagination",
    "<el-table",
    'type="selection"',
    "批量删除",
    "群组信息",
    "进群任务",
    "删除",
    "群名称",
    "群链接",
    "来源文件",
    "群状态",
    "群人数",
    "管理员",
    "来源",
    "时间",
    '#default="{ dynamicColumns }"'
  ],
  "group list table"
);

const drawer = read("src/views/group/list/components/GroupMemberDrawer.vue");
assertIncludes(
  drawer,
  [
    "<el-drawer",
    "<el-upload",
    "<el-switch",
    "<el-table",
    "群详情",
    "群头像",
    "群名称",
    "群备注",
    "限时消息",
    "群组权限",
    "群成员列表",
    "设置管理员",
    "取消管理员",
    "踢出",
    "成员数据待接入",
    "updateGroupProfile",
    "updateGroupSettings",
    "promoteGroupMembers",
    "demoteGroupMembers",
    "kickGroupMembers",
    "uploadGroupAvatar"
  ],
  "group member drawer"
);

for (const [label, content] of [
  ["page", page],
  ["table", table],
  ["drawer", drawer]
]) {
  if (content.includes("<table") || content.includes("<select")) {
    throw new Error(`${label} must not use self-drawn table/select`);
  }
  if (content.includes("@/utils/http") || content.includes("axios")) {
    throw new Error(`${label} must not import http/axios directly`);
  }
}

console.log("group list menu verification passed");

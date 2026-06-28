# 群组列表前端迁移

## 目标
- 将旧 SaaS 的「群组列表」迁移到 `wheel-saas-pure-web`。
- 前端先完整落出列表、成员抽屉、编辑入口、头像入口、权限开关和成员操作入口。
- 严格使用 pure-admin-thin / Element Plus，不迁移旧项目自绘表格、select、pager、drawer。

## 口径
- 新前端当前对接 armada 风格接口，列表主数据使用 `/api/group-links`。
- 旧 wheel 的 `/api/tenant/ws-groups` 成员详情、群组 profile、权限和成员操作能力在前端预留 API 函数；后端未接通时显示真实失败/待接入提示，不做假成功。
- 路由使用 `/group/list`，菜单名「群组列表」，权限沿用 `tenant:group_link:view`。

## 文件规划
- `src/api/group.ts`：群组列表与预留操作 API。
- `src/views/group/list/index.vue`：页面容器和筛选区。
- `src/views/group/list/composables/useGroupListPage.ts`：列表状态、查询、删除、抽屉状态。
- `src/views/group/list/components/GroupListTable.vue`：表格、列设置、分页、行操作。
- `src/views/group/list/components/GroupMemberDrawer.vue`：群组信息抽屉。
- `src/views/group/list/constants.ts`：表格列和选项常量。
- `mock/asyncRoutes.ts`：开发期动态路由兜底。
- `scripts/verify-group-list-menu.mjs`：结构验收脚本。

## 验证
- `node scripts/verify-group-list-menu.mjs`
- `npm run typecheck`
- `npm run build`

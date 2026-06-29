# 进群任务前端迁移实施计划

## Goal

把 wheel「进群任务」迁到 `wheel-saas-pure-web`，对接 armada 一期 CRUD 切片：列表、筛选、创建、编辑、复制、明细、批量删除。严格限制在前端页面/API/路由范围，不补 armada 未提供的启动接口。

## Architecture

- API：新增 `src/api/join-task.ts`，只通过 `armadaRequest` 访问 `/api/join-tasks`。
- Route：在 mock async routes 的任务中心添加 `/task/join`，用于当前纯前端动态菜单兜底。
- Page：遵守现有任务页拆分方式，落在 `src/views/task/join-task/`。
- Components：复用 `PureTableBar`、`WheelPagination`、Element Plus `el-table/el-drawer/el-form/el-select/el-input-number` 等公共组件。
- State：页面状态集中在 `useJoinTaskPage.ts`，组件只承接展示和事件。

## Steps

1. 写结构校验脚本 `scripts/verify-join-task-menu.mjs`，先验证缺口存在。
2. 新增 join-task API 类型和函数，字段保持 armada camelCase wire。
3. 新增 constants，统一状态、分配方式、明细状态、时间格式和列配置。
4. 新增 composable，封装列表刷新、筛选、抽屉、创建/编辑/复制、删除、详情明细。
5. 新增列表、编辑抽屉、详情抽屉和入口页面。
6. 添加路由，支持群组列表 query 预填群链接和任务名。
7. 运行结构校验、typecheck、lint/stylelint、build，必要时修正。

## Non-Goals

- 不实现启动、暂停、执行引擎、协议调用。
- 不新建基础表格/分页/抽屉组件。
- 不改账号分组、账号列表、群组列表既有逻辑，除非目标页面路由连通必须。

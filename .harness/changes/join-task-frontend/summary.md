# join-task-frontend

## Scope

实现任务中心「进群任务」前端迁移，覆盖 armada 一期 CRUD 切片：列表、筛选、创建、编辑、复制、详情明细、批量删除。

## Files

- `mock/asyncRoutes.ts`
- `src/api/join-task.ts`
- `src/views/task/join-task/**`
- `scripts/verify-join-task-menu.mjs`
- `docs/superpowers/plans/2026-06-29-join-task-frontend.md`

## Harness Notes

- 仅触达 join-task 前端 API、页面、路由 mock 与本次校验脚本/说明文档。
- 页面复用 pure-admin/Element Plus 公共能力，不自建 table/select/pager/dialog/drawer 基础组件。
- 页面层不直接依赖 axios/http，所有请求通过 `src/api/join-task.ts`。
- armada 当前无启动端点，本次不暴露 `startJoinTask` 或启动按钮。
- 群组列表跳转 `/task/join?from=group-list&groupId&groupName&link` 时预填任务名和群链接；账号分组仍在进群任务表单中选择。

## Verification

- ✅ `node scripts/verify-join-task-menu.mjs`
- ✅ `npm run typecheck`
- ✅ `./node_modules/.bin/eslint --max-warnings 0 mock/asyncRoutes.ts src/api/join-task.ts src/views/task/join-task --fix`
- ✅ `./node_modules/.bin/stylelint --fix "src/views/task/join-task/**/*.vue" --cache-location node_modules/.cache/stylelint/`
- ✅ `npm run build`

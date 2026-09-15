# 账号管理 / 新号注册

## 用户确认

2026-09-15：将 Grizzly 号码采购、接码和 Cobalt 注册页面放在「账号管理」下，独立菜单命名「新号注册」。本轮范围是入口与页面归属调整。

## 实现

- 路由 `/account/registration`，页面 `account/registration/index`，组件名和菜单标识 `AccountRegistration`。
- 原 `account/import` 的注册抽屉迁为独立页面；表单、任务表、状态展示和 composable 同步迁到 `account/registration/`，移除账号导入中的旧入口。
- 页面包含「新建注册」「注册任务」两个页签，复用现有注册 API 和账号分组 API；保留价格库存、采购数量、账号类型、分组与逐项结果。
- 页面显示时每 5 秒刷新任务，停用或卸载时停止刷新；提交未确认时保留原请求并阻止路由离开，避免在丢失原请求编号后重复下单。
- 开发 mock 菜单与菜单编辑器组件候选同步新增；生产菜单仍来自 `/api/tenant/me/menus`。
- 后端配套 V194 菜单迁移和组件白名单，复用 `tenant:account:edit`，保持已有角色授权规则。

## 验证

- 注册请求生命周期、账号导入表格和动态菜单树现有测试共 15 项通过，0 失败；命令：`node --import tsx --import ./src/api/__tests__/node-test-alias.mjs --test src/views/account/registration/composables/useAccountRegistration.test.ts src/views/account/import/components/AccountImportTable.test.ts src/router/menu-tree.test.ts`。
- `pnpm typecheck`（tsc + vue-tsc）通过；新页面、系统菜单候选和开发菜单的定向 ESLint 通过。
- `pnpm exec vite build --outDir /private/tmp/new-account-menu-build-20260915` 通过，构建输出保存在临时目录，未覆盖共享 dist。
- `git diff --check` 通过。尚未进行浏览器运行时验收；后端菜单和 H2 迁移验证见 Armada 同名 change 记录。
- 本轮不改采购/注册编排，不部署、不实际购号；真实接码、注册、登录验收仍未完成。

## 回滚

按本轮文件差异回退页面和菜单调整，保留原有注册业务代码及其他会话修改。生产菜单迁移仅在获准部署的目标环境通过 Flyway 执行；本轮未修改任何共享库。

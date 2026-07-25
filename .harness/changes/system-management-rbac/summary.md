# 变更记录：租户系统管理

- 日期 / 分支: 2026-07-24 / `feature/system-management-rbac`
- 需求来源: 系统管理（租户管理员版）PRD及逐项确认结果
- 状态: 开发完成，待联调验收

## 目标

交付租户内用户、角色、菜单管理页面，并对接 Armada RBAC 管理接口。

## 范围

- In scope: 用户增改、启停、重置密码与多角色绑定；角色增改、启停与菜单授权；菜单树增改与启停。
- Out of scope: 真实登录、当前用户动态菜单切换、最高控、审计日志。

## 影响模块

- 路由: 生产菜单由 `/api/tenant/me/menus` 返回；拉群营销详情路由仅在列表菜单已授权时追加。
- 页面: `src/views/system/user`、`role`、`menu`。
- API: `src/api/system-user.ts`、`system-role.ts`、`system-menu.ts`。
- Store: 无。
- 权限: 使用初始化 SQL 中的 `tenant:system-*` 权限编码。

## 关键设计决策

- 复用 `RePureTableBar`、Element Plus 表单、表格、弹窗和树，不新增 UI 依赖。
- 系统管理和业务菜单均消费真实动态菜单，不使用生产 Mock 兜底。
- 页面不保存或展示密码哈希，密码仅在新增和重置表单内短暂存在。

## 验证

- API、页面及路由契约测试：10 项全部通过。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。当前 pnpm 版本不会为 CDN 外部模块自动创建根目录 `vue-demi` 链接，本地验证时补齐依赖链接后构建成功，未修改业务依赖或锁文件。
- 任务中心菜单修正：路由契约 6 项、`pnpm typecheck`、`pnpm build` 均通过。
- 格式及空白检查：Prettier、`git diff --check` 通过。

## 人工验收

- [ ] 菜单进入页面
- [ ] 用户新增、编辑、启停、重置密码
- [ ] 用户多角色选择
- [ ] 角色新增、编辑、启停、权限树保存
- [ ] 菜单树新增、编辑、启停
- [ ] loading、空数据与错误态

## 遗留 / 跟进

- 第一套测试环境部署后，使用管理员账号核验任务中心九个菜单及拉群营销详情跳转。

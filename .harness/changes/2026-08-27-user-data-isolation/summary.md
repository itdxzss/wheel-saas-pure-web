# 变更记录：用户数据隔离前端收口

- 日期 / 分支 / worktree: 2026-08-27 / `codex/user-data-isolation` / `/Users/daishuaishuai/IdeaProjects/wheel-saas-pure-web-user-data-isolation`
- 后端配套: `/Users/daishuaishuai/IdeaProjects/armada-user-data-isolation`
- 状态: 代码完成，已随 `caf5f5f0` 部署 test1；页面跨路由实操受浏览器新标签认证态阻塞

## 目标

前端不扩大后端权限，只保证授权拒绝不会破坏登录态，并防止同一浏览器切换租户或用户后恢复前一个用户的私有业务状态。

## 行为边界

- 只有 HTTP 401、业务码 `40101` / `40104` 清理登录态并跳转登录页。
- HTTP 403 和业务码 `40302` 保留当前登录态，交给业务页面展示“无权访问”；404/409 延续现有业务错误处理，不触发退出。
- 登录成功后从可信登录响应保存 `tenantId` 与 `userId`，私有缓存键统一追加 `tenant-{tenantId}:user-{userId}`。
- 已收口账号单号上线冷却、标准拉群链接草稿/计划快照、拉群营销等待池 token、普群活动任务 ID 和幂等提交快照。
- 登录身份缺失或不合法时缓存键返回 `null`，禁止恢复或持久化私有状态；部署前已存在、未包含用户/租户 ID 的会话因此安全降级为不缓存，重新登录后恢复正常缓存能力。
- IP 资源仍为平台/租户共享，本次前端不增加用户级 IP 缓存或过滤。

## 验证

- 先红后绿：403/`40302` 不退出登录、用户缓存键分区和四处私有浏览器状态契约测试。
- 焦点回归 51 tests：全部通过，失败 0、跳过 0。
- `pnpm typecheck`：通过。
- `pnpm build`：生产构建通过。
- 项目全量 Node 测试：与既有基线相同，仅 5 个未修改测试套件失败（`group.test.ts` 1、`GroupMemberDrawer` 1、`GroupPermissions` 3），本次无新增失败。
- `git diff --check`：通过。
- 前端制品已发布 test1；Playwright 登录 U1 成功并验证账号列表只显示 2 条 U1 数据，但跨路由进入分组页时认证态丢失（导航约 8-14s 后回登录页），因此未继续重复操作。

## 上线提示

- 前后端需在同一维护窗口切换；后端迁移和 owner-aware 服务先就绪，再发布前端。
- 建议切换后让存量用户重新登录一次，使 `user-info` 获得可信 `tenantId` / `userId`；未重新登录时仅影响页面缓存恢复，不会放宽数据权限。

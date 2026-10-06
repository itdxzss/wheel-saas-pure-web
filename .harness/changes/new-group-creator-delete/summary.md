# NEW_GROUP 管理员接管后注销建群账号

本变更在独立 worktree / 分支 `codex/new-group-creator-delete-20261006` 实现。

- 配置字段 `creatorDeleteAfterTakeover`，存量缺失按关闭解释，仅 NEW_GROUP 生效；与 `creatorLeaveAfterPull` 独立。
- 创建页面在建群人分组下说明永久注销与 Android 主设备限制；启用时必须配置接管管理分组。
- 配置贯通服务端草稿、创建请求、已保存任务配置；启动后只读。
- 阶段追加 11/12，展示注销及等待清理状态，不把 ACCEPTED 当作完成。
- Android 主设备、身份、租户、账号独占与真实协议验证由后端执行，前端不接触注销授权材料。

验证：72 个相关测试通过；tsc 与 vue-tsc 通过；修改文件 ESLint 通过；Vite 生产构建通过。测试与构建输出见 /private/tmp/creator-delete-frontend-tests.log、creator-delete-web-build.log。本次不部署、不操作真实账号。

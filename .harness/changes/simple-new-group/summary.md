# 新群模式（新）

- 在独立 `SIMPLE_NEW_GROUP` 模式中直接创建正式任务，复用即时创建的文件选择、参数与幂等请求流程，不生成旧草稿。
- 保留建群人、管理、拉手、可选站台，管理/拉手完成归档；简化群资料为群名、头像、公告。
- 注销默认关闭；明确仅支持 Android 主设备，并在管理接管及群设置确认后执行；不执行真实注销。
- 后端契约：multipart POST `/api/pull-tasks/standard/simple-new-group`，`request` JSON 和可选多份 `files`；每份料子建一群。
- 不包含互加、A/a 提权、清原成员、群主退群及高级群设置。
- 首次按 1–3 人范围拉人，10–15 秒随机间隔，`earlyPullCallCount=0`。
- 验证：拉群/API 相关 187 条测试全通过（含新模式提交白名单、可选资料、站台依赖、管理必选、安全参数和幂等重试测试）。
- `npm run typecheck`、`npm run build` 通过；改动文件 ESLint、Stylelint 通过。
- 全项目只读 ESLint 有 30 处格式错误，均在未修改文件，未扩大修改范围。
- 本地隔离浏览器预览验证管理分组/群公告、旧选项隐藏、注销默认关闭及桌面/窄屏布局；修正随机间隔输入框宽度。仅使用桩数据，真实 API 禁用。
- 截图证据：[桌面表单（本地桩预览）](./local-fixture-desktop.png)。预览服务已停止。
- 使用真实 `PullTaskCreateDrawer` 补充[完整 Tab 预览](./local-fixture-tabs.png)，旧“新群模式”和新“新群模式（新）”同屏；已实际切换验证各自表单。仅桩数据，服务已停止。
- simple 内部阶段 4 显示“准备拉手”，不表示互加联系人。
- 未连接测试环境，未创建真实任务，未执行真实注销。

- 后续按用户要求迁回 wheel-saas-pure-web 主目录，主目录 typecheck 再次通过；授权 commit/push 并发布到 test1。

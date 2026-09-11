# 剧本任务创建页精简

- 2026-09-11，1.0.3-snapshot，本地实现与验证完成，未提交、未部署。
- 用户授权：移除任务内编排，推手分组显示账号数量，下方直接展示完整剧本预览；管理员改为每群从在控管理员随机选一个。
- 创建必须选择启用剧本；编辑已有草稿使用任务快照。清空剧本同时清空步骤，切换分组清空目标群及资格报告。
- 不展示管理员选号和默认间隔输入；保存步骤 accountId 全部为空，由后端启动时按群绑定。
- 复用现有消息预览，支持文本、图片、链接、按钮及等待区间。分组选项新增 accountCount。
- 后端设计与回退边界见 armada/.harness/changes/script-task-auto-admin/summary.md；无数据库和 Redis 结构变更。
- 已完成：表单测试 6 项、本地 Playwright 7 项；typecheck、相关 ESLint/Stylelint/Prettier、build 均通过。
- 浏览器覆盖：选择/失败回退/切换/清空/迟到剧本响应、分组账号数与零账号组、切换分组清空目标群、无手动账号保存、旧草稿沿用内容快照、100 条消息滚动及窄屏、原详情/手机号展示回归。
- 浏览器测试全程拦截业务 API，没有访问或发送真实账号消息。本机 watcher 用 CHOKIDAR_USEPOLLING，监听本地端口及 Chrome 启动经工具审批执行。
- 截图：`test-results/script-marketing/script-marketing-local-sel-1c4b4-out-manual-account-bindings/selected-script.png`，已人工检查布局。
- 验证日志：`/private/tmp/script-auto-admin-e2e.log`、`/private/tmp/script-auto-admin-typecheck.log`、`/private/tmp/script-auto-admin-build.log`。
- 保留开工前已有变更文件；只删除已无调用方的任务编排器及前端手动账号查询封装。

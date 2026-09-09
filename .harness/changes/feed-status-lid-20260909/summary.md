# 动态任务 LID 受众准备

用户授权补齐页面与后端，1714 已封禁，不参与验证。沿用动态发布任务入口。

- 明细显示当前候选受众状态、来源、人数和准备失败原因。
- 无具名通讯录时 Android 自动准备云端 LID；Web 仍依赖已有通讯录。
- operate 权限可重新准备，按钮不会重发终态任务。
- 明细打开时自动刷新；关闭与卸载清理定时器，过期响应不覆盖当前任务。
- 候选数不代表双向好友、实际发送受众或已送达人数；协议层按实时隐私过滤。

状态：本地实现与验收完成。部署未执行。

验证：typecheck、ESLint、Stylelint、build 通过；audience.test.ts 2 项通过；e2e/feed-status-lid.spec.ts 1 项浏览器测试通过（失败→准备中→就绪、禁止重复准备、关闭停轮询、权限隐藏）。合成测试截图见后端交付目录。Editor 原有大组件本次只补提示，最终 500 行；逻辑仍在现有 composable，未超过 600 行红线。

前后端接口 `POST /api/feed-tasks/{id}/data/{accountRowId}/audience/refresh` 与 GET data 的 audience 字段对齐，未改菜单、登录或权限语义。

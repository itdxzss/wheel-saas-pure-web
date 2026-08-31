# 变更记录：超链策略前端

- 日期：2026-08-30
- 主仓分支：`1.0.3-snapshot`
- 状态：已同步主仓并与后端 V168 契约对齐，保持未暂存、未提交

## 范围

- 新增超链策略名称、状态和任务模式筛选及分页列表。
- 新增创建、编辑、启停和删除交互；启停复用带 `version` 的更新接口，不新增 toggle 端点。
- 策略只保存任务类型、周期、账号筛选、最大执行账号、最大使用账号和单号发送上限。
- 复用超链任务完整账号筛选抽屉，并通过策略专用无钱包 context/match-count 接口加载候选与实时试算。
- `options` 只返回已启用模板；任务保存时复制参数到独占 `TASK_SNAPSHOT`，任务只强关联该快照，
  `sourceStrategyId` 仅保留弱来源追溯。

## 约束

- `maxExecutingAccounts` 为唯一执行账号并发字段，范围 0～100；0 表示 AUTO/均分，不暴露任务隐藏常量
  `accountSendConcurrency`。
- 周期策略间隔至少 30 分钟，且每轮最大账号数至少为 1。
- 不保存消息内容、数据包、启动时间或消息间隔。
- API 字段对齐后端已落代码契约：`name/taskMode/enabled/maxSendPerAccount/cycleIntervalMinutes`。

## 验证

- 全部超链前端测试：140/140 通过（市场分析代码未合入）。
- `tsc --noEmit`：通过。
- `vue-tsc --noEmit`：通过。
- 主仓 Vite 生产构建：通过（20.56s）。
- 变更文件 ESLint 和 Stylelint：通过。

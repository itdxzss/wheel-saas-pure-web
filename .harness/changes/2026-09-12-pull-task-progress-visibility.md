# 拉群任务执行进度口径修复

## 目标与行为

任务 #208 的历史未确认结果被释放重试后，页面只显示当前失败/未知人数，无法看出等待与重复提交成本。逐群列表与单群详情现使用同一料子进度展示：

- 当前成功、失败、结果未知人数。
- 等待结果人数、待执行人数，以及待执行中已有提交历史的待重试人数。
- 已提交料子的累计尝试次数、其中当前结果仍未确认的尝试次数。两项均按次数展示，排除站台与未提交计划。
- 已取消人数，避免封群历史“剩余 0”被误认为全部拉完。
- 最近拉入成功时间来自成功料子事实，不使用调度或执行更新时间。
- 执行终止且仍有未知结果时，显示“已结束，仍有 N 人的结果待核实”。

## API 与边界

后端 `materialSummary` 追加 `retryPendingCount`、`submittedAttemptCount`、`unconfirmedAttemptCount`、`lastSuccessfulAt`，复用已有 `submittedCount`。旧响应缺字段时不显示新统计，也不补假零值。没有新增数据库字段、权限、任务动作或 API 请求。

统计只覆盖当前执行行的料子；换群历史保留各自结果。累计次数依据已存在的逐号码提交历史，当前人数依据料子最新状态。未做远程数据库修改、部署或账号动作。

## 验证

- 新增展示回归先红后绿；`standard-execution-display.test.ts`、`PullTaskExecutionDetailDrawer.test.ts`、`PullTaskIndex.test.ts` 共 20 项通过。
- `tsc --noEmit` 与 `vue-tsc --noEmit --skipLibCheck` 通过。
- 修改文件 ESLint 与新增组件 Stylelint 通过。
- Vite 生产构建通过，输出在 `/private/tmp/pull-progress-web-build`。
- `pnpm` 11 的自动依赖检查要求清理现有依赖目录，因无 TTY 中止；验证改用现有 `node_modules/.bin`，未重新安装或修改依赖。
- 尚未在部署后的真实页面验收。

## 回滚

仅回退本次进度组件、只读字段和接入点；不触及写入流程与历史数据。

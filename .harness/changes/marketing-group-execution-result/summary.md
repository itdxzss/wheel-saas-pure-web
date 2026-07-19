# 营销任务群组执行情况

## 目标

在营销任务明细的群组行展示“发送成功 / 发送失败”，并让打开的执行中任务每 5 秒刷新一次详情。

## 影响模块

- `src/api/marketing-task.ts`：消费群组 `executionResult` 契约。
- 营销任务详情抽屉：新增“执行情况”列和中文标签。
- 营销任务页面 composable：管理执行中详情轮询和清理。

## 关键决策

- `SUCCESS` 展示绿色“发送成功”，`FAILED` 展示红色“发送失败”，无结果或未知值展示 `-`。
- 仅详情响应状态为 2 时启动 5000ms 轮询；状态变化后立即停止。
- 后台请求不展示 loading 遮罩且不允许重叠。
- 切换任务、关闭抽屉或页面销毁后，旧响应不得覆盖当前详情。
- 后台连续失败保留旧数据，每段连续失败只提示一次；刷新成功后重置提示状态。

## API

消费 `accountTargets[].groups[].executionResult`：`SUCCESS | FAILED | null`。

## 验证结果

- 群营销目录 Node 测试：51 条通过，0 失败。
- 本地 `tsc --noEmit`：通过。
- 本地 `vue-tsc --noEmit --skipLibCheck`：通过。
- 定向 ESLint、Prettier、Stylelint：通过。
- `npm run build`：Vite 生产构建通过。
- `pnpm typecheck` 未进入项目检查：Corepack 联网解析 pnpm 时遇到证书错误；已使用仓库本地 `tsc` / `vue-tsc` 完成等价检查。

## 遗留风险

- 后端真库聚合测试仍需在 Flyway 校验一致、schema 完整的测试库补跑。

## 回滚方案

回退 API 类型、执行情况映射与列、详情轮询和对应测试；后端新增可空字段对旧前端保持兼容。

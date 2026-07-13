# 营销任务最近群状态

## 背景

营销任务明细需要展示每个群在该任务最近一次发送时的状态，而不是当前实时状态。

## 改动

- 群组明细在“单群发送条数”前新增“状态”。
- 支持正常、封禁、没有权限、未确认四种状态。
- 正常使用绿色标签，封禁使用红色标签，没有权限使用紫色标签，未确认使用灰色标签。
- 缺失或未来新增的未知状态统一回退为“未确认”。

## 契约

`MarketingTaskGroupStatRow.groupStatus` 接收 `NORMAL | BANNED | NO_PERMISSION | UNCONFIRMED`。

## 验证

- `node --test` 状态映射和明细抽屉测试通过，共 5 个测试。
- 仓库本地 `tsc --noEmit` 通过。
- 仓库本地 `vue-tsc --noEmit` 通过。
- `npm run build` 生产构建通过。
- `pnpm typecheck` 未执行到项目检查：Corepack 在当前网络隔离下无法访问 npm registry，已用本地二进制完成等价检查。

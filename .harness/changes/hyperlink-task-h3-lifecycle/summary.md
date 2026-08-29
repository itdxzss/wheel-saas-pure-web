# 变更记录：超链任务 H3 前端公共生命周期能力

- 日期 / 分支: 2026-08-29 / `codex/hyperlink-task-h3-lifecycle`
- 需求来源: H3 shared contract、lifecycle design 与 editor design 的 Quote/7 秒核对部分
- 状态: 已完成本分支实现与本地验证

## 目标

只提供 H3 的 Quote、create/update 提交入口、START/PAUSE/RESUME/STOP、准备回执轮询、重复提交与 40910 冲突处理公共能力，不复制 H1 页面或 H2 表单。

## 范围

- In scope: H3 API/类型、7 秒 Quote 交互门禁、PROCESSING 轮询与取消、FAILED/READY 回执、重复点击、稳定业务码和 40910 冲突结果。
- Out of scope: H1 列表页面、H2 编辑表单/核对弹框、权限按钮、协议 serializer、钱包与后端状态机。

## 影响模块

- API: `src/api/hyperlink-task-lifecycle.ts`；`src/api/armada.ts` 保留非零响应的稳定业务码。
- 公共领域能力: `src/views/hyperlink/task/domain/quote-review.ts`、`task-mutation.ts`。
- Composable: `src/views/hyperlink/task/composables/useTaskMutation.ts`。
- 页面 / 路由 / Store / 权限: 无改动。

## 关键设计决策

- H2 继续拥有完整 Save DTO；H3 的 create/update 使用泛型透传，不复制表单模型。
- 7 秒只决定确认按钮何时可用，报价有效性只比较服务端 `expiresAt`，金额不在前端重新计算。
- PROCESSING 只轮询当前提交，READY/FAILED 立即终止；组件销毁可取消，运行中第二次提交返回 `DUPLICATE`。
- `40910` 返回 `CONFLICT` 供 H2 保留表单并提示重新加载，不自动覆盖用户输入。

## 验证

- H3 新增 API、Quote 与 mutation 测试共 10 项通过。
- 全库 Node 测试的 H3 新增用例通过；全库总体仍受既存 Node CSS loader 错误和一项群详情旧断言影响，未伪报全绿。
- `tsc --noEmit`、`vue-tsc --noEmit --skipLibCheck`、改动 TS 定向 ESLint、Prettier check：通过。
- `vite build`：通过，产物 4.32 MB。
- 按用户要求只执行一次有效定向轮（前端因前置后端环境失败未启动）和一次相关广域轮，未追加第三轮。

## 遗留 / 跟进

- H1/H2 集成时只消费这些公共能力；本分支不合并 integration。
- 全库测试环境需要单独补齐 CSS loader，并处理既有群详情断言；不属于 H3。

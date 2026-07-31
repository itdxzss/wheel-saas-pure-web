# 拉群任务统一列表与全局设置

## 目标

- 按 PRD 将“拉群任务”菜单调整为普通拉群与拉群营销共用的九列一级列表。
- 接入任务类型、群组来源、阶段/阻塞原因、聚合统计、最近业务执行时间和后端允许操作。
- 增加租户级拉群营销全局设置，并在独立拉群营销配置页展示和校验。
- 新建入口先选择任务类型，普通拉群继续使用原创建流程，拉群营销进入现有独立配置页。

## 设计

- 设计文档：`../armada/docs/superpowers/specs/2026-07-31-pull-task-unified-list-global-settings-design.md`
- 后端实施计划：`../armada/docs/superpowers/plans/2026-07-31-pull-task-unified-list-global-settings.md`
- 涉及仓库：`armada`、`wheel-saas-pure-web`。
- 列表固定九列：任务信息、任务状态、群组处理进度、拉人结果、营销进度、消息发送、异常情况、剩余资源、时间/操作。
- 全局字段：营销静默时间、群组封控时间、单群营销账号上限。

## 边界

- 不合并或改写独立的“拉群营销”菜单及其既有业务。
- 不伪造拉群营销任务提交、执行结果或生命周期成功状态。
- 聚合统计缺失显示 `--`，存在统计行且值为零显示 `0`。
- 本轮不部署、不提交、不连接远程或真实数据库。

## 当前进度

- [x] 设计和实施计划已确认
- [x] 后端统一列表、全局设置与删除接口已实现
- [x] 前端类型化 API 与九列展示域已实现
- [x] 拉群任务九列表格与筛选已实现
- [x] 全局设置弹窗已实现
- [x] 普通拉群创建入口已恢复
- [x] 拉群营销配置页已接入全局设置
- [x] 前后端验证完成

## 实施路径

- `src/api/pull-task.ts`：统一列表、全局设置及普通任务既有接口契约。
- `src/views/task/pull-task/components/PullTaskTable.vue`：九列列表及统计悬浮明细。
- `src/views/task/pull-task/components/PullTaskGlobalSettingDialog.vue`：三项租户级设置。
- `src/views/task/pull-task/components/PullTaskTypeDialog.vue`：新增任务类型选择。
- `src/views/task/pull-task/components/PullTaskCreateDrawer.vue`：普通拉群原创建功能。
- `src/views/task/pull-task/create/`：拉群营销配置页读取、展示和校验全局设置。

## 验证结果

- 计划内 Node 测试 38/38 通过。
- `pnpm typecheck`、`pnpm build` 通过。
- 本次文件 Prettier、ESLint、Stylelint 检查通过。
- `git diff --check` 通过。

## 延期项

- 拉群营销任务提交和执行接口尚未确认，本轮继续明确阻断，不伪造成功结果。

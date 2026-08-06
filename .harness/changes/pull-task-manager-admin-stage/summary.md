# 拉群任务管理员设置阶段展示

## 目标

展示新的“管理员设置”阶段、管理员设置异常、PROMOTER 角色和 PROMOTE_MANAGER 动作，并在该自动提权阶段隐藏无效的手工“补充管理员”入口。

## 影响范围

- `src/api/pull-task.ts`
- `src/views/task/pull-task/**`

## 关键约束

- 当前异常继续以服务端 `reasonMessage` 为事实。
- 详情页明确标注群 JID、账号和号码均为服务端脱敏值。
- 不新增 UI 基础组件，不改变权限语义或 API 路径。
- 本地实现，不 commit、不部署。

## 进度

- [x] 失败测试
- [x] 最小实现
- [x] Node 测试、typecheck、build

## 验证

- 改动前 Node 聚焦测试：6/6 通过。
- 改动后早期 Node 聚焦测试：8/8 通过；最终直相关三套测试：4/4 通过。
- `pnpm typecheck`、`pnpm build`、`git diff --check`：通过。
- 本地未提交、未部署。

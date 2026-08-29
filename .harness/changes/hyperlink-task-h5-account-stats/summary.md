# 超链任务 H5 发信账号维度统计

- 分支: `codex/hyperlink-task-h5-account-stats`
- worktree: `frontend-h5-account-stats`
- 状态: 已完成

## 目标

实现可挂载进 H4 详情抽屉的账号统计 Tab，包含时间、发信国家、成功率筛选，以及查询、重置、刷新、导出、列设置、排序和分页。

## 约束与决策

- H5 不创建第二套 summary；刷新自身数据时向 H4 发出 `refresh-summary`。
- 用户本次明确要求成功率区间，按百分比 `0..100` 提交 `successRateMin/successRateMax`。
- “未分配”按后端 `bucketKey=0/accountId=null` 展示，国家和类型为空，存活天数 `0.0`。
- 使用既有 `PureTableBar` 列设置和 `WheelPagination`；API 统一收敛到 `src/api/hyperlink-task.ts`。

## 清单

- [x] API 类型与查询/异步导出客户端
- [x] AccountStatsTab 与账号单元格组件
- [x] 查询状态 composable、错误态和测试
- [x] 一次定向测试、一次最终相关回归和提交

## 验证

- 定向测试首次使用默认 `tsx` runner 时，7 项通过，2 个 worker 因未加载项目的 Node alias/CSS test loader 在启动阶段失败；无断言失败，未追加第二轮定向测试。
- 最终相关回归改用项目既有 `node-test-loader.mjs`：H5 与既有 hyperlink API/route 共 26 项通过、0 失败。
- `./node_modules/.bin/vue-tsc --noEmit --skipLibCheck` 通过。
- 未改 H4 summary；H5 刷新通过 `refresh-summary` 事件交给 H4 公共外壳。

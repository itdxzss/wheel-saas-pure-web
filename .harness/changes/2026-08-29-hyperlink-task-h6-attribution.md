# 变更记录：超链任务 H6 深度归因与访问分析

- 日期 / 分支: 2026-08-29 / `codex/hyperlink-task-h6-attribution`
- 需求来源: 用户 H6 任务、shared contract、竞品三个分析 Tab
- 状态: 已完成

## 目标

交付可嵌入 H4 详情外壳的深度归因、访问趋势、封号原因三个 Tab。

## 范围

- In scope: 双手机号筛选、统计条、11 列、远程排序、分页、异步导出、列设置、趋势图/表、六卡、解读、Top 3、封号分布和错误态。
- Out of scope: H4 详情抽屉、任务摘要接口、任务列表和其他超链任务能力。

## 影响模块

- 路由: 无；由 H4 详情外壳挂载。
- 页面: `src/views/hyperlink/task/components/`。
- API: H6 三个 GET、两个异步导出创建接口及 H4 公共作业轮询/下载调用。
- Store: 无。
- 权限: view、export、attribution_sensitive。

## 关键设计决策

- 三个 Tab 用 `HyperlinkAttributionTabs.vue` 聚合，但不创建 H4 抽屉或路由。
- 访问趋势图和数据表消费同一响应；PV 桶为空时统一显示 `—` 和明确口径，不用首访桶制造历史 PV。
- 列设置复用 `PureTableBar`；请求使用序列号避免旧响应覆盖新筛选，异步导出在卸载时停止轮询。

## 验证

- 定向测试首次启动时，worktree 无依赖目录，pnpm 尝试联网安装并因沙箱网络不可达停止；未产生用例失败。
- 最终 H6 合同回归：`node --import tsx --test ...`，2 个 suite、7 个测试全部通过。
- Vue 全量类型检查：`vue-tsc --noEmit --skipLibCheck` 通过。
- 相关文件 Prettier check 与 `git diff --check` 通过。

## 人工验收

- [ ] 三个 Tab 首次切入加载。
- [ ] 归因查询/重置/排序/分页/列设置/导出。
- [ ] 趋势 5 个范围、图表/数据表、导出和 PV 限制提示。
- [ ] 封号分布、空态与三个 Tab 错误重试。

## 遗留 / 跟进

- H4 合并后将 `HyperlinkAttributionTabs` 接入详情抽屉并传入 summary.successNum。

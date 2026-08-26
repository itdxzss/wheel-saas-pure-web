# 变更记录：群维度首次唯一分类（前端）

- 日期 / 分支 / worktree: 2026-08-26 / `codex/group-canonical-first-classification` / `.worktrees/group-canonical-first-classification`
- 状态: `LOCAL_VERIFIED`（待后端联调与 test1）
- 后端 `change_id`: `2026-08-26-group-canonical-first-classification`
- `scope_hash`: `316839dc898e558b494ff6835abf15cd55d942e8a730c927ba76a6c25be61825`

## 本仓范围

- 群组列表读取 canonical `groupClassification`。
- 已分类群每行最多显示一枚标签；`UNCLASSIFIED` 不猜测分类。
- 查询值域只保留 `HISTORICAL / POST_CONTROL`，移除 `BOTH`。
- 旧双布尔仅作一个发布窗口的 API 边界兼容，双 true/双 false 不由前端选边。
- 独立历史群管理页面和拉群任务的 `HISTORICAL` 资源来源语义不变。

## 任务清单

- [x] 先补 API、筛选、表格和页面合同失败测试
- [x] 实现 API 边界归一化与单分类 UI
- [x] 运行聚焦测试、typecheck 和 build
- [x] 记录验证输出与剩余兼容风险

## 验证

- 红灯：新 API 归一化模块不存在，旧列表仍读取两个布尔并可渲染双标签，合同测试按预期失败。
- `node --import tsx --test src/api/group-classification.test.ts src/views/group/list/components/GroupListTable.test.ts src/views/group/list/group-list-filters.test.ts src/views/group/list/group-member-availability.test.ts`：15/15 通过。
- `pnpm typecheck`：通过。
- `pnpm build:staging`：通过，Vite 产物构建完成。
- 针对改动文件的 ESLint 与 Prettier check：通过。
- `git diff --check`：通过。

## 剩余风险

- 尚未与后端候选版本做真实 API 联调；test1 仍需单独授权和验收。
- 旧双布尔仅在 `src/api/` 边界兼容一个发布窗口；新枚举有效时始终优先，双 true、双 false或非法枚举均收敛为 `UNCLASSIFIED`，前端不猜测。
- 独立历史群管理页面与拉群任务的资源来源语义未修改。

# 变更记录：群链接模式封群自动换群

- 日期 / 分支：2026-09-02 / `codex/group-link-ban-fallback-ui`
- 需求来源：封群自动换群能力误放在资源池模式，应归入群链接模式
- 状态：本地开发与聚焦回归完成，待测试环境验收

## 目标

新建普通拉群任务时不再展示独立资源池入口；用户在群链接模式选择群组分组即可获得后端自动换群能力。

## 范围

- In scope：隐藏新建页资源池模式入口，群链接分组文案说明封群自动换群。
- Out of scope：删除后端 `RESOURCE_POOL` 枚举、改动历史任务详情展示、部署。

## 影响模块

- 路由：无。
- 页面：普通拉群任务创建抽屉。
- API：契约不变，保留 `RESOURCE_POOL` 类型兼容历史数据。
- Store / 权限：无。

## 关键设计决策

- 只收口新建入口，不删除历史任务展示兼容逻辑。
- 新建入口只允许选择 `PASTED_LINK` / `NEW_GROUP`；历史资源池草稿和任务展示逻辑暂时保留兼容。

## 验证

- 页面静态测试与创建 composable 测试共 37 条，全部通过。
- TypeScript `tsc --noEmit`、Vue `vue-tsc --noEmit --skipLibCheck` 均通过。
- Vite 生产构建通过（3204 modules transformed）。
- `git diff --check` 通过。
- 前端全量测试仍有 5 条失败；已在未修改的主工作区复现完全相同结果，分布于 `group.test.ts`、`GroupMemberDrawer.test.ts`、`useGroupPermissions.test.ts`，与本次差异无关。

## 人工验收

- [ ] 新建页只有群链接模式和新群模式
- [ ] 群链接模式可选择群组分组
- [ ] 选择分组时显示封群自动换群说明
- [ ] 历史资源池任务详情仍可正常展示

## 遗留 / 跟进

- 测试环境真实封群验收在部署授权后进行。

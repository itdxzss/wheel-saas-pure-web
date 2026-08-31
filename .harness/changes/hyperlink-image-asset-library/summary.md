# 变更记录：超链图片素材库前端

- 日期：2026-08-30
- 目标分支：`1.0.3-snapshot`
- 后端设计：`../armada/docs/superpowers/specs/2026-08-29-hyperlink-image-asset-library-implementation-design.md`
- 状态：本地实现与自动化验证完成，尚未部署

## 变更概述

- 新增 `/hyperlink/library` 动态菜单承载的素材管理页。
- 新增鉴权 Blob 缩略图、串行批量上传、编辑、引用保护删除和素材选择器。
- 超链模板图片字段切换为稳定 Asset ID 选择，不再在保存模板前临时上传。
- 标签大小写敏感精确去重，最多 20 个；批量上传最多 100 张 JPEG，每张不超过 500KB。
- 移除超链模板旧直传 API 封装、表单文件状态和重复 JPEG 校验，保留唯一素材库上传路径。
- 素材库页头改为系统主题蓝色识别区；筛选区交互保持不变，素材卡片改为 16:9 缩略图和分行元数据，提升同屏浏览效率。

## 影响模块

- `src/api/resource-asset.ts`：素材分页、标签、详情、上传、编辑、删除和鉴权 Blob API。
- `src/views/hyperlink/library/**`：管理页、上传弹窗、选择器、字段组件、缩略图和领域规则。
- `src/views/hyperlink/templates/**`：模板抽屉改用 `ResourceAssetField`，预览继续使用带鉴权 Blob。
- `mock/asyncRoutes.ts`、动态路由测试：增加素材菜单和三个操作权限。
- Store 与依赖：无变更。

## 关键设计决策

- 管理页逻辑拆到 `useResourceAssetLibrary`，单卡片拆到 `ResourceAssetCard`；页面 276 行、卡片 206 行，均低于仓库 400 行拆分阈值。
- 管理页和选择器复用既有 `WheelPagination`；不自造分页基础组件。
- 批量上传由可测试的 `uploadResourceAssetBatch` 串行执行；成功项立即移出，失败项保留重试。
- 标签加载失败给出可见消息，不静默吞异常；Blob Object URL 在替换、关闭和卸载时释放。
- 当前分支没有超链任务、剧本或招呼语页面，不在用户界面宣称尚未接入的能力。

## 验证结果

- 直相关 API、领域规则、串行上传、路由和模板页面测试：20 条通过。
- `pnpm typecheck`：TypeScript 与 Vue TypeScript 均通过。
- 本次文件 ESLint、Stylelint、Prettier 检查：通过。
- `pnpm build`：生产构建通过；只有仓库既有 Browserslist 数据过期提示。
- 本次视觉调整直相关测试：18 条通过；1920×1080 浏览器预览确认 7 列两行完整可见且分页不被挤出首屏。
- 全量 Node 测试仍有 5 个与本次无关的既有失败：`group.test.ts` 1 个、`GroupMemberDrawer.test.ts` 1 个、`useGroupPermissions.test.ts` 3 个；本次未修改这些文件。
- `git diff --check`：通过。

## 人工验收

- [ ] 动态菜单进入图片素材页，查看权限与三个操作权限符合角色配置。
- [ ] 上传多张合法 JPEG，观察串行进度、公共标签和失败重试。
- [ ] 按名称、多个标签筛选并切换 12/24/48/96 分页。
- [ ] 编辑名称和标签；无引用素材可删除，有引用素材显示次数并禁用删除。
- [ ] 新建、编辑超链模板时可选择、上传、替换和移除素材，预览正常。

## 后续

- 超链任务页面及其真实引用表合入后，复用同一 `ResourceAssetField` 并补任务场景联调。
- 部署测试环境后完成菜单、跨租户、Blob 鉴权和并发删除保护的浏览器验收。

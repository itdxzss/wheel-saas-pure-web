# 变更记录：买号上量系统二期管理端

- 日期：2026-07-17
- 状态：管理端二期已实现并完成验证
- 需求来源：买号上量系统 V1.1 Word 文档及四张确认效果图
- 详细设计：`docs/superpowers/specs/2026-07-17-buyer-management-phase2-design.md`

## 目标

在 `buyer/` 业务域规划模板管理（二期）、渠道管理（二期）和渠道统计（二期）三个页面，采用接口契约先行和仅开发环境 Mock，等待用户书面复核后再编写实施计划。

## 范围

- 一级菜单“买号上量系统”。
- 分组“推广管理”和“数据中心”。
- 模板管理、渠道管理、渠道统计三个页面。
- 渠道新增/编辑共用抽屉并完整回显。
- 域名同模板复用、跨模板阻止。
- 模板和目标国家驱动域名静态页运行配置。
- 渠道统计汇总、日明细补录和导出。

## 关键决策

- 效果图决定字段、按钮和布局；Word 正文补业务规则。
- 生产菜单以 `/api/tenant/me/menus` 为事实源。
- Mock 只在开发环境启用，生产失败不得回退假数据。
- Access Token 不回显原文；编辑留空表示不修改。
- 域名冲突由前端预检和后端 409/唯一约束共同保证。
- 当前仓只定义静态页运行配置契约，不开发仓外 H5 页面。

## 计划影响模块

- 路由与开发菜单：`src/api/routes.ts`、`src/router/`、`mock/asyncRoutes.ts`
- 开发 Mock：`mock/buyer.ts`、`build/plugins.ts`
- API：`src/api/buyer-template.ts`、`src/api/buyer-channel.ts`、`src/api/buyer-channel-stats.ts`
- 页面：`src/views/buyer/template/`、`src/views/buyer/channel/`、`src/views/buyer/channel-stats/`
- Store：无

## 渠道统计实际实现

- 新增 `src/api/buyer-channel-stats.ts`，覆盖筛选项、汇总、日明细、带版本补录和 Blob 导出五个接口。
- 新增 `src/views/buyer/channel-stats/`，按宽表、日明细、状态 composable、格式/校验拆分；汇总列表无分页，支持允许字段排序。
- 默认日期为 Asia/Shanghai 最近七个自然日；比率零分母显示 `-`，费用及转化公式集中计算。
- 展开数据按 `channelId + countryCode` 隔离；补录校验非负数和整数计数，`VERSION_CONFLICT` 强制刷新并提示重试。
- `mock/buyer.ts` 增加统计聚合、日明细更新和导出开发路由；`build/plugins.ts` 保持 `enableProd: false`，生产不兜底假数据。
- 导出沿用当前筛选，读取 Content-Disposition 文件名，回退文件名包含日期；请求失败或空 Blob 不触发下载。
- 权限使用 `tenant:buyer-channel-stats:edit` 与 `tenant:buyer-channel-stats:export`。

## 验证证据

- 统计核心 Node 测试：9/9 通过（API、格式/校验、按渠道国家隔离、冲突刷新、页面契约与生产 mock 开关）。
- `pnpm typecheck`：通过。
- `pnpm build`：通过，仅有依赖浏览器数据陈旧提示。

## 明确不在本仓范围

- 外部 H5 静态页没有在本仓实现；本仓仍只提供其管理端与运行配置契约。

## 2026-07-18 静态预览修复

- 后端菜单尚未提供期间，买号菜单改为独立业务静态路由模块，不依赖 `/api/tenant/me/menus`。
- 删除买号 Fake Server 数据；业务接口失败时展示空/错误状态并结束 loading。
- 恢复动态菜单、Armada、路由类型和 `RePureTableBar` 到功能开发前版本。
- `src/router/index.ts`、`src/router/utils.ts`、权限 Store 和 layout 未修改。

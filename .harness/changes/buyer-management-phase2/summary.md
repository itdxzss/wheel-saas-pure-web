# 变更记录：买号上量系统二期管理端

- 日期：2026-07-17
- 状态：设计已批准，尚未开发
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

## 当前未做

- 未修改业务代码、路由、菜单、Mock 或构建配置。
- 未新增页面和 API 文件。
- 未编写实施计划。

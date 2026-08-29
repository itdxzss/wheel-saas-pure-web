# 变更记录：超链数据包与超链营销模板一期前端

- 日期：2026-08-27
- 目标分支：`1.0.3-snapshot`
- 状态：实现与本地集成验证完成，未部署、未做真实环境联调

## 变更概述

- 新增“超链数据包”页面：筛选、服务端分页、统计列、创建/编辑、TXT 追加或覆盖导入、号码明细和软删除入口。
- 新增“超链营销模板”页面：列表、创建、编辑、复制、删除、三种一期消息表单和 WhatsApp 风格预览。
- 图片复用已有营销模板文件上传接口；预览使用鉴权 Blob 下载和 Object URL 生命周期清理。
- 开发环境 mock 菜单新增超链目录、两个页面和八个按钮权限；生产环境仍只消费 `/api/tenant/me/menus` 动态菜单。

## 影响模块

- `src/api/hyperlink-data-package.ts`
- `src/api/hyperlink-template.ts`
- `src/views/hyperlink/data/`
- `src/views/hyperlink/templates/`
- `mock/asyncRoutes.ts`
- `src/router/hyperlink-route.test.ts`

## API 变更

- 对接后端 `/api/data-packages/**`、`/api/hyperlink-templates/**`。
- 图片沿用 `/api/marketing-template-files` 和 `/api/marketing-template-files/{id}/content`。
- 所有业务请求均走统一 `armadaRequest` / `http`，没有生产 mock 或页面内直连 Axios。

## 数据库 / Redis / Kafka

- 前端仓库无变更。

## 关键约束

- 后端菜单组件固定映射为 `hyperlink/data/index` 和 `hyperlink/templates/index`。
- 数据包按钮权限：create/import/edit/delete；模板按钮权限：create/edit/copy/delete。
- 双图文不出现在创建入口；普通按钮和卡片按钮一期只允许一个 CTA URL。
- TXT 客户端检查只做快速反馈，最终格式、去重、国家识别和计数以后端结果为准。

## 验证

- 超链相关 Node 合同/领域测试：36 条通过，0 失败。
- `tsc --noEmit`：通过。
- `vue-tsc --noEmit --skipLibCheck`：通过。
- 变更文件 ESLint、Prettier、Stylelint：通过。
- Vite 生产构建：通过，产物包含两个超链页面 chunk。
- `pnpm typecheck` 直接执行时因共享 `node_modules` 的 pnpm 元数据检查尝试联网并中止；随后使用相同已安装二进制分别执行 `tsc`、`vue-tsc`，均通过。

## 回滚方案

- 回退本次页面、API 和开发 mock 菜单提交；生产菜单由后端 RBAC 控制，不需要前端静态路由回滚。

## 未执行

- 未连接真实后端、未登录测试租户、未做浏览器 E2E、未部署。

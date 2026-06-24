# AGENTS.md - wheel-saas-pure-web

> AI Agent 进入本项目的第一份地图。这里放基线、入口和红线；细节看 `.harness/`。

## 项目定位
`wheel-saas-pure-web` 是 wheel L3 SaaS 前端的新架构版本，基于 `pure-admin-thin`。
目标是用成熟的 pure-admin / Element Plus 体系重建租户端，避免继续在旧 `wheel-saas-web`
的自研壳、手写控件和超大页面上堆代码。

## 技术栈基线
- Vue 3 + `<script setup>` + TypeScript
- Vite + Pinia + Vue Router
- pure-admin-thin 布局、路由、权限、标签页、工具栏能力
- Element Plus 作为唯一基础 UI 组件库
- Axios 请求层，后续接 wheel 后端 `/api`
- 包管理按模板使用 pnpm；临时预览可用 npm，但正式提交以 pnpm lock 为准

## 目录入口
| 路径 | 用途 |
|------|------|
| `src/layout/` | pure-admin-thin 原生布局壳，默认不改结构 |
| `src/router/` | 路由、动态路由、菜单装配 |
| `src/store/` | Pinia 全局状态，优先沿用模板 store |
| `src/components/Re*/` | pure-admin-thin 自带组件，优先复用 |
| `src/views/` | wheel SaaS 业务页面，按业务域放置 |
| `src/api/` | API client 与业务接口封装，页面禁止直接 axios |
| `.harness/rules/` | 工程结构、编码、流程红线 |
| `.harness/changes/` | 大变更记录，跨会话恢复入口 |

## 必读规则
1. 先读 `.harness/agents/owner.md` 明确职责边界。
2. 改页面前读 `.harness/rules/前端架构.md`。
3. 改 TypeScript / Vue 前读 `.harness/rules/编码规范.md`。
4. 大功能先建 `.harness/changes/<feature>/summary.md`。

## 红线
1. 禁止再造 UI 组件库：表格、分页、下拉、弹窗、抽屉、权限、图标优先用 pure-admin-thin / Element Plus。
2. 禁止自绘 select/table/pager/dialog/drawer；尤其禁止全局 DOM 点击拦截器。
3. 页面禁止直接调用 axios；只能调用 `src/api/<domain>.ts`。
4. 业务菜单以 `/api/tenant/me/menus` 为最终来源，前端 mock 只允许开发期 fallback。
5. `.vue` 单文件超过 600 行不得合入；超过 400 行应优先拆 composable 或子组件。
6. 新页面必须按同类页面模式写，不允许凭空发明新目录、新交互、新状态管理风格。
7. 权限必须保留 wheel 的 `module_key` / `perm_key` 语义，不得只靠前端隐藏按钮。
8. 生产路径禁止假数据兜底；mock 只能在 `mock/` 或测试环境中使用。
9. 提交前必须跑项目可用的 typecheck / lint / build；跑不了要说明原因。


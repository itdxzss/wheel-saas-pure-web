# 账号列表迁移

## 目标
- 将旧 SaaS 前端账号管理下的「账号列表」迁移到 pure-admin-thin 新项目。
- 保持老系统路由 `/account/index` 与菜单归属「账号管理」。

## 影响模块
- `mock/asyncRoutes.ts`：新增账号列表动态路由开发期兜底。
- `src/api/account.ts`：新增账号列表与统计卡接口声明。
- `src/api/account-group.ts`：补充账号分组列表接口，供账号列表筛选和迁移分组使用。
- `src/views/account/index/`：新增账号列表页面、局部表格组件、列常量与页面级 composable。
- `scripts/verify-account-list-menu.mjs`：新增结构验收脚本。

## 关键决策
- UI 基础能力使用 `PureTableBar`、`ElTable`、`ElForm`、`ElSelect`、`ElDrawer`、`WheelPagination`。
- 不迁移旧页面自绘表格、原生 select、手写弹框。
- 一期批量操作保持老页面放开的 4 项：迁移到分组、登录、离线、批量删除。
- 写操作接口尚未接入时只提示“待接入”，不伪造成功结果。
- 页面超过 400 行后继续拆分，表格与分页下沉到 `components/AccountListTable.vue`，容器页保留搜索和抽屉。
- `IP分组`、`绑定客服` 暂不使用静态假选项，先保留输入条件；后续接真实字典/API 后再切换为下拉。
- API 函数与复杂 composable 均补显式返回类型。

## 验证结果
- `node scripts/verify-account-list-menu.mjs` 通过。
- `npm run typecheck` 通过。
- Scoped eslint 通过。
- `npm run build` 通过；仅保留 `@vueuse/core` Rollup 注释警告。
- 浏览器访问 `http://127.0.0.1:8849/#/account/index`，确认统计卡、搜索、高级搜索、批量操作、表格列和分页渲染；无前端 error log。

## 遗留风险
- 当前仅完成页面迁移和读接口声明；登录、离线、删除、迁移分组等写操作还需要接真实后端接口后再放开提交。

# 买号上量系统静态菜单预览修复设计

## 1. 背景

当前分支已经包含模板管理、渠道管理和渠道统计三个业务页面，但导航初始化被改为请求尚未实现的 `/api/tenant/me/menus`。部署环境返回业务错误后，动态路由初始化无法完成，导致导航栏持续加载。

本次目标是在后端菜单和业务接口尚未开发时，让前端可以展示“买号上量系统”的菜单层级和三个页面的整体布局，同时恢复此前对公共组件和框架代码的改造。

## 2. 约束

- 不修改 `src/router/index.ts`、`src/router/utils.ts`、权限 Store 或其他路由装配逻辑。
- 不新增或扩展公共组件能力；此前对 `src/components/RePureTableBar/` 的改动全部回退到功能开发前版本。
- 不新增买号业务 Mock 接口，不在生产页面中写入假表格数据。
- 不要求占位业务接口调用成功；失败后必须结束 loading，并保留筛选区、表格、按钮、弹窗和抽屉等页面布局。
- 业务页面继续使用 Element Plus 和项目已有公共组件，不自绘表格、选择器、分页、弹窗或抽屉。
- 本次只修改或新增买号业务文件，以及回退本功能此前造成的公共文件变更；不重构其他业务。

## 3. 方案

采用项目现有的静态路由自动加载机制，新建独立业务路由模块 `src/router/modules/buyer.ts`。该文件由现有 `import.meta.glob("./modules/**/*.ts")` 自动装配，无需修改公共路由代码。

菜单结构如下：

```text
买号上量系统
├─ 推广管理
│  ├─ 模板管理（二期）
│  └─ 渠道管理（二期）
└─ 数据中心
   └─ 渠道统计（二期）
```

页面路径保持不变：

| 页面             | 路径                        | 路由名              | 组件                                    |
| ---------------- | --------------------------- | ------------------- | --------------------------------------- |
| 模板管理（二期） | `/buyer/promotion/template` | `BuyerTemplate`     | `@/views/buyer/template/index.vue`      |
| 渠道管理（二期） | `/buyer/promotion/channel`  | `BuyerChannel`      | `@/views/buyer/channel/index.vue`       |
| 渠道统计（二期） | `/buyer/data/channel-stats` | `BuyerChannelStats` | `@/views/buyer/channel-stats/index.vue` |

一级菜单和两个分组只负责导航层级，三个叶子路由直接懒加载现有业务页面。权限沿用框架原生 `meta.auths`，不扩展路由类型。

## 4. 公共代码回退边界

以下此前变更恢复为本功能开发前版本：

- `src/components/RePureTableBar/src/bar.tsx`
- 删除 `src/components/RePureTableBar/src/column-visibility.ts`
- `src/api/routes.ts` 恢复项目原有动态路由调用，不再接入 `/api/tenant/me/menus`
- `build/plugins.ts`、`mock/asyncRoutes.ts` 恢复项目原有内容，不再承载买号菜单
- `src/api/armada.ts` 和 `types/router.d.ts` 恢复此前公共定义，不为买号页面扩展共享契约

如果业务页面依赖了被回退的公共扩展，只调整买号业务页面适配公共组件现有 API，不反向修改公共组件。

`src/router/index.ts`、`src/router/utils.ts`、`src/store/modules/permission.ts` 本次不得产生代码差异。

## 5. 页面和接口行为

三个页面保留当前效果图对应布局：

- 模板管理：模板列表、刷新、列设置、预览和备注入口。
- 渠道管理：费用提示、筛选区、渠道表格、新增/编辑抽屉、探测和删除入口。
- 渠道统计：查询条件、宽表、自定义列入口、展开明细和导出入口。

页面 API 继续通过 `src/api/buyer-*.ts` 调用固定占位路径，例如 `/api/buyer/templates`、`/api/buyer/channels` 和 `/api/buyer/channel-stats`。不提供对应 Fake Server 数据。

初次加载失败时：

1. 捕获异常，禁止出现 `Uncaught (in promise)`。
2. 在 `finally` 中结束页面 loading。
3. 表格使用空数组并保留完整表头和操作区。
4. 显示可理解的错误提示或重试入口。
5. 不影响静态菜单、页面切换、面包屑和标签页。

新增、编辑、查询、导出等操作在接口未实现时允许失败，但必须解除按钮 loading，并保持用户当前页面可操作。

## 6. Mock 清理

删除本功能此前新增的买号业务 Mock：

- `mock/buyer.ts`
- `mock/buyer-runtime.ts`
- `mock/buyer-runtime.test.ts`

`mock/asyncRoutes.ts` 中此前新增的买号菜单树一并移除。项目原有 Mock 行为保持原样，不为本功能增加新的 Mock 数据。

## 7. 测试与验收

自动化测试覆盖：

- 静态路由包含一级菜单、两个分组和三个叶子页面。
- 路由路径、名称和懒加载组件准确。
- 动态菜单 API 不再请求 `/api/tenant/me/menus`。
- 三个业务页面在接口失败时均能结束 loading，并保留页面布局。
- 买号业务源码不依赖 `mock/buyer*`。
- `RePureTableBar` 使用原项目 API，买号统计页面不再依赖此前新增的公共属性。

验证命令包括核心测试、`pnpm typecheck`、针对改动文件的 ESLint、`pnpm build` 和 `git diff --check`。

人工验收：

- 导航展示“买号上量系统 → 推广管理/数据中心 → 三个页面”。
- 三个页面可打开，接口失败不会造成导航或页面无限 loading。
- 页面无业务数据时仍能看到效果图对应的整体布局。
- 公共组件和公共框架文件与本功能开发前保持一致。

## 8. 非目标

- 不实现后端菜单、模板、渠道或统计接口。
- 不提供生产或开发买号假数据。
- 不保证新增、编辑、删除、探测、补录和导出成功。
- 不修改 H5 静态页工程。
- 不提交与本功能无关的现有未跟踪文件。

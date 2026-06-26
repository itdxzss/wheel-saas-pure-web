# 账号导入菜单迁移

## 目标
- 在 pure-admin SaaS 新架构中迁移 `账号导入` 菜单，保留 wheel 业务口径和后端真实接口。
- 避免搬迁旧 `wheel-saas-web` 的自绘控件和超大页面写法。

## 影响模块
- `mock/asyncRoutes.ts`：开发期动态路由增加 `/account/import`。
- `src/api/account-import.ts`：账号导入列表、创建、ZIP 上传、详情、导出接口。
- `src/api/resource-ip.ts`：导入抽屉 `选择IP` 使用的 IP 区域接口。
- `src/views/account/import/`：账号导入页面、表格、导入抽屉、详情抽屉和 composable。
- `src/components/WheelPagination/index.vue`：补齐页面已使用的 `change` 事件。

## 关键决策
- 页面按 `index.vue + composable + table + import drawer + detail drawer` 拆分，单文件不超过 600 行。
- 表格、分页、下拉、上传、抽屉全部使用 pure-admin / Element Plus，不迁移旧自绘控件。
- 账号分组新增由 composable 调用真实 API，抽屉子组件只接收回调，不直接 import API。
- 客服字段按需求标注为二期禁用，不写 `客服A/客服B` 假选项。
- JSON号 ZIP 走 `/api/tenant/account-imports/zip`；六段号、全参账号走文本创建。

## 业务口径
- 列表字段对齐一期需求：ID、来源文件、导入类型、分组、机型、账号类型、任务进度、登录成功/失败、登录异常、创建时间、状态、操作。
- 查询条件透传后端：ID/来源文件、导入类型、分组、机型、账号类型、登录结果、状态。
- 明细支持成功/失败/异常筛选、失败原因概览和 CSV 导出。

## 验证
- `scripts/verify-account-import-menu.mjs` 检查菜单、API、页面拆分、导入抽屉、详情抽屉和禁假数据。
- 完成时需跑结构脚本、现有菜单脚本、`npm run typecheck`、`npm run build`，并用浏览器验证 `/account/import`。

## 遗留风险
- 文档测试清单提过“全参 TXT/ZIP”，但当前后端 `/api/tenant/account-imports/zip` 明确按 JSON号 ZIP 解析并以 `baileys_json` 入库。前端暂不放开全参 ZIP，避免错误导入；后端支持全参 ZIP 后再补。
- CSV 下载需要浏览器侧触发下载链接，代码已集中在 composable 内并立即清理节点和 object URL。

# 动态发布任务适配

## 范围

- 新增租户端 WhatsApp Status 动态发布任务页面。
- 复用现有账号列表、账号分组和 `armadaRequest` 请求层。
- 开发期 mock 菜单增加“动态营销 / 动态发布任务”层级。

## 后端契约

页面使用以下租户端接口：

- `GET /api/feed-tasks`
- `GET /api/feed-tasks/{id}`
- `POST /api/feed-tasks`
- `PUT /api/feed-tasks/{id}`
- `POST /api/feed-tasks/{id}/action`
- `GET /api/feed-tasks/{id}/data`

创建和编辑使用 multipart 表单，账号筛选条件序列化到 `accountFilter` 字段，图片字段为 `linkPreviewImage`。

## 菜单

生产环境仍以 `/api/tenant/me/menus` 返回的菜单为准，需要后端下发 `TaskFeed` 对应的 `route_path`、`view_path`、`module_key` 和 `perm_key`；`mock/asyncRoutes.ts` 仅用于开发预览。

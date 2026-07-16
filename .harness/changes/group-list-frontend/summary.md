# 群组列表前端迁移

## 目标
- 将旧 SaaS 的「群组列表」迁移到 `wheel-saas-pure-web`。
- 前端先完整落出列表、成员抽屉、编辑入口、头像入口、权限开关和成员操作入口。
- 严格使用 pure-admin-thin / Element Plus，不迁移旧项目自绘表格、select、pager、drawer。

## 口径
- 新前端当前对接 armada 风格接口，列表主数据使用 `/api/group-links`。
- 群详情抽屉使用 `/api/group-links/{id}/detail` 聚合真实 WhatsApp 群状态，不给权限和限时消息设置乐观默认值。
- 群名称、群备注和头像分别保存：群名称修改真实 WhatsApp subject，群备注只修改 Armada 本地数据，头像用 multipart 上传并按 `mirrorSynced` 显示同步结果。
- 限时消息支持关闭、24 小时、7 天、90 天；五项权限使用固定枚举 key，其中「通过链接邀请」在当前协议能力不支持时禁用并显示原因。
- 升管理员、降管理员、踢出按选中的 JID 批量提交；群主不可选择，部分成功时逐项显示 JID 和失败原因，随后重新拉取详情。
- 执行账号不由前端选择，由 Armada 自动选择在线、仍在群内且优先管理员的账号；权限不足直接显示后端错误，不做前端假成功。
- 路由使用 `/group/list`，菜单名「群组列表」，权限沿用 `tenant:group_link:view`。

## 文件规划
- `src/api/group.ts`：群组列表、聚合详情、资料、设置和成员操作 API。
- `src/views/group/list/index.vue`：页面容器和筛选区。
- `src/views/group/list/composables/useGroupListPage.ts`：列表状态、查询、删除、抽屉状态。
- `src/views/group/list/components/GroupListTable.vue`：表格、列设置、分页、行操作。
- `src/views/group/list/components/GroupMemberDrawer.vue`：群组信息抽屉。
- `src/views/group/list/constants.ts`：表格列和选项常量。
- `mock/asyncRoutes.ts`：开发期动态路由兜底。
- `scripts/verify-group-list-menu.mjs`：结构验收脚本。

## 验证
- `node --import ./src/api/__tests__/node-test-alias.mjs --test src/api/group.test.ts`：6/6 通过。
- `node --import ./src/api/__tests__/node-test-alias.mjs --test src/views/group/list/components/GroupMemberDrawer.test.ts src/views/group/list/composables/useGroupPermissions.test.ts src/views/group/list/composables/useGroupProfileSaving.test.ts src/views/group/list/composables/useGroupTimedMessage.test.ts`：8/8 通过。
- `tsc --noEmit`、`vue-tsc --noEmit`、目标文件 ESLint、Prettier 检查和 `vite build` 均通过。
- `GroupMemberDrawer.vue` 为 597 行，符合项目单个 `.vue` 文件不得超过 600 行的规则。

## 尚未执行

- 未连接远程环境，也未对真实 WhatsApp 群执行冒烟操作；需要先明确测试环境、测试账号和测试群。

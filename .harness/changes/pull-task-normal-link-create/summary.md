# 普通群链接拉群创建页

## 目标

- 按已确认的普通群链接方案实现 FE-01～FE-03。
- 将普通任务入口收敛为“群链接 → 普通群链接版”。
- 接入链接逐行预检、多 TXT 解析、服务端随机匹配预览与草稿冻结提交。

## 边界

- 不修改既有需求、设计和实施计划文档。
- 不引入自建群、管理员数量、水军、审核、群资料或退群方式等本期排除字段。
- 保留现有拉群营销入口及旧接口封装，避免影响其他已上线页面。
- 本轮不部署、不连接远程环境或真实数据库。

## 实施文件

- `src/api/pull-task.ts`
- `src/api/pull-task.test.ts`
- `src/views/task/pull-task/index.vue`
- `src/views/task/pull-task/components/PullTaskCreateDrawer.vue`
- `src/views/task/pull-task/components/PullTaskStandardResources.vue`
- `src/views/task/pull-task/components/PullTaskStandardPlanTable.vue`
- `src/views/task/pull-task/components/PullTaskStandardSettings.vue`
- `src/views/task/pull-task/components/PullTaskTypeDialog.vue`
- `src/views/task/pull-task/composables/useStandardPullTaskCreate.ts`
- `src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts`

## 当前进度

- [ ] 类型化 API 与契约测试
- [ ] 普通群链接创建状态管理
- [ ] 创建抽屉与拆分组件
- [ ] 类型检查、定向测试、Lint、构建验证

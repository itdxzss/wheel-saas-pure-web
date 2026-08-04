# 普通群链接拉群创建页

## 目标

- 普通群链接页面一次保存完整提交本期全部字段。
- 接入群组分组 + 粘贴链接 + 多 TXT 的统一预检与冻结计划。
- 上传真实群头像，创建失败保留上传结果供无重复上传重试。
- 在任务详情只读回显数据库中的执行设置与群信息设置；头像通过带认证请求读取后展示。

## 边界

- 不修改既有需求、设计和实施计划文档。
- 不引入营销模板、发送规则或任何标记“后期”的字段。
- 保留现有拉群营销入口及旧接口封装，避免影响其他已上线页面。
- 群资料本期只保存和回读，不宣称已经应用到 WhatsApp。
- 本轮不部署、不连接远程环境或真实数据库。

## 实施文件

- `src/api/pull-task.ts`
- `src/api/pull-task.test.ts`
- `src/views/task/pull-task/index.vue`
- `src/views/task/pull-task/components/PullTaskCreateDrawer.vue`
- `src/views/task/pull-task/components/PullTaskStandardResources.vue`
- `src/views/task/pull-task/components/PullTaskStandardPlanTable.vue`
- `src/views/task/pull-task/components/PullTaskStandardSettings.vue`
- `src/views/task/pull-task/components/PullTaskStandardGroupSettings.vue`
- `src/views/task/pull-task/components/PullTaskDetailDrawer.vue`
- `src/views/task/pull-task/components/PullTaskStandardSavedSettings.vue`
- `src/views/task/pull-task/composables/useStandardPullTaskCreate.ts`
- `src/views/task/pull-task/composables/useStandardPullTaskCreate.test.ts`
- `src/views/task/pull-task/composables/usePullTaskPage.ts`
- `src/views/task/pull-task/PullTaskIndex.test.ts`

## 当前进度

- [x] 完整 API 类型、分组草稿参数、头像上传/删除契约
- [x] 21 个本期顶层字段 + 11 个群设置字段整单提交；“拉手风控时间”等后期字段不提交
- [x] JPG/JPEG/PNG、≤512000 字节的本地选择校验
- [x] 上传失败阻止创建；创建失败保留文件/key；重试不重复上传
- [x] 站台数量为 0 时分组可空；来源内容变化强制重新预检
- [x] 任务详情展示 `standardSetting`、`groupSetting`，并把 `avatarPreviewUrl` 通过带 Bearer 认证的 Blob 请求转成本地预览 URL
- [x] 类型检查、相关测试、ESLint、Prettier、生产构建验证

## 验证结果

- Node 相关回归：6 个套件、44 个测试通过，0 failure。
- `pnpm typecheck`：通过。
- `pnpm lint:eslint`：通过。
- `pnpm lint:prettier`：通过；格式工具触及的非本次文件已逐一恢复。
- `pnpm build`：通过，最终 Vite 生产构建耗时 12.41 秒。
- `git diff --check`：通过；旧的 `groupAvatarFileName` 与“新增配置待后端接入”提示均已移除。

## 提交与部署

- 用户要求仅本地开发；未 commit、未 push、未部署。

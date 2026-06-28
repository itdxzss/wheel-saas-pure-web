# 群组营销任务前端迁移

## 目标
- 将旧 wheel SaaS 的「群组营销任务」迁移到 `wheel-saas-pure-web`。
- 新页面只使用 pure-admin-thin / Element Plus / 现有局部模式，不迁移旧页面的自绘表格、抽屉、下拉和全局事件写法。

## 范围
- 旧页面：`wheel/wheel-saas-web/src/views/tenant/group-marketing/GroupMarketingTaskList.vue`
- 新页面：`src/views/task/group-marketing/index.vue`
- 新路由：`/task/group-marketing`
- 新 API：`src/api/marketing-task.ts`
- 依赖 API：`src/api/marketing-template.ts`

## 决策
- 后端对接 armada 一期接口 `/api/marketing-tasks`，字段使用 camelCase。
- 营销素材仍以共享营销模板为事实源；任务侧修改素材调用 `/api/marketing-tasks/{id}/marketing-template`。
- 页面拆成列表、创建抽屉、明细抽屉、素材抽屉、composable 和 constants，避免单文件超限。

## 验证
- `node scripts/verify-marketing-task-menu.mjs` 通过。
- `npm run typecheck` 通过。
- 定向 `npx eslint --max-warnings 0 ...` 通过。
- `npx stylelint "src/views/task/group-marketing/**/*.vue" --cache=false` 通过。
- `npm run build` 通过。
- 关键 Vue 单文件均低于 600 行。

## 遗留风险
- armada 当前阶段只落任务 CRUD 和状态切换，不触发真实 WhatsApp 发送。
- 营销模板按钮后端当前仍使用 `LINK_JUMP/COPY_CONTENT/QUICK_REPLY`，前端 API 层已做薄适配。

## 代码审核待修（2026-06-28）
- [ ] HIGH：列表「营销账号封禁/禁言」列口径错误。当前前端用 `failedMessageCount` 显示“失败 X”，但 wheel 老系统该列来自 `banned_account_count` / `muted_account_count`。需要恢复封禁/禁言计数口径；若 Armada 一期没有字段，需要补后端 VO/SQL 或调整列文案，不能用失败消息数冒充。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingTaskTable.vue`
  - 新列定义：`src/views/task/group-marketing/constants.ts`
  - 老系统：`wheel/wheel-saas-web/src/views/tenant/group-marketing/GroupMarketingTaskList.vue`
  - 老 API：`wheel/wheel-saas-web/src/api/group-marketing.ts`
- [ ] HIGH：营销明细群链接未脱敏。当前详情直接展示 `groupLinkUrl`，违反一期需求“营销明细群链接脱敏 `chat.whatsapp.com/****xxx`”和全局固定点“所有展示群链接处一律脱敏”。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue`
  - 需求：`wheel/docs/审计-0618/一期需求文档.md`
- [ ] HIGH：启动按钮门禁不符合需求。前端只禁用发送中，导致发送成功/发送失败/部分失败任务也能点启动；需求和 Armada 后端只允许待启动/已停止启动。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingTaskTable.vue`
  - 后端门禁：`armada/armada-api/src/main/java/com/armada/marketing/service/impl/MarketingTaskServiceImpl.java`
- [ ] MEDIUM：营销明细缺“发言号码是否在线”。一期要求发言号码旁展示在线/离线；wheel 老 API 有 `speaker_online`，Armada 当前 `MarketingTaskTargetVO` 没有该字段，前端只能显示号码。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingDetailDrawer.vue`
  - 老 API：`wheel/wheel-saas-web/src/api/group-marketing.ts`
  - 后端契约：`armada/armada-api/src/main/java/com/armada/marketing/model/vo/MarketingTaskTargetVO.java`
- [ ] MEDIUM：新增任务账号树没有完整呈现不可用账号状态。前端支持非 ONLINE 置灰，但 Armada 当前 account-tree SQL 已过滤离线/风控/禁言/封禁账号，无法满足需求里“展示在线/离线/异常/封禁/禁言，不可用置灰或提示不可选”的口径。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingCreateDrawer.vue`
  - 后端契约：`armada/armada-api/src/main/java/com/armada/marketing/model/vo/MarketingTreeAccountVO.java`
  - SQL：`armada/armada-api/src/main/resources/mapper/marketing/MarketingTaskMapper.xml`
- [ ] MEDIUM：修改营销素材只查本地前 500 个模板。`openMaterialDrawer` 只从 `marketingTemplates` 缓存找任务引用模板，缓存来自 `pageSize: 500`；模板超过 500 或缓存不全时会误报“未找到”。Armada 模板列表支持按 `id` 精准查询，缓存 miss 时应 fallback 查询。
  - 新代码：`src/views/task/group-marketing/composables/useGroupMarketingTaskPage.ts`
  - 后端查询：`armada/armada-api/src/main/java/com/armada/marketing/model/dto/MarketingTemplateQuery.java`
- [ ] MEDIUM：单轮发送数量/发送间隔缺提交前正整数校验。需求明确不允许 0、负数、小数、非数字；当前只依赖 `ElInputNumber :min="1"`，应在 `createTask` 提交前用 `Number.isInteger` 等规则拦截。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingCreateDrawer.vue`
  - 新逻辑：`src/views/task/group-marketing/composables/useGroupMarketingTaskPage.ts`
  - 老系统：`wheel/wheel-saas-web/src/views/tenant/group-marketing/GroupMarketingTaskList.vue`
- [ ] LOW：素材按钮编辑器 `v-for` 使用 `:key="index"`，违反 harness 编码规范“v-for 必须稳定 key，禁止 index key”。
  - 新代码：`src/views/task/group-marketing/components/GroupMarketingMaterialDrawer.vue`
  - 规范：`.harness/rules/编码规范.md`

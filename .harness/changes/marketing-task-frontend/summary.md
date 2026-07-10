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
- [x] HIGH：启动按钮门禁不符合需求。已于 2026-07-10 修复：普通启动只对待启动/已停止显示，已结束改走重新启动，发送成功/失败/部分失败不再显示启动入口。
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

## 2026-07-10 任务时间窗口与重新启动

- 普通“启动”仅对等待中、已停止任务显示;已结束任务改为单独的“重新启动”,发送成功/失败/部分失败不再显示启动入口。上方“启动按钮门禁不符合需求”已在本次修复。
- 普通启动接口返回等待状态时,提示“将在计划开始时间自动执行”,不再误报已经开始发送。
- 新增 `GroupMarketingRestartDialog.vue` 和独立 `useMarketingTaskRestart.ts`,避免把重启表单、校验、提交状态继续堆入主页面 composable。
- 重启默认开始时间为当前时间;默认结束时间按原任务持续时长顺延,原时间窗口无效时回退 24 小时。提交前校验结束时间晚于当前时间和开始时间。
- 调用 `POST /api/marketing-tasks/{id}/restart`,成功后关闭弹窗并刷新列表。
- 验证:
  - 群组营销目录 8 个 `node:test` 文件全部通过。
  - `tsc --noEmit`、`vue-tsc --noEmit --skipLibCheck` 通过。
  - 本次触及文件定向 ESLint 和 Vue 文件 Stylelint 通过。
  - `npm run build` 通过。
- 未提交,未部署。

## 2026-07-10 五态操作与账号锁定提示（覆盖同日重新启动方案）

- 普通营销任务状态收敛为：未启动、执行中、已暂停、已完成、已关闭；删除发送成功/失败/部分失败等任务级旧状态选项。
- 列表使用同一个生命周期按钮：未启动显示“启动”、执行中显示“暂停”、已暂停显示“继续”；已完成和已关闭不再提供生命周期操作。
- 非终态任务单独提供“手动关闭”，二次确认明确提示关闭不可恢复且会释放账号。
- 删除普通营销的重新启动弹窗、composable 和 API；页面接入 `/pause`、`/resume`、`/close`。
- 账号树继续以后端 `selectable` 为准禁选，并在节点正文和 Tooltip 展示 `disabledReason`；账号占用时可完整展示占用任务名称和关闭提示。
- 批量删除只允许已完成或已关闭任务，前端先行提示，后端仍保留最终状态守卫。
- 离线验证：群组营销目录 31 个 `node:test` 测试通过；双类型检查、定向 ESLint/Prettier/Stylelint 和 Vite 生产构建通过。
- 未提交、未部署。

## 2026-07-10 终态任务禁止修改营销素材

- 普通营销列表仅在未启动、执行中、已暂停三种状态显示“修改营销素材”；已完成、已关闭不再显示入口。
- `openMaterialDrawer` 复用同一状态判断并增加防绕过提示：`已完成或已关闭的任务不可修改营销素材`，命中时不加载模板、不打开抽屉。
- 按已确认范围只调整前端，不新增后端素材修改状态守卫；不涉及建群营销/速拉群。
- TDD 证据：实现前列表源码断言失败；实现后群组营销 33 个 `node:test` 测试通过。
- `tsc`、`vue-tsc`、定向 ESLint/Prettier/Stylelint、Vite 生产构建和 `git diff --check` 均通过。
- 未提交、未部署。

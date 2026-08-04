# 拉群任务原型字段对齐设计

## 目标

以 `/Users/daishuaishuai/IdeaProjects/前端文件8-3/index.html` 为字段事实源，先对齐普通群链接创建页的非营销、非“后期”字段。结构、间距和视觉还原不在本次范围；后端请求合同与执行器在用户验收前端后另行扩展。

## 本次纳入

- 群链接配置：补充“群组分组”。
- 执行策略：补充“拉手同步料子方式”“是否清空群原成员”。
- 完成归档：补充“任务完成的管理移至分组”“任务完成的拉手移至分组”。
- 群信息设置：补充设置顺序、基础资料和权限控制共 11 个字段。
- 现有字段：对齐原型名称、默认值和站台分组的视觉必填状态。
- 进群顺序：保留当前服务端冻结计划的必要信息，同时补充原型中的“进群料子”“状态”口径。

## 本次排除

- “模板与内容”“发送规则”“营销开始方式”整块营销配置。
- 营销分组。
- 原型中标注“后期”的审核、退群、前期拉人、速拉等字段。
- 任何后端 DTO、数据库、执行器或协议层修改。

## 前端状态与兼容策略

新增字段进入 `StandardPullTaskCreateForm`，控件可交互并在抽屉打开期间保留。当前 `POST /api/pull-tasks/standard` 仍只接收现有字段，因此 `createPayload()` 继续显式构造旧合同，新增字段不静默混入请求。页面显示“新增配置待后端接入”的提示，避免把前端状态误认为已持久化。

群组分组选项复用 `GET /api/group-folders`，账号归档分组选项复用现有账号分组列表。若选项接口加载失败，保留页面并显示现有错误提示，不使用假数据。

## 字段模型

- `groupFolderId: number | ""`
- `pullerSyncMode: "SINGLE" | "BATCH"`
- `clearExistingMembers: boolean`
- `managerFinishGroupId: number | ""`
- `pullerFinishGroupId: number | ""`
- `groupSettingTiming: "BEFORE_PULL" | "AFTER_PULL"`
- `groupName: string`
- `useMaterialFileNameAsGroupName: boolean`
- `groupAvatarFileName: string`
- `groupDescription: string`
- `autoCloseMuteAfterTask: boolean`
- `autoCloseInviteAfterTask: boolean`
- `editPermission: "UNCHANGED" | "ALLOW" | "DISALLOW"`
- `muteMode: "UNCHANGED" | "MUTE" | "UNMUTE"`
- `linkPermission: "ALL" | "ADMIN_ONLY"`
- `disappearingMessage: "ONE_DAY" | "SEVEN_DAYS" | "NINETY_DAYS" | "OFF" | "UNCHANGED"`

## 验证

- 源码契约测试必须逐一断言上述原型字段存在，并断言营销字段与“后期”字段不存在。
- composable 测试必须断言原型默认值，以及新增字段不会进入旧后端请求体。
- 运行相关 Node 测试、TypeScript/Vue 类型检查和生产构建。
- 启动本地页面，打开“新建拉群任务”，人工核对字段清单和控件可见性。

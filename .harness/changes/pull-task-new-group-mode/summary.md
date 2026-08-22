# 拉群任务新群模式

- 日期 / 分支: 2026-08-20 / `feat/pull-task-new-group-mode`
- 需求来源: `armada/docs/operations/2026-08-20-pull-task-new-group-mode-remaining-work.md`
- 状态: 本地实现与自动化验证完成；test1 真环境验收待账号资源恢复

## 目标

启用普通拉群创建抽屉的新群模式，接入建群人分组、初始站台数量、创建模式提交，以及列表和详情的建群步骤展示。

## 范围

- In scope: 创建 Tab、建群配置、容量提示、API 类型、任务列表与详情模式展示、组件与 composable 测试。
- Out of scope: 后端状态机、协议层、部署、远端真环境账号恢复。

## 影响模块

- 路由: 无。
- 页面: `src/views/task/pull-task/`。
- API: `src/api/pull-task.ts`。
- Store: 无。
- 权限: 沿用 `tenant:pull_task:view` 与既有操作权限。

## 关键设计决策

- 一份通过校验的 TXT 对应一个待建群执行行，不增加“建群数量”输入。
- 新群模式群信息设置总开关默认开启；显式关闭时群名由 TXT 文件名兜底。
- 初始站台需求与拉人站台需求复用同一分组，页面提示容量至少为两者较大值。
- 新群执行行没有邀请链接时展示持久化 `createStep`，不渲染空链接占位。
- 群链接模式不提交 `creatorGroupId` / `initialStationCount`，避免把隐藏的新群配置带入请求。
- 新群计划强制提交空 `linksText`；当前后端提交 `dd026793` 的草稿 controller 还要求以可选 `creationMode=NEW_GROUP` 区分计划模式。
- TXT 本地校验和草稿解析失败均在创建抽屉内部展示，避免全局消息被遮罩挡住。

## 验证

- `../../node_modules/.bin/eslint --no-cache --max-warnings 0 <本轮改动源码/测试文件>`：通过。
- `../../node_modules/.bin/tsc --noEmit`：通过。
- `../../node_modules/.bin/vue-tsc --noEmit --skipLibCheck`：通过。
- 新群模式相关 API、页面、组件、composable 定向回归：59 tests，59 pass，0 fail。
- `node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types --test-concurrency=1 --test-reporter=dot "src/**/*.test.ts"`：干净基线为 6 个失败；本分支为 5 个失败，仍只有未修改的 `src/api/group.test.ts`（1）、`GroupMemberDrawer`（1）、`GroupPermissions`（3），没有新增失败。基线中 `PullTaskStandardCreateLayout` 的提示文案失败已随本功能修正。直接执行 package script 会因 Node 23 无法加载 `nprogress.css` 产生大量运行器假红，不作为业务回归结论。
- `npm run build`：通过。
- `git diff --check`：通过。

## 人工验收

- [ ] 打开“新建拉群任务”，可切换到“新群模式”
- [ ] 选择建群人分组并配置初始站台数量
- [ ] 上传几份有效 TXT 即生成几条执行计划
- [ ] 创建请求携带 `creationMode=NEW_GROUP`
- [ ] 列表与详情能区分新群模式
- [ ] 建群完成前执行行展示当前建群步骤，不显示空链接
- [ ] 站台配置不足时看到明确容量提示

## 遗留 / 跟进

- test1 真环境闭环依赖站台、拉手分组恢复可用在线账号。

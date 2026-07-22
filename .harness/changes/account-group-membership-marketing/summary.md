# 变更记录：营销群关系状态与跳过明细

- 日期 / 分支: 2026-07-22 / `1.0.1-snapshot`
- 需求来源: 账号被踢/主动退出群后仍需在创建页和营销明细展示，运行时安全跳过
- 状态: 本地实现完成，待联调与人工验收

## 目标

在普通群组营销中同时展示账号和群的当前关系、最后协议状态和最后执行结果；退出群关系仍可选择，但由后端在发送前跳过。

## 范围

- In scope: 创建任务账号树群状态、详情三套状态、`SKIPPED`、任务/账号/群跳过数、历史响应回退和窄屏布局。
- Out of scope: 全局群组列表、协议事件生产、后端状态判定、其他营销类型。

## 影响模块

- 路由: 无变化。
- 页面: `GroupMarketingCreateDrawer.vue`、`GroupMarketingDetailDrawer.vue`。
- API: 消费关系五态、关系更新时间、`SKIPPED`、执行原因和三级跳过统计字段。
- Store: 无变化。
- 权限: 无变化。

## 关键设计决策

- 创建页展示 `IN_GROUP`、`UNCONFIRMED`、`KICKED_OUT`、`LEFT`、`NOT_IN_GROUP` 五种关系状态。
- 群节点是否可选只继承账号的 `accountSelectable`；退出状态本身不禁用，运行时由后端重新读关系表并安全跳过。
- 详情把“当前关系”“最后协议状态”“最后执行”拆成独立列，避免把被踢/主动退出误当成协议发送错误。
- `SKIPPED` 使用警告色并展示原因，跳过数独立于失败数。
- 缺失或未来未知关系状态安全回退为“未确认”；旧协议状态映射不吸收 `LEFT` / `NOT_IN_GROUP`。
- 宽屏九列明细支持横向滚动；窄屏改为两列自适应，不保留 1280px 最小宽度。

## 后端依赖字段

- 树节点：`membershipStatus`、`membershipStatusText`、`membershipStatusUpdatedAt`。
- 详情汇总：任务、账号、群组的 `skippedMessageCount`。
- 群组详情：`membershipStatus`、`groupStatus`、`executionResult`、`executionReason`。

## 验证

```text
本次相关 Node tests: 25 passed, 0 failed
定向 ESLint: exit 0
定向 Prettier: All matched files use Prettier code style
定向 Stylelint: exit 0
pnpm typecheck: exit 0
pnpm build: built successfully
git diff --check: exit 0
```

目录全量 Node 命令另有 3 个既有测试文件在 Node 23 下因省略扩展名或 `@/` 别名无法解析而启动失败；同次执行其余 35 个用例通过，未改动无关导入约定。

## 人工验收

- [ ] 新建普通群组营销任务，展开账号后核对五种关系状态均可见、可选。
- [ ] 选择被踢、主动退出或不在群的群创建任务，核对创建成功。
- [ ] 执行任务后核对退出群没有协议发送，明细显示“已跳过”及原因。
- [ ] 核对未确认关系仍发送。
- [ ] 核对任务、账号、群组跳过数不计入失败数。
- [ ] 核对当前关系、最后协议状态、最后执行可同时显示不同值。
- [ ] 核对桌面端横向滚动和窄屏两列布局。

## 遗留 / 跟进

- 待 Armada 后端、Android 协议和测试环境完成端到端联调。
- 当前仅在用户本地工作区修改，未提交、未部署。

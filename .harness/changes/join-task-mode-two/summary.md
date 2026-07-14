# join-task-mode-two

## Scope

调整进群任务方式二：勾选账号数必须与填写账号数一致；有效群链接数不得超过“账号数 × 每号上限”；链接按账号轮询且单群在单任务内只分配一个账号；不同账号并行、同账号按配置间隔串行；失败按配置次数重试，明确永久失败不重试。

## Projects

- `wheel-saas-pure-web`：创建/编辑表单前置校验与操作提示。
- `armada`：服务端兜底校验、计划行轮询、账号执行通道与重试。
- `armada-protocol`：Baileys 原始进群错误归一化，不修改第三方依赖。

## Constraints

- 当前工作分支固定为 `1.0.1-snapshot`。
- 不创建提交，由业务方本地审阅差异。
- 不调用真实 WhatsApp 账号，不连接远程环境，不修改真实数据。

## Verification

- 协议层：聚焦 Jest + TypeScript 类型检查。
- 后端：聚焦 JUnit/Mockito + Maven 测试。
- 前端：Node 单测 + vue-tsc + Vite build。

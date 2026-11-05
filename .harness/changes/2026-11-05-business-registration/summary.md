# 接码订单选择个人 / 商业注册

日期 2026-11-05；分支 codex/business-registration-20261105；基线 74e5bf9d。

用户要求保留个人版，补 Business 独立注册，由 Armada 选择类型。已在未开始注册的卡片增加类型选择，默认取后端开放列表首项（同时配置时为个人）；只显示已配置类型。开始后隐藏选择，卡片及记录显示后端保存的 registrationAccountType。

- API：POST /api/sms-activations/{id}/registration 发送 `{accountType:1|2}`；options 读取 registrationAccountTypes；列表/轮询读取冻结的 registrationAccountType。
- composable 在未开放所选类型时拒绝提交；提交与轮询不增加自动重发。
- 服务端负责冻结类型、独立 profile 和重试一致性；页面不暴露 token、证书、proxy 或 profile ID。
- 没有引入依赖，没有改动取号/取消/完成逻辑。

验证：

- 接码 composable 8/8 通过：含个人请求、商业请求、轮询保留类型、未配置类型不发送。
- tsc --noEmit 与 vue-tsc --noEmit --skipLibCheck 通过。
- 7 个改动文件 Prettier 格式化/检查、ESLint 通过；3 个 Vue 文件 Stylelint 通过。
- Vite production build 通过（15.89s）。
- 默认 package test 命令缺测试 alias，会报 CSS loader 错误；使用仓库已有 node-test-alias 后跑全量，1197 tests，1189 pass、8 fail。8 个失败全部在基线 74e5bf9d 的 4 个原测试文件中复现，无新增失败。本任务不修改无关测试基础设施。
- worktree 复用原目录的 node_modules 软链接，未安装依赖。pnpm 11 自动依赖检查尝试同步时因非 TTY 退出，随后直接调用已有二进制完成验证，锁文件未改变。

未做运行环境部署、浏览器人工验收或真实账号注册。需同批发布 Go、Armada V228 和后端配置；后端就绪后再发布前端。回滚前先停用新建商业注册，不能让旧后端处理在途商业事务。

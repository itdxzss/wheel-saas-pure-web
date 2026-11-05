# 账号档位检测 C：前端草稿补全

2026-11-05 / `1.0.3-snapshot`。任务来源：`armada/docs/handoff/2026-11-05-账号档位检测-Codex任务书.md` 第 4.4 节。没有创建分支、部署或查询真实账号；用户现已授权本功能提交和推送。

## 实现

- 在原有列表、新建、详情、时间线草稿上继续；保留模板布局、样式、抽屉宽度和现有 Element Plus / pure-admin 组件。
- 抽取 `useTierCheckCreate/List/Detail`。新建参数变化使预览失效；重复点击只发一次创建；同一创建请求失败重试复用 requestId；关闭/换批次后旧请求不能覆盖当前状态。
- 详情仅在执行中且抽屉打开时每 4 秒 GET 刷新，关闭/完成后清理计时器，不自动创建复查。失败信息可见，筛选时回到第一页，时间线拒绝过期响应。
- 档位分布保留既有排序，并显示后端未来返回的未知档位；`EMPTY_RESPONSE` 展示为失败原因，不伪造档位消失。对比文案明确使用账号最近一次成功快照。
- `view` 可读，`edit` 才显示/执行新建、复查、停止、重试与列表入口。后端另做鉴权，前端隐藏不替代权限校验。
- mock 菜单放在分组和导入之间。账号列表批量操作新增“检测档位”，把勾选 ID 快照带入同一个新建抽屉；API `accountIds` 与 `accountGroupIds` 二选一。
- 三个账号列表共享文件只增补本功能片段，保留另一会话的互聊入口；未改 SMS activation 文件。共享文件接入前副本与基线哈希保存于 `/tmp/account-tier-check-baseline-20261105/`。

## 离线验证

- 本仓现有相关测试使用 `node:test` + `tsx`，未安装 Vitest 或更换测试体系。任务书提到的参考测试也是该运行方式。
- `node --import tsx --import ./src/api/__tests__/node-test-alias.mjs --test src/views/account/tier-check/tier-check-display.test.ts src/views/account/tier-check/composables/*.test.ts`：12 项通过，0 失败。
- `pnpm typecheck`：TypeScript / vue-tsc 通过。
- 本功能、三个共享接入文件、菜单 mock、本地 e2e 的 `eslint --max-warnings 0` 通过；本功能 Vue stylelint 与 Prettier check 通过。没有运行会自动改写其他会话文件的全仓 `lint --fix`。
- `NODE_OPTIONS=--max-old-space-size=8192 pnpm exec vite build --outDir /tmp/account-tier-check-dist`：通过。调用与 package build 相同的 Vite 构建，输出到独立目录，不清理共享 dist。
- 本地 Playwright 用例：`ARMADA_E2E_BROWSER_CHANNEL=chrome ARMADA_E2E_BASE_URL=http://127.0.0.1:8895 pnpm exec playwright test e2e/account-tier-check-local.spec.ts --reporter=line --output=/tmp/account-tier-check-e2e-results`：7 项通过（26.8s）。覆盖自查、探针、预览失效、详情筛选/翻页/时间线、只读刷新、停止/重试/确认复查、只读权限、账号列表入口。仅使用虚构、打码号码及临时本地会话；非本机请求和未声明的 API 全部中止。
- 浏览器验证使用已安装 Chrome；未下载浏览器。Vite dev 在本机遇到 EMFILE，改用静态构建和仅监听 127.0.0.1 的 Python HTTP 服务。首次缺失 Playwright bundled browser、沙箱禁止 Chrome 启动及控件定位失败均不是最终通过结果；最终以重跑输出为准。
- 日志：`/tmp/account-tier-check-frontend-{unit,typecheck,eslint,stylelint,prettier,build}.log`、`/tmp/account-tier-check-e2e.log`。

## 视觉核对

截图位于 `screenshots/`，视口 1440 × 900，与任务书原型相同。已人工查看并对照列表、新建自查、新建探针、批次详情、时间线五种状态：菜单位置、筛选/表格结构、720/1080/520px 抽屉宽度、字段顺序一致；夹具内容不同，不作像素相同断言。

## 边界

Armada 调度默认关闭。此报告不代表前后端真实服务联调、MySQL 部署或 WhatsApp 真机验收；真实账号试跑和最终限流参数需用户另行授权并确认目标环境。本次提交和推送已获用户确认，部署仍禁止。

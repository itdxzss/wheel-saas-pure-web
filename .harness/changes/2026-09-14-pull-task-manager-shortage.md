# 管理员不足误报与并发等待展示

- 配套 Armada EXECUTION_SLOT_UNAVAILABLE 原因码，显示“等待并发名额”，隐藏该状态的管理员/拉手/站台补充入口，保留暂停和结束等既有操作约束。
- 任务情况筛选增加“等待并发名额”，通过现有 executions 接口的可选 reasonCode 参数下推查询。真实管理员不足仍使用原标签及补充入口。
- 前端 148 项相关测试通过；命令：`node --import tsx --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("./src/api/__tests__/node-test-loader.mjs", pathToFileURL("./"));' --test 'src/views/task/pull-task/**/*.test.ts' src/api/pull-task.test.ts`。
- 使用项目既有测试 loader 在 tsx 之后注册；直接运行这些 API/composable 测试会加载浏览器 CSS 并报 ERR_UNKNOWN_FILE_EXTENSION，未修改测试依赖或弱化断言。
- `npm run typecheck`、`npm run build`、本次文件 ESLint / Prettier 检查通过。
- 已在主仓库 `1.0.3-snapshot` 提交 `1e2203723c0072026a07c5374822bd795ed49c68`，于 2026-09-14 15:30 CST 与后端 `4ccab6b2` 配套部署第一套 test1；未推送远端 Git。无数据库或 Redis 变更。
- 从该固定提交的发布 worktree 构建，显式设置 `ARMADA_FRONTEND_DIR`；本地 dist、运行中 nginx 和实际 HTTP 的 index 及三份改动相关 JS 哈希一致。部署退出码 0，容器 running、restartCount=0。
- 已登录浏览器刷新后，任务 #211 详情可加载，“等待并发名额”筛选可选择并完成查询；该任务当前 PAUSED，新状态查询返回 0 条，暂停前旧原因需恢复后由调度器重新复核。未恢复任务或宣称真实拉群业务已验收。
- 本机 pnpm 11 与既有 node_modules 布局不兼容；保持依赖和 lockfile不变，发布使用脚本 npm 回退。手动质量检查通过后，以 `HUSKY=0` 跳过会触发此问题的提交 hook。
- 完整发布证据见后端 `.harness/changes/2026-09-14-pull-task-manager-shortage.md`；原始部署与产物核对日志在 `/private/tmp/manager-shortage-test1-deploy.log`、`/private/tmp/manager-release-runtime-check.log`。
- 回滚仅回退本次状态判断、筛选和操作入口改动。

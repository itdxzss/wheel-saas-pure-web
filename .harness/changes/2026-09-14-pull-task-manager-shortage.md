# 管理员不足误报与并发等待展示

- 配套 Armada EXECUTION_SLOT_UNAVAILABLE 原因码，显示“等待并发名额”，隐藏该状态的管理员/拉手/站台补充入口，保留暂停和结束等既有操作约束。
- 任务情况筛选增加“等待并发名额”，通过现有 executions 接口的可选 reasonCode 参数下推查询。真实管理员不足仍使用原标签及补充入口。
- 前端 148 项相关测试通过；命令：`node --import tsx --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("./src/api/__tests__/node-test-loader.mjs", pathToFileURL("./"));' --test 'src/views/task/pull-task/**/*.test.ts' src/api/pull-task.test.ts`。
- 使用项目既有测试 loader 在 tsx 之后注册；直接运行这些 API/composable 测试会加载浏览器 CSS 并报 ERR_UNKNOWN_FILE_EXTENSION，未修改测试依赖或弱化断言。
- `npm run typecheck`、`npm run build`、本次文件 ESLint / Prettier 检查通过。
- 未提交、推送或部署；需要与后端配套发布并验证真实任务状态。无数据库或 Redis 变更。
- 回滚仅回退本次状态判断、筛选和操作入口改动。

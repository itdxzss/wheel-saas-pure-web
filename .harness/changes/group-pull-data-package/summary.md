# 拉群数据包菜单与标准拉群接入

- 目标：对齐普通版竞品拉群数据包的筛选、列层级、行操作与弹窗，完成真实 API 和正式标准拉群选包闭环。
- 事实源：`竞品/拉群营销分析_20260914/readable/data-FoAqnJe7.js`；接口合同由 Armada 业务文档维护。
- 页面：`src/views/resource/group-data-package/`；接口：`src/api/group-data-package.ts`。
- 适配：保留 A/a 管理员标记、隐私拒绝与未注册分开、有导出权限时可导出当前租户数据包、无硬编码国家限制。
- 边界：用户已明确将点击趋势延期，列表显示“待接入”，不伪造请求、0次访问或空曲线；隐藏整合新建页不作为任务消费入口。
- 进度：前端代码、接口合同审查和本地检查完成；2026-09-15 01:43 已部署 test1，公网 index 与 dist 哈希一致。后端 V191/V192 和只读深度检查通过；真实业务页面当前需要登录，尚未完成远程导入/任务取用验收。详见后端 `.harness/changes/group-pull-data-package/test1-deployment.md`。

## 实现

- 菜单保持名称、大洲、业务、创建时间、主要国家筛选；表格保留国家/大洲/消费业务独立列、号码使用组合指标、点击待接入、导出状态、创建时间。
- CRUD、导入预检与确认、服务端导入结果、号码分页/状态筛选、导入批次分页、单包/批量状态 TXT/CSV、列表 CSV、失败重置均接真实 API。
- 普通版竞品的“未开通”改为实际“隐私拒绝”，与未注册、待确认分开；只有明确可重试失败可以申请重置，是否存在活动任务占用由后端最终判断。
- 导入使用 7–15 位号码、尾 A/a、展示字符清洗、首次物理行顺序、重复管理员属性合并；上限为 100,000 个有效去重号码和 10 MiB；CR/Unicode 换行与后端一致。原始物理行包含忽略空行，导入超时明确为结果待确认。
- 标准拉群抽屉新增真实分页多选数据包；JSON 同时传 creationMode/packageIds/groupFolderId/linksText，保留选择顺序，每包一个执行单元。返回来源包 ID/generation；产品仅展示包名、ID、数量。
- 适配常见桌面宽度：固定操作列压缩为导出、导入、详情、更多；编辑/重置/删除收在更多内，所有动作仍可达。所有写操作与导出保留独立权限；多根 popover 组件内部使用 hasAuth 防止外层指令失效。
- API 与后端对账修正：大洲使用 ASIA/EUROPE 等既有枚举；imports 为标准分页；phone.status 为 RETRYABLE_FAILED 等字符串；failedCount 包含隐私拒绝和未注册；导出读取 Content-Disposition / X-Export-Count。新选包接口双权限遗漏已反馈后端 agent 并修正。

## 验证（2026-09-15）

- `pnpm typecheck`：通过（tsc + vue-tsc）。
- `node --import tsx --import ./src/api/__tests__/node-test-alias.mjs --test 'src/views/task/pull-task/**/*.test.ts' src/api/pull-task.test.ts src/api/group-data-package.test.ts 'src/views/resource/group-data-package/**/*.test.ts'`：166/166 通过；日志 `/tmp/group-data-package-frontend-tests.tap`。
- 新增重点覆盖：API字段/导出JSON错误、原文件A标记、100,000有效去重边界、原始物理行、隐私/未注册/未知状态区分、CSV公式防护、正式选包顺序/同请求群来源/重复包拦截/冲突保留草稿。
- 修改范围 ESLint `--max-warnings 0`：通过。
- 同一项目规则 Stylelint：通过。默认命令因 pnpm 根目录缺少间接配置包链接无法解析；使用 `--config-basedir node_modules/.pnpm/node_modules` 解析已有依赖，未更改依赖清单或规则。
- 最终 `pnpm build`：通过，13.15 秒；日志 `/tmp/group-data-package-frontend-build.log`。
- `git diff --check`：通过。没有修改其他 agent 的浏览器测试文件、后端代码或部署。

- 本地浏览器7/7通过：列表服务端名称筛选、保存失败保留输入、真实下载内容、只读权限、TXT预检/确认/提交、编辑版本/重置/删除、号码与导入记录。浏览器请求使用测试专属合成API夹具，不宣称已连接远程环境。日志 `/tmp/group-data-browser-final.log`。

## 菜单维护补查

- V191 插入的页面可按现有 TaskCenter 动态路由加载；租户管理员动态获得全部有效菜单，普通角色继续显式授权页面与按钮，不新增角色越权授权。
- 补齐系统菜单编辑页 `componentOptions` 与后端 `MenuManagementServiceImpl.ALLOWED_COMPONENTS` 的数据包组件路径，防止修改名称或排序时报组件不允许。后端新增创建及编辑两个服务回归用例，Maven 由主任务合并验证，避免并发占用编译输出。
- 修改后前端 `pnpm typecheck`、系统菜单页面 scoped ESLint、菜单页面与路由既有测试 11/11 均通过；再次 `pnpm build` 通过（12.14 秒，`/tmp/group-data-package-menu-frontend-build.log`）。

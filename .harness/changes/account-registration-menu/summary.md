# 账号管理 / 新号注册

## 用户确认

2026-09-15：将 Grizzly 号码采购、接码和 Cobalt 注册页面放在「账号管理」下，独立菜单命名「新号注册」。本轮范围是入口与页面归属调整。

## 实现

- 路由 `/account/registration`，页面 `account/registration/index`，组件名和菜单标识 `AccountRegistration`。
- 原 `account/import` 的注册抽屉迁为独立页面；表单、任务表、状态展示和 composable 同步迁到 `account/registration/`，移除账号导入中的旧入口。
- 页面包含「新建注册」「注册任务」两个页签，复用现有注册 API 和账号分组 API；保留价格库存、采购数量、账号类型、分组与逐项结果。
- 页面显示时每 5 秒刷新任务，停用或卸载时停止刷新；提交未确认时保留原请求并阻止路由离开，避免在丢失原请求编号后重复下单。
- 开发 mock 菜单与菜单编辑器组件候选同步新增；生产菜单仍来自 `/api/tenant/me/menus`。
- 后端配套 V194 菜单迁移和组件白名单，复用 `tenant:account:edit`，保持已有角色授权规则。

## 验证

- 注册请求生命周期、账号导入表格和动态菜单树现有测试共 15 项通过，0 失败；命令：`node --import tsx --import ./src/api/__tests__/node-test-alias.mjs --test src/views/account/registration/composables/useAccountRegistration.test.ts src/views/account/import/components/AccountImportTable.test.ts src/router/menu-tree.test.ts`。
- `pnpm typecheck`（tsc + vue-tsc）通过；新页面、系统菜单候选和开发菜单的定向 ESLint 通过。
- `pnpm exec vite build --outDir /private/tmp/new-account-menu-build-20260915` 通过，构建输出保存在临时目录，未覆盖共享 dist。
- `git diff --check` 通过。尚未进行浏览器运行时验收；后端菜单和 H2 迁移验证见 Armada 同名 change 记录。
- 本轮不改采购/注册编排，不部署、不实际购号；真实接码、注册、登录验收仍未完成。

## 回滚

按本轮文件差异回退页面和菜单调整，保留原有注册业务代码及其他会话修改。生产菜单迁移仅在获准部署的目标环境通过 Flyway 执行；本轮未修改任何共享库。

## 报价币种展示

2026-09-15 用户要求给价格档位补币种。依据 Grizzly 官方公告，2025-09-01 起全部价格和余额切换为 USD，`getPrices` 返回价格及 `getNumber.maxPrice` 均以美元计价：
https://grizzlysms.com/cn/blog/important-update-all-grizzly-sms-prices-and-balances-are-switching-to-usd

下拉报价显示「0.15 美元/个 · 库存 …」，说明文字明确美元（USD）/个号码，注册任务的采购单价同步补美元单位。保留接口原始价格精度与采购参数，不进行币种换算；实际费用仍以订单返回币种展示。本次仅更新前端，沿用用户已确认的 test1 发布环境。

验证：`pnpm typecheck`、两个变更 Vue 文件的定向 ESLint、Vite 构建和 `git diff --check` 通过。

## 注册号码单价与默认美国渠道

用户确认字段名改为「注册号码单价」，并反馈控端价格与网站截图不同。2026-09-15 只读核对供应商报价：美国（187）的六档为 0.88、1.22、1.35、1.60、3.13、5.00 USD，与用户截图一致；美国虚拟（12）为 0.15、0.28、0.40、0.44、0.59 USD。

根因是前端把目录首项当默认值，而供应商目录先返回美国虚拟。新建、重置草稿及失效渠道恢复时优先选择目录中实际存在的美国（187）；刷新目录保留仍有效的用户选择。报价数值保持 API 原值，不硬编码档位或调整金额。字段及说明同步改为「注册号码单价」，选择提示明确为当前渠道的价格档位。仅发布前端到已确认的 test1 环境。

补充说明明确费用覆盖 Grizzly 号码与接码服务，号码需注册成功后才成为账号。新增 4 项默认渠道/保留手选/缺省及空目录回归，与既有生命周期测试共 12 项通过；类型检查、定向 ESLint、Vite 构建及 diff 检查通过。

## 注册目标分组交互修正（2026-09-15）

- 目标分组的选项及选中值显示“名称（N 个账号）”，数量使用分组接口返回的 totalAccounts。
- test1 复现结果：原输入框填名后能够创建并自动选中，但空名称导致按钮灰显，输入还会触发外层目标分组必填校验，缺少成功反馈。
- 改为独立“新增分组”弹窗；空名给出提示，创建成功关闭弹窗、清除目标分组校验并自动选中，显示成功提示。保持采购草稿锁定及防重复提交边界。
- 分组接口/注册生命周期共 17 项现有测试通过；typecheck、目标组件 ESLint 和生产构建通过。本次仅发布前端到 test1。

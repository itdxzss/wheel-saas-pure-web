# 买号上量系统二期管理端设计

## 1. 文档信息

- 日期：2026-07-17
- 状态：设计已逐节评审通过，等待书面复核
- 需求来源：
  - `D:/documents/买号上量系统_模版管理_渠道管理_渠道统计需求文档_V1.1_H5抽奖拉群合并版 - 副本.docx`
  - 用户提供的模板管理、渠道管理、渠道统计和渠道新增/编辑四张效果图
- 事实优先级：效果图决定页面字段、按钮和布局；Word 正文补充业务规则、校验、异常、安全和验收口径。

## 2. 目标与范围

### 2.1 目标

在 `wheel-saas-pure-web` 中新增“买号上量系统”业务域，提供模板管理（二期）、渠道管理（二期）和渠道统计（二期）三个管理端页面。后端接口尚未实现，因此本次设计采用“类型化接口契约先行 + 仅开发环境 Mock”的方式，使前端可独立开发、演示和测试，同时禁止生产环境依赖假数据。

### 2.2 本期范围

- 新增一级菜单、两个菜单分组和三个页面路由。
- 完成三个页面的查询、表格、抽屉/弹窗、加载、空、错误和权限设计。
- 完成模板、渠道、统计的 TypeScript API 契约设计。
- 为新增/编辑渠道提供开发环境 Mock 和完整表单回显。
- 约束同一域名只能绑定一个模板；同域名同模板可创建多个渠道。
- 预留“访问域名 + 推广码”解析静态页运行配置的公共接口契约。
- 定义模板、渠道、域名静态页运行配置和渠道统计之间的数据流。

### 2.3 不在本期范围

- 后端接口、数据库表、迁移、唯一索引和审计服务的实际编码。
- H5 抽奖、WS 绑号、OTP、分享和奖励页面的实际开发。
- 当前仓库之外的域名静态页/H5 工程改造。当前仓只定义其运行配置契约；对应工程必须另行实现模板图片切换和国家区号行为。
- 模板内容新增、删除、版本编辑和模板设计器。

## 3. 已选方案与取舍

选择“接口契约先行 + 仅开发环境 Mock”。

- 优点：后端未完成时三个页面仍可完整展示、交互和自动化测试；后续只需替换真实接口实现，不重写页面状态。
- 约束：Mock 只能位于 `mock/`，Fake Server 必须关闭生产启用，页面不得内置生产假数据兜底。
- 未选择“无 Mock 的纯空壳页面”，因为无法按效果图完成本地联调和验收。
- 未选择“页面硬编码示例数据”，因为违反项目生产路径禁止假数据的规则。

## 4. 菜单、路由与权限

### 4.1 菜单树

```text
买号上量系统
├─ 推广管理
│  ├─ 模板管理（二期）
│  └─ 渠道管理（二期）
└─ 数据中心
   └─ 渠道统计（二期）
```

### 4.2 路由

| 页面             | 路径                        | 路由名              | 组件                        |
| ---------------- | --------------------------- | ------------------- | --------------------------- |
| 模板管理（二期） | `/buyer/promotion/template` | `BuyerTemplate`     | `buyer/template/index`      |
| 渠道管理（二期） | `/buyer/promotion/channel`  | `BuyerChannel`      | `buyer/channel/index`       |
| 渠道统计（二期） | `/buyer/data/channel-stats` | `BuyerChannelStats` | `buyer/channel-stats/index` |

生产菜单最终从 `/api/tenant/me/menus` 获取。前端适配 wheel 菜单字段：`route_path`、`menu_key`、`name`、`icon`、`module_key`、`perm_key`、`view_path` 和 `children`。开发环境 Mock 返回同一字段结构，不保留生产 `/get-async-routes` 假数据兜底。

### 4.3 权限

| 能力           | module_key            | perm_key                            |
| -------------- | --------------------- | ----------------------------------- |
| 模板查看       | `buyer_template`      | `tenant:buyer-template:view`        |
| 子账号可见修改 | `buyer_template`      | `tenant:buyer-template:visibility`  |
| 模板备注修改   | `buyer_template`      | `tenant:buyer-template:remark`      |
| 渠道查看       | `buyer_channel`       | `tenant:buyer-channel:view`         |
| 渠道新增       | `buyer_channel`       | `tenant:buyer-channel:create`       |
| 渠道编辑       | `buyer_channel`       | `tenant:buyer-channel:edit`         |
| 渠道删除       | `buyer_channel`       | `tenant:buyer-channel:delete`       |
| 渠道探测       | `buyer_channel`       | `tenant:buyer-channel:detect`       |
| 统计查看       | `buyer_channel_stats` | `tenant:buyer-channel-stats:view`   |
| 统计补录       | `buyer_channel_stats` | `tenant:buyer-channel-stats:edit`   |
| 统计导出       | `buyer_channel_stats` | `tenant:buyer-channel-stats:export` |

前端使用 `ReAuth` / `RePerms` 控制可见性，后端对每个接口重复强校验。顶层和分组节点只承载导航，不替代叶子页面权限。

## 5. 前端目录与组件边界

```text
src/api/
├─ buyer-template.ts
├─ buyer-channel.ts
└─ buyer-channel-stats.ts

src/views/buyer/
├─ template/
│  ├─ components/TemplatePreviewDialog.vue
│  ├─ components/TemplateRemarkDialog.vue
│  ├─ composables/useBuyerTemplatePage.ts
│  ├─ constants.ts
│  └─ index.vue
├─ channel/
│  ├─ components/ChannelFormDrawer.vue
│  ├─ components/ChannelDetectDialog.vue
│  ├─ components/FacebookEventGuideDialog.vue
│  ├─ composables/useBuyerChannelPage.ts
│  ├─ channel-domain.ts
│  ├─ channel-form.ts
│  ├─ constants.ts
│  └─ index.vue
└─ channel-stats/
   ├─ components/ChannelStatsTable.vue
   ├─ components/ChannelStatsDailyRows.vue
   ├─ composables/useBuyerChannelStatsPage.ts
   ├─ channel-stats-format.ts
   ├─ constants.ts
   └─ index.vue
```

页面使用 `PureTableBar`、`ElTable`、`ElForm`、`ElDrawer`、`ElDialog`、`ElSelect`、`ElDatePicker` 和项目图标能力。不自绘表格、下拉、分页、抽屉或弹窗。页面局部状态留在 composable，不放入 Pinia。任何 `.vue` 文件不超过 600 行，超过 400 行优先拆分。

## 6. 模板管理（二期）

### 6.1 页面结构

页面按第一张效果图展示“模板列表”，顶部只有刷新和列设置，不增加搜索区、分页、新增、删除、批量操作或模板内容编辑。

表格列按以下顺序：

1. ID
2. 模板编码
3. 模板名称
4. 预览图
5. 子账号可见
6. 支持参数
7. 备注
8. 创建时间
9. 更新时间
10. 操作

ID、模板编码、模板名称和操作列为必要列，不能全部隐藏。支持参数使用 `ElTag` 展示。

### 6.2 交互

- 查看预览：打开 `TemplatePreviewDialog.vue`，加载当前模板对应的资源。预览失败显示错误，不得让所有模板共用同一个静态示意图。
- 子账号可见：行内 `ElSwitch`；提交期间只锁定当前行，失败时回滚并显示错误。
- 修改备注：打开 `TemplateRemarkDialog.vue`，回显原值，允许清空，保存时 trim，最大 500 字。成功后更新备注和更新时间。
- 刷新：重新请求模板列表，不使用本地常量重绘。
- 页面覆盖 loading、初始无数据和接口错误重试。

### 6.3 API 契约

```text
GET   /api/buyer/templates
PATCH /api/buyer/templates/{id}/subaccount-visibility
PATCH /api/buyer/templates/{id}/remark
```

模板记录至少包含：

```ts
interface BuyerTemplateRow {
  id: number;
  code: string;
  name: string;
  previewUrl: string;
  subaccountVisible: boolean;
  supportedParams: string[];
  remark: string;
  createdAt: string;
  updatedAt: string;
  runtimeVersion: string;
}
```

页面文案统一使用“模板”。

## 7. 渠道管理（二期）

### 7.1 页面结构

页面按第二张效果图展示：

1. 上号费用提示，费用从选项接口返回，不写死 `0.05 USDT/个`。
2. Facebook 像素自动上报说明，点击打开说明弹窗。
3. 查询区：目标国家、绑定模板、创建人、上级用户、重置、搜索。
4. 渠道列表：新增渠道、刷新、列设置和分页。

表格列：渠道名称、推广码、目标国家、绑定模板、推广平台、FB 域名状态、推广链接、裂变链接、预选区号、状态、创建人、创建时间和操作。操作包含编辑、探测、删除。推广/裂变链接只允许 `http` / `https`，使用新窗口安全打开。

分页默认 30 条，页大小为 30、60、200、500。

### 7.2 新增与编辑抽屉

新增和编辑共用 `ChannelFormDrawer.vue`，布局按第四张效果图。字段包括：

- 渠道名称（必填）
- 归属用户（必填）
- 目标国家（必填）
- 绑定模板（必填）
- 主题色
- 访问域名（必填，界面固定 `https://` 前缀）
- 预选区号
- 推广平台：Facebook、TikTok、快手、MGSKY Ads
- Pixel ID
- Access Token
- 意向用户上报事件，默认 `Lead`
- 请求登录上报事件，默认 `InitiateCheckout`
- 登录成功上报事件，默认 `CompleteRegistration`
- App 内打开
- 参加营销
- 状态

新增模式必须创建全新的默认表单，不能沿用上次关闭时的数据。编辑模式先调用详情接口，再完整回显此前保存的值。切换编辑对象时清理旧表单。

Access Token 是唯一不回显原文的字段：详情只返回 `accessTokenConfigured: boolean`，界面显示“已配置”；输入为空表示不修改，重新输入才覆盖。平台切换时，快手和 MGSKY Ads 隐藏并禁用 Access Token；Facebook 和 TikTok 显示平台对应字段。

### 7.3 目标国家和预选区号

- 目标国家为“混合（不限国家）”时，域名静态页手机号登录区允许选择所有受支持国家；预选区号决定首次打开的默认国家，用户仍可切换。
- 目标国家为指定国家时，选择后自动填充对应预选区号；域名静态页只提供该国家及其区号，不能切换到其他国家。
- 编辑时同时回显国家模式和预选区号。
- 前端和后端都校验指定国家与区号一致。

### 7.4 域名规范化和绑定约束

访问域名只接受主机名。规范化步骤：trim、移除 `http://` 或 `https://`、拒绝路径/查询/片段/端口、转小写、移除末尾点，并用 URL 解析结果作为提交值。

保存前调用：

```text
GET /api/buyer/channels/domain-binding
    ?domain=jhz12oo.co
    &templateId=130
    &excludeChannelId=1001
```

规则：

- 域名未绑定：允许保存。
- 同一域名已绑定同一模板：允许创建多个渠道。
- 同一域名已绑定其他模板：阻止保存，域名字段显示“该域名已经绑定其他模板”。
- 编辑时 `excludeChannelId` 排除当前渠道自身。
- 正式保存接口重复执行同一约束；并发冲突返回 `409 DOMAIN_TEMPLATE_CONFLICT`，前端映射为同一固定提示。
- 若同域名存在其他渠道，单个渠道不得切换到不同模板；必须更换域名。

前端预检只改善体验，后端必须通过唯一约束和事务保证最终一致性。

### 7.5 行操作

- 编辑：获取详情并打开同一抽屉。
- 探测：前端只提交渠道 ID，业务后端执行平台 API 请求，返回脱敏结果；保存/探测期间禁止重复操作。
- 删除：二次确认；有关联任务、统计或其他占用时，后端返回占用原因并整体阻止删除。
- 链接、接口、日志、错误和审计不返回完整 Access Token。

### 7.6 API 契约

```text
GET    /api/buyer/channels/options
GET    /api/buyer/channels
GET    /api/buyer/channels/{id}
GET    /api/buyer/channels/domain-binding
POST   /api/buyer/channels
PUT    /api/buyer/channels/{id}
DELETE /api/buyer/channels/{id}
POST   /api/buyer/channels/{id}/detect
```

选项接口返回上号费用、国家、模板、归属用户、创建人、上级用户、平台和事件枚举。列表查询参数为 `countryCode`、`templateId`、`createdBy`、`parentUserId`、`page` 和 `pageSize`。

## 8. 域名静态页运行配置

### 8.1 公共接口

静态页根据访问域名和推广码获取运行配置：

```text
GET /api/public/buyer/channel-runtime
    ?host=jhz12oo.co
    &channelCode=cgjyqyqa
```

响应至少包含：

```ts
interface BuyerChannelRuntimeConfig {
  channelId: number;
  channelCode: string;
  runtimeVersion: string;
  templateId: number;
  templateVersion: string;
  templateAssets: Record<string, string>;
  templateParams: Record<string, string | boolean>;
  countryMode: "MIXED" | "SPECIFIC";
  allowedCountries: Array<{ code: string; dialCode: string }>;
  defaultDialCode: string;
  themeColor: string;
  platform: "FACEBOOK" | "TIKTOK" | "KUAISHOU" | "MGSKY";
  pixelId?: string;
  eventMappings: {
    lead: string;
    loginRequest: string;
    loginSuccess: string;
  };
  appOpenEnabled: boolean;
  marketingEnabled: boolean;
}
```

### 8.2 模板和渠道的影响

- 绑定模板决定静态页图片、布局、模板版本和支持参数。
- 模板后台预览与静态页使用同一模板资源事实源。
- 同一域名同一模板的多个渠道通过推广码区分国家、区号和投放配置。
- 修改渠道配置后，后端发布新的 `runtimeVersion`；保存成功响应必须包含发布结果。
- 配置发布成功前，管理端不能提示“保存并生效成功”。
- 禁用或删除渠道后，对应推广码不可继续访问，历史统计保留。
- 运行配置加载失败时显示不可用状态，不得加载其他模板或国家配置兜底。

## 9. 渠道统计（二期）

### 9.1 查询区

按第三张效果图提供：

- 日期范围，默认最近 7 个自然日，时区 `Asia/Shanghai`
- 渠道
- 渠道名称模糊搜索
- 模板
- 目标国家
- 创建人
- 上级用户
- 重置、查询和导出

统计由后端按条件聚合，前端不拉取明细自行汇总。首版不在效果图之外增加分页控件，接口返回当前筛选条件下的全部渠道/国家汇总行。

### 9.2 多级表头

基础列：展开、渠道/国家、绑定模板。

广告投放分组：消耗、展示、点击/点击率、其他费用、总费用/手续费。

基础指标分组：UV、访问时长、登录请求、登录成功、解绑数量、解绑率、请求登录率、登录成功率、访客上号率、获号成本。

登录请求和登录成功都分别展示次数与去重人数，不能复用同一个字段。前两列固定，宽表允许水平滚动。列设置文案为“自定义列”，渠道/国家和绑定模板为必要列。

### 9.3 指标口径

| 指标       | 公式                                |
| ---------- | ----------------------------------- |
| 点击率     | 点击数 ÷ 展示数                     |
| 手续费     | 消耗 × 手续费率                     |
| 总费用     | 消耗 + 手续费 + 其他费用            |
| 请求登录率 | 登录请求去重人数 ÷ UV               |
| 登录成功率 | 登录成功去重人数 ÷ 登录请求去重人数 |
| 访客上号率 | 登录成功去重人数 ÷ UV               |
| 解绑率     | 解绑数量 ÷ 登录成功去重人数         |
| 获号成本   | 消耗 ÷ 登录成功次数                 |

分母为 0 时显示 `-`。后端返回数值字段和计算结果，前端只格式化，不解析格式化字符串参与运算。

### 9.4 每日明细与补录

点击行首箭头，以 `channelId + countryCode + date` 懒加载日明细。每个展开行使用自身数据，禁止复用全局静态明细。

可补录字段：消耗、展示、点击、手续费率、其他费用。金额和费率非负；展示和点击为非负整数。保存请求携带版本号，后端保存、审计并重新计算日明细和当前区间汇总。响应返回新日明细、区间汇总和版本。`409 VERSION_CONFLICT` 要求刷新后再编辑。

### 9.5 API 契约

```text
GET /api/buyer/channel-stats/options
GET /api/buyer/channel-stats
GET /api/buyer/channel-stats/{channelId}/daily
PUT /api/buyer/channel-stats/{channelId}/daily/{date}
GET /api/buyer/channel-stats/export
```

汇总查询参数为 `dateStart`、`dateEnd`、`channelId`、`channelName`、`templateId`、`countryCode`、`createdBy`、`parentUserId`、`sortField` 和 `sortOrder`。`sortField` 只接受 `spend`、`impressions`、`clicks`、`totalFee`、`uv`、`loginSuccessUserCount`、`unbindRate`、`accountCost`，`sortOrder` 只接受 `asc` 或 `desc`。导出使用当前查询条件，包含完整业务列，文件名包含起止日期。导出期间显示 loading，失败不生成空文件。

## 10. 通用数据流和状态

```text
模板版本/资源
  → 渠道绑定 templateId
  → 渠道保存并发布 runtimeVersion
  → 静态页以 host + channelCode 获取运行配置
  → 静态页产生访问、登录、解绑事件
  → 后端按渠道、国家、日期聚合
  → 渠道统计查询、展开和导出
```

所有列表页分别维护 `loading`、`rows`、`errorMessage` 和操作级 loading。查询失败清空不可信数据并保留查询条件；重置恢复默认值后重新请求；成功提示只在接口成功并完成必要发布后显示。

## 11. 错误处理

| 场景                           | 前端处理                               |
| ------------------------------ | -------------------------------------- |
| 401                            | 交给统一登录失效流程                   |
| 403                            | 显示权限不足，不伪装为空数据           |
| 404                            | 提示对象已删除，关闭编辑界面并刷新列表 |
| 409 `DOMAIN_TEMPLATE_CONFLICT` | 域名字段提示“该域名已经绑定其他模板”   |
| 409 `VERSION_CONFLICT`         | 提示数据已被其他人修改并重新加载       |
| 422                            | 显示到具体字段并保留其他输入           |
| 超时/500                       | 显示可重试错误，不提示成功             |

错误信息、网络响应、复制内容和前端日志禁止包含完整 Access Token、认证信息或敏感手机号。

## 12. 开发 Mock 隔离

- `mock/asyncRoutes.ts` 增加买号上量菜单树，字段结构与后端菜单契约一致。
- `mock/buyer.ts` 提供模板、渠道、详情、域名占用、探测、运行配置、统计、日明细、补录和导出场景。
- Mock 覆盖成功、空数据、403、404、域名 409、版本 409、422 和 500。
- `vitePluginFakeServer` 设置 `enableProd: false`。
- 页面和 `src/api/` 不导入 Mock fixture。
- 生产接口失败时展示错误，不切换到 Mock。

## 13. 测试与验收

### 13.1 自动化测试

- 菜单：三级树、路径、路由名、组件路径、`module_key` 和 `perm_key`。
- API：方法、URL、查询参数、请求体、统一响应拆包、Blob 文件名。
- 模板：预览资源、子账号可见失败回滚、备注 trim/清空/500 字。
- 渠道表单：新增默认值、编辑完整回显、切换记录无残留。
- Token：详情不含原文、留空不覆盖、新输入才更新。
- 域名：规范化、同模板允许、跨模板阻止、编辑排除自身、409 文案。
- 静态页配置：模板资源、混合国家全部可选、指定国家锁定区号、推广码隔离渠道。
- 统计：查询参数、日明细按渠道隔离、补录校验、分母为零、导出失败。
- Mock：生产构建不包含买号上量 Mock 接口和 fixture。

### 13.2 验证命令

```powershell
node --import ./src/api/__tests__/node-test-alias.mjs --test --experimental-strip-types mock/buyer.test.ts src/api/buyer-template.test.ts src/api/buyer-channel.test.ts src/api/buyer-channel-stats.test.ts src/views/buyer/template/index.test.ts src/views/buyer/channel/channel-domain.test.ts src/views/buyer/channel/channel-form.test.ts src/views/buyer/channel/index.test.ts src/views/buyer/channel-stats/channel-stats-format.test.ts src/views/buyer/channel-stats/index.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vue-tsc --noEmit --skipLibCheck
./node_modules/.bin/eslint mock/asyncRoutes.ts mock/buyer.ts src/api/routes.ts src/api/buyer-template.ts src/api/buyer-channel.ts src/api/buyer-channel-stats.ts src/views/buyer --max-warnings 0
./node_modules/.bin/vite build
git diff --check
```

### 13.3 人工验收

- 菜单、面包屑和标签页与确认结构一致。
- 三个页面与前三张效果图一致，渠道新增/编辑抽屉与第四张图一致。
- 新增、编辑、关闭、重新打开不会残留错误表单状态。
- 编辑渠道完整回显；Token 仅显示已配置状态。
- 域名跨模板冲突显示指定文案。
- 混合国家和指定国家在运行配置中产生不同国家/区号集合。
- 宽表水平滚动、固定列、自定义列和展开明细正常。
- loading、空、错误、权限和重试状态不会破坏表格结构。

## 14. 实施顺序

1. 菜单适配、开发 Mock 隔离和路由测试。
2. 三个 typed API 文件及 API 契约测试。
3. 模板管理页面。
4. 渠道管理列表及新增/编辑抽屉。
5. 域名约束、静态页运行配置契约和探测。
6. 渠道统计汇总、日明细、补录和导出。
7. 权限、异常、全量类型检查、构建和人工验收。

本设计只授权后续编写实施计划，不授权当前阶段直接开发页面或后端。

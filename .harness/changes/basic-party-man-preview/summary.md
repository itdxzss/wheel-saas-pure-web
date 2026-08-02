# 基础约会-投男粉公开模板

## 目标

- 新增 `basic_party_man`（基础约会-投男粉）公开落地页，并沿用推广码动态分流。
- 复用约会二代的手机号、国家选择、配对会话、轮询状态和 WhatsApp 引导流程。
- 登录成功后提供匹配列表、个人资料和消息页的完整前端演示流程。

## 影响模块

- `src/views/buyer/basic-party-man-preview/`：新增模板页面、局部组件、状态模型和定向测试。
- `src/views/buyer/public-promotion/`：将 `basic_party_man` 映射到新公开模板入口。
- `src/views/buyer/template/`：模板管理预览弹窗支持基础约会-投男粉首页预览。

## 关键决策

- 不新建登录或请求实现，统一复用 `usePublicPromotionPairing`、`DateV2LoginDialog`、`DateV2PairingDialog` 和 `DateV2WhatsAppGuideDialog`。
- 主题色、目标国家、预选区号和底部应用下载开关均读取渠道运行时配置。
- 页面交互状态由纯 TypeScript 状态机维护，落地页、列表、资料和消息拆成局部组件，避免单文件过大。
- 演示资料只存在于模板页面域内，不进入生产接口或公共组件；后续可替换为真实会员数据接口。
- 不修改 pure-admin 布局、公共路由壳、Element Plus 基础组件或现有模板页面逻辑。

## 验证结果

- 定向状态与模板解析测试：5 项通过。
- `pnpm typecheck`：通过。
- 新增模板范围的 ESLint、Stylelint：通过。
- `pnpm build -- --logLevel error`：通过，生产构建产物约 3.93 MB。

## 遗留风险

- 匹配列表与资料当前为模板内演示数据；真实会员数据和消息接口接入后需替换。
- 登录成功页面依赖后端配对状态返回 `SUCCEEDED`，测试环境需保证公开配对接口可用。

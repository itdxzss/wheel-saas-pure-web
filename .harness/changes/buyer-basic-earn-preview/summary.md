# 基础领奖推广落地页

## 目标

- 复用约会二代的独立静态入口和公开运行配置接口，为 `basic_earn` 模板提供领奖落地页。
- 页面覆盖动态现场评论、国家手机号校验、配对码、复制成功提示和 WhatsApp 操作引导。
- 主题色、目标国家、预选国家和底部应用下载开关继续由渠道运行配置驱动。

## 模板分流

独立入口先请求：

```text
GET /api/public/promotion-channels/runtime/{channelCode}
```

再根据 `templateCode` 选择页面：

- `base_sex2` / `DATE_V2`：约会二代。
- `basic_earn` / `BASIC_EARN`：基础领奖。

未知模板显示不可用，不加载管理后台路由、菜单、store 或权限逻辑。

独立入口同时接受两种安全路径格式：

```text
/渠道推广码
/渠道推广码/数字裂变标识
```

裂变链接仍使用第一段渠道推广码查询运行配置，因此约会二代和基础领奖均可复用；第二段仅允许 1～32 位数字，其他层级或字符会被拒绝。

## WhatsApp 登录接口预留

手机号点击继续后的接口尚未提供，前端以独立事件边界预留，建议复用约会二代契约：

```ts
interface PublicWhatsAppPairingPayload {
  channelCode: string;
  countryCode: string;
  dialCode: string;
  phone: string;
}

interface PublicWhatsAppPairingResult {
  requestId: string;
  pairingCode: string;
  expiresInSeconds: number;
}
```

当前仅展示 `1111-1111` 和 10 秒重发倒计时，不请求虚构后端地址；接口确认后替换该演示状态即可。

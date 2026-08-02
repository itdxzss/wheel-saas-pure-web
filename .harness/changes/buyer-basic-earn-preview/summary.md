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

## WhatsApp 登录流程

手机号继续后复用公开推广模板统一配对流程：

```text
POST /api/public/promotion-channels/{channelCode}/pairing-sessions
GET  /api/public/promotion-pairing-sessions/status
```

状态轮询、失败重试和销毁清理由
`src/views/buyer/public-promotion/composables/usePublicPromotionPairing.ts` 统一负责；
基础领奖目录仅维护自身弹窗视觉和成功后的业务页面。

## 登录成功后的页面状态

登录状态进入 `SUCCEEDED` 后，基础领奖模板按以下局部状态流展示：

```text
最后一步提示
  → 奖励解锁页
    → 链接另一个账户 → 返回首页并打开手机号登录框
    → 取消配对/解除绑定设备 → 关联设备列表
      → 设备详情 → 登出确认 → 返回基础领奖首页
```

- 主题强调色继续读取渠道运行配置的 `themeColor`。
- 奖励解锁页的应用下载区域继续受 `showAppDownload` 控制。
- 设备列表、设备详情和登出确认均为基础领奖模板私有组件，不修改管理后台、公共路由或约会二代页面。
- 当前登出确认只清理前端配对状态并返回首页；后端提供公开登出接口后，应在 API 层接入再完成跳转。

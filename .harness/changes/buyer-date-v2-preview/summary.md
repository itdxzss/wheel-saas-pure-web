# 约会二代落地页预览

## 目标

- 为“约会二代”模板提供独立免登录静态入口和开发期预览页。
- 覆盖落地页、手机号登录、国家选择与校验、聊天、入群和分享流程。
- 主题色和底部应用下载区域由运行配置驱动；后端接口未完成前使用查询参数预览。
- 渠道列表中的推广、裂变链接点击后复制，不发生页面跳转。

## 边界

- `date-v2.html` 是独立 Vite 构建入口，不加载管理后台路由、菜单、store 和权限逻辑。
- 管理后台预览路由仍仅在 `import.meta.env.DEV` 下注册，不进入生产菜单。
- mock 数据放在项目根目录 `mock/`，不作为生产接口兜底。
- 不修改布局和公共 UI 组件；页面使用 Element Plus 现有弹窗、抽屉、表单组件。

## 后端接入点

模板分页接口的 `supportedParams[].code` 是渠道表单的能力来源。目前识别：

- `themeColor`：展示并提交主题色。
- `showAppDownload`：展示并提交底部应用下载开关。

渠道新增、详情、编辑接口需要读写这两个同名字段；不支持某参数的模板，前端不会提交该字段。

公共运行配置使用：

```text
GET /api/public/promotion-channels/runtime/{channelCode}
```

最小响应为：

```ts
interface BuyerChannelRuntimeConfig {
  templateCode: string;
  themeColor: string;
  showAppDownload: boolean;
  targetCountry: string;
  preselectedCountry: string;
}
```

域名由 Nginx 转发到后端校验，不由前端传参。约会二代页面当前接受模板编码 `base_sex2`，并兼容 `DATE_V2`。运行配置失败时显示不可用状态，不使用 mock 兜底。

Nginx 仅对单段推广码路径内部返回独立页面，浏览器地址保持 `域名/推广码`：

```nginx
location ~ ^/[A-Za-z0-9_-]{6,32}/?$ {
    try_files /date-v2.html =404;
}
```

`/api/`、`/static/` 和管理后台 `location /` 需要保留独立规则；后端公共运行接口继续用 `X-Forwarded-Host` 校验域名和推广码绑定关系。

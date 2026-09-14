# 图片链接卡片

- 需求：营销消息新增可点图跳转的独立类型。
- 实现：消息类型 IMAGE_LINK，API linkMode=4；图片、标题、有效 HTTP(S) 推广链接必填。素材列表筛选、创建/编辑、任务修改素材、共享剧本编辑器均识别新类型。
- 图片链接卡片独立预览，图片和标题区使用经过验证的 HTTP(S) 链接；普通图文和按钮类型不变。链接校验抽到 domain/link-validation.ts，供多处表单与预览复用，避免预览组件加载整个页面的 API/状态依赖。
- 数据及协议设计：同级 armada/docs/business/marketing-image-link.md。旧类型值 1/2/3 不变；后端新增 4 后再发布前端。
- 验证：134 项前端聚焦测试通过；typecheck、改动文件 ESLint、构建通过。本地真实组件静态预览显示新类型，点击图片卡片打开 https://example.com/card。该页面使用独立本地示例数据，不调用线上 API。
- 截图：/private/tmp/marketing-image-link-preview.png。
- 尚未提交、部署；WhatsApp Web/iPhone 收件端点击行为待实际发送验收。

# 通讯录 LID 超链实现

沿用现有页面，默认间隔暂为 5–10 秒，可配置 0.1–60 秒，由协议控制实际发送。去掉自动重试输入，新增联系人分页明细、LID、送达/已读与停止原因。既有抽屉样式移到同目录 CSS，保持 Vue 文件在 600 行内。

完整跨仓变更、数据库/API 契约、验证和待办见[后端变更记录](/Users/daishuaishuai/IdeaProjects/contact-lid-implementation/armada/.harness/changes/contact-lid-hyperlink/summary.md)。当前仅本地实现，未部署或真号发送。

# 账号分组互聊

2026-11-05，`1.0.3-snapshot`。离线开发和前端专项复核完成；离线阶段没有部署或发送真实消息。

## 实现

账号列表增加“互聊”入口与抽屉，分组选择复用 `MutualContactGroupSelect`；接口 `/api/accounts/mutual-chat-tasks`，沿用账号查看/编辑权限。

- 表单支持 A/B 分组及文案，默认间隔 10 秒；校验间隔 1–3600、文案去首尾空白后 1–1000 字符。修改配置清除旧预览和请求键，创建响应丢失时保持请求键以便幂等重试。
- 进度和明细显示待发送、已提交、发送成功、失败、待确认、已取消、双向成功对数和发送方向。轮询随抽屉关闭/卸载停止。
- 停止与手动重试失败/待确认/已取消方向；重试先读取最新统计。待确认项弹出“该消息可能已经发出，重试可能让对方收到重复消息”，确认后才发送 `confirmUnknown=true`，取消不发请求。
- 后端在任务锁内复核该确认标志，页面读取统计后若新增待确认，会拒绝本次重试；再次点击后按最新统计提示，避免并发窗口漏提示。

新增 API、composable、抽屉、显示帮助函数与单测；账号列表和页面只接入入口。测试替身补充 `ElMessage.info` 以覆盖取消重试流程。

## 验证

实际执行且通过：

```sh
node --import tsx --import ./src/api/__tests__/node-test-alias.mjs --test src/views/account/index/composables/useMutualChats.test.ts src/views/account/index/composables/useMutualContacts.test.ts
npm run typecheck
npx eslint src/api/account-mutual-chat.ts src/api/__tests__/element-plus-test-double.ts src/views/account/index/composables/useMutualChats.ts src/views/account/index/composables/useMutualChats.test.ts src/views/account/index/mutual-chat-display.ts src/views/account/index/components/AccountMutualChatDrawer.vue src/views/account/index/components/AccountListTable.vue src/views/account/index/index.vue
npm run build
```

互聊与互加合计 **11 项测试通过**，覆盖默认值、输入校验、创建响应丢失、配置变化清预览、确认/免确认/取消重试。类型检查和涉及文件 ESLint 通过；生产构建完成（17.30 秒）。没有执行浏览器联调、全站 E2E 或真实发消息验收。

原始日志在 `/private/tmp/account-mutual-chat-20261105/frontend-*.log`。只读评审的重复风险确认窗口和测试缺口已补齐，复核无新阻断项。

## 提交交付范围

2026-11-05 用户授权本次提交并推送到 `origin/1.0.3-snapshot`；部署由用户稍后统一执行，本次不部署。提交仅包含互聊功能，其他会话的未提交修改保留在工作区。

账号列表和页面中的档位检测改动通过暂存片段排除。提交前在 HEAD 加互聊暂存内容的临时目录复验 typecheck、ESLint/Prettier/Stylelint 与构建；避免主工作区 lint-staged 的 stash 影响并行会话，提交使用已等价检查的快照，跳过该次自动暂存/格式化钩子。

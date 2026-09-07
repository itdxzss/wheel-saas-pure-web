# 独立剧本营销页面

首版本地实现和二次复核完成，用户已授权提交推送并部署 test1。旧营销页面没有改动。

## 范围

- /task/script-marketing：独立列表、创建/编辑与详情抽屉。
- 默认管理员和推手，可追加、复制、排序；账号和内容随发送项一起移动。
- 文字/链接、图文、按钮配置由业务人员填写，也可复制现有模板内容；素材复用现有选择和上传能力。
- 保存草稿后显式启动；启动后配置固定。支持暂停/人工接管、继续和关闭。
- 在途提示、每群进度、成功/失败/未知统计，以及逐项记录分页。
- 接口与按钮使用独立 tenant:script_marketing:view/create/edit/operate 权限，后端保留租户和任务创建人校验。

## 验证

- 主仓库二次复核修正详情及记录的响应乱序、读取失败残留旧任务内容；新增两项浏览器测试先失败后通过。当前浏览器测试共 3 项通过，表单 3 项、typecheck、局部 ESLint、build 通过。
- npm run typecheck：通过。
- 新文件局部 ESLint、Prettier：通过。
- npm run build：通过。
- node --import tsx --test src/views/task/script-marketing/form.test.ts：3 项通过。
- npx playwright test --config playwright.script-marketing.config.ts：1 项通过。使用本机 Chrome，全部业务 API 被测试夹具拦截，未触发真实发送；验证默认两项、追加第三人、调序及保存后的账号/消息对应关系。
- 预览截图由测试写入 test-results/script-marketing/\*/create.png（本地测试产物，不提交）。

## 对接与后续

后端 /api/script-marketing-tasks，V180 新建三张表及菜单；Web/Android 协议新增 script_marketing 来源。接口与状态细节见后端 docs/business/marketing-script-mvp-design.md。

真实测试环境联调、真实群发送验收及部署尚未运行。代码已从独立 worktree codex/script-marketing-20260907 同步到 wheel-saas-pure-web 主仓库工作目录，未暂存或提交；原 worktree 保留作备份。

二次复核修正保留在主仓库，原 worktree 是修正前备份。

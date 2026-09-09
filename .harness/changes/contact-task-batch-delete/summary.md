# 通讯录任务列表与批量删除

用户已确认在主仓库增加 ID、任务名称、本页多选删除。状态：本地实现及验证完成，未部署。

复用 API id/name，批量请求 POST /api/contact-tasks/batch-delete，权限 tenant:contact_task:delete。
仅未开始/已完成/已停止允许勾选，运行中和暂停需先停止；确认前冻结选中 ID，查询清空选择，删除后修正空页。
后端设计及最终验证见 armada/.harness/changes/2026-09-09-contact-task-batch-delete.md。
不变更数据库结构、Redis 或协议接口；只新增后端按钮权限迁移。尚未部署。
回滚时还原本任务代码即可，保留后端软删数据。

## 最终验证

- 132 项相关 Node 测试全部通过（API、页面契约、真实 composable 行为）。
- tsc、vue-tsc、定向 ESLint、Prettier、生产 Vite build 通过。
- 3 项本地 Playwright 测试通过：允许状态多选及取消/确认、末页删除回退、权限入口。
- 额外复核取消后勾选保留且复选框仍可操作，通过。
- 本地测试夹具和生产构建预览，无真实账号、发送或删除；截图 /tmp/contact-task-delete-list.png。
- 用户已追加授权提交、推送并部署 test1；另一会话的云端联系人修改未触碰。

# 图片素材分组与业务隔离（2026-09-12）

状态：代码已提交推送并部署第一套 test1（2026-09-12）。分支 1.0.3-snapshot。

用户已确认历史图片两边均可见，新上传按超链/养群分开。

## 页面行为

- 超链图片管理页固定 HYPERLINK；剧本素材库新增“管理养群图片”入口，管理页面与剧本编辑器图片选择器固定 SCRIPT。
- 所有列表、标签、预览、上传、修改、删除、分组及移组请求都携带当前业务范围；历史图片展示“历史共享”。
- 全部 / 未分组 / 指定分组可与名称、标签组合筛选。支持创建空分组、批量移组，上传默认当前分组。
- 分组按业务独立；同一历史图片可在两边各自分组。删除分组有确认，仅解除当前分组归属，图片及引用保留。
- 超链使用现有 resource_asset 权限；养群使用 script_marketing 权限，创建/编辑/删除各自控制。

## 契约与边界

同级 armada 新增 V189、V190；assetScope=null 为历史，1 超链，2 养群。分组归属使用 tenant_id + file_id + scope 关系，groupId=0 查询未分组、省略查询全部。新绑定也校验图片业务。历史对象的名称、标签及删图状态仍共享；已有引用保持。

本次隔离图片素材，未拆分普通营销与养群消息模板集合。后端已完成 test1 迁移；真实登录态页面交互未验收，浏览器借用被用户取消。

## 验证

- 素材领域测试 4 项通过；tsc + vue-tsc 全项目检查通过；定向 ESLint / Stylelint 通过。
- production build、Playwright 本地夹具测试 4 项通过：分组创建/移动/筛选/取消删除/确认删除/图片保留，上传指定分组，edit-only 权限，养群入口查询/创建/上传均传 SCRIPT。
- 浏览器使用本地 API 夹具和图片；不作为真实环境验收证据。构建产物使用 /tmp/resource-asset-groups-e2e-dist，测试后预览服务退出。
- 输出：/tmp/resource-asset-scope-e2e.log、/tmp/resource-asset-scope-typecheck.log、/tmp/resource-asset-scope-lint.log、/tmp/resource-asset-scope-stylelint.log。

pnpm 本地脚本触发依赖重装检查后因无 TTY 中断，未清理 node_modules 或改锁文件；使用现有 node_modules/.bin 工具验证。其他会话修改保留。

部署代码 commit：fd619c53；运行 Nginx 中 554 个静态文件摘要与构建一致。后端 7130b386、Flyway V189/V190 和只读深度检查通过。详见同级 armada 的 .harness/changes/resource-asset-groups/deployment.md。本记录的后续提交仅更新文档，无需重新部署。

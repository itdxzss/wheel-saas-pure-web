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

## 2026-09-12 按钮布局调整

用户指出“管理分组”夹在筛选条件之间。现将分组/名称/标签/重置连续放左侧，“管理分组”和“批量上传”并排放右侧；窄屏自动换行。超链和养群复用此布局，业务和权限规则保持原有行为。

代码 37dd646e 已推送并通过 --env test1 --fe 部署第一套环境。定向 ESLint/Stylelint、4 项本地浏览器交互与 production build 通过，已查看本地渲染截图。主工作区另一个在途群列表测试存在类型报错，保持原样；从 37dd646e 建立的独立干净发布工作树通过 tsc + vue-tsc 全项目检查，发布未包含其他群列表在途修改。

部署退出 0；Nginx running、restart=0；页面入口及匹配本次工具栏的 JS/CSS 在容器和公网 HTTP 的 SHA256 与本地构建一致。证据：/tmp/resource-asset-toolbar-e2e.log、/tmp/test1-asset-toolbar-deploy.log、/tmp/test1-toolbar-verification.log。未借用用户浏览器或改动真实素材。

## 2026-09-12 分组素材数量

分组下拉和管理弹窗显示“分组名（数量）”，移组、上传及素材选择器复用相同标签。数量由后端 GET /groups 返回 assetCount，按当前租户和业务统计未删除素材；历史共享图片按业务各自归属计数，不受搜索、标签或分页影响。新分组返回 0，上传、移组及删图后刷新数量。无需数据库迁移。

后端 ResourceAsset*Test 37 项通过（含 H2 Mapper 20 项），新增计数测试覆盖空组、历史双边独立归属、移组、删除、异常跨业务/跨租户关系。前端定向 ESLint/Stylelint、隔离提交版本 tsc/vue-tsc 均通过；4 项本地 Playwright 回归通过，覆盖数量刷新及业务隔离。本地夹具验证不等同于测试环境登录态 API 联调。

代码提交：后端 428b7873，前端 f708d008，均已推送 1.0.3-snapshot。第一套 test1 发布与产物核对结果另见 count-deployment.md。

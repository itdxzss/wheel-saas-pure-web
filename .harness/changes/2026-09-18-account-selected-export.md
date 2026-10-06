# 账号勾选原格式导出

- 主工作区直接修改；保留互存、分组标签等其他在途修改。
- 批量菜单新增“导出账号并移除”“账号导出记录”；复用列表选中行，表头全选仅当前页。
- 业务人员先批量离线。前端拒绝非离线选择，后端独立复核；此功能不调用任何下线接口。
- 创建时冻结 ID 和 UUID，失败重试复用编号。ZIP 完整接收并触发下载保存后回执，后台完成账号移除；下载失败不回执，历史记录可重下载/取消。
- 新 API 在 `src/api/account-export.ts`；交付顺序在 `account-credential-export.ts`；UI 独立 `AccountExportDrawer.vue`。
- 29 项相关测试通过；TypeScript/vue-tsc、触及文件 ESLint、Vite build 通过。构建输出 `/tmp/account-export-web-build`，未覆盖已有 dist。pnpm 自动检查失败后使用已安装 node_modules 工具，未重装依赖。
- 需要后端 V204 与新 API。未提交、未推送、未部署；未在真实浏览器账号上做导出删除验收。

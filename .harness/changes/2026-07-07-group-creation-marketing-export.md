# 变更记录：建群营销任务导出

- 日期 / 分支: 2026-07-07 / 1.0.1-snapshot
- 需求来源: 用户要求建群营销任务列表支持多选导出
- 状态: 进行中

## 目标

在建群营销任务列表新增多选和导出按钮，按选中任务下载后端生成的 xlsx。

## 范围
- In scope: 建群营销任务 API、列表表格、页面 composable、下载触发。
- Out of scope: 导出文件内容生成、权限菜单变更。

## 影响模块
- 路由: 无
- 页面: `src/views/task/group-creation-marketing/`
- API: `src/api/group-creation-marketing.ts`
- Store: 无
- 权限: 无

## 关键设计决策
导出接口返回 xlsx blob 附件，前端按账号导入的附件下载模式处理 `Content-Disposition` 文件名并触发浏览器下载。

## 验证
```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/vue-tsc --noEmit --skipLibCheck
```
结果：均通过。

`pnpm exec tsx ...` 当前被 corepack 拉取 `pnpm/latest` 阻塞，网络受限报 `getaddrinfo ENOTFOUND registry.npmjs.org`。

## 人工验收
- [ ] 菜单进入页面
- [ ] 刷新页面不丢路由
- [ ] 查询 / 重置
- [ ] 分页
- [ ] 选择单个/多个任务
- [ ] 点击导出下载 xlsx
- [ ] 错误态

## 遗留 / 跟进
在 pnpm/tsx 可用环境运行新增 node:test 测试。

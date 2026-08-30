# 变更记录：超链市场分析前端

- 日期：2026-08-30
- 目标分支：`codex/hyperlink-strategy-analysis-20260830`
- 状态：前端实现与口径校正完成，待集成环境数据验收

## 范围

- 支持按日与按小时查询，分别限制最大 90 天与 7 天，并提供快捷时间范围。
- 支持任务类型、发信/被营销国家、账号类型、设备系统与短链接状态筛选。
- 展示 8 个核心 KPI：发送、单钩、双钩、访问率、点击 UV、使用号数、号均、封号/封号率。
- 国家对主表可展开查看每日/每小时明细；趋势图汇总发送、单钩、封号与号均。
- 顶部 KPI 使用后端独立 `overview`，不再把国家对的使用号数和封号数直接累加。
- 国家候选随当前日/小时时间范围刷新；近 24 小时快捷范围固定为 24 个整点桶。
- 补充 `HyperlinkAnalysis` 异步路由与 `tenant:hyperlink_analysis:view` 权限预览。

## 契约边界

- 仅调用 `GET /api/hyperlink-tasks/marketing-stats` 与 `GET /api/hyperlink-tasks/marketing-stats/countries`，两者使用同一时间范围。
- 查询字段全部使用 camelCase；设备系统为 `deviceOs=android|iphone`，短链接为 `shortLinkEnabled`。
- 日粒度日期格式为 `yyyy-MM-dd`，小时粒度格式为 `yyyy-MM-dd HH:mm:ss`。
- 不接入 market accounts 或 export 端点，页面不提供虚假的账号明细/导出能力。

## 验证

- 本次 API、日期窗口、精确 overview 与页面聚焦测试：8/8 通过；原有路由测试保持在集成分支既有提交中。
- `tsc --noEmit`：通过。
- `vue-tsc --noEmit --skipLibCheck`：通过。
- 变更文件 ESLint 和 Stylelint：通过。
- Vite 生产构建：通过（12.87s）。
- 全量 `node --import tsx --test "src/**/*.test.ts"` 受基线测试运行器影响：多个既有 API 测试导入 `nprogress.css` 时触发 `ERR_UNKNOWN_FILE_EXTENSION`，且既有群组页静态断言失败；本次聚焦测试不经该全量入口。

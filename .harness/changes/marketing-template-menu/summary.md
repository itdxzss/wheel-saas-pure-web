# 营销模版菜单迁移

## 目标
- 将旧 SaaS 前端的「营销模版」菜单迁移到 pure-admin-thin 新项目。
- 保持菜单、路由、权限语义与 wheel 旧项目一致。

## 旧页面与新页面
- 旧菜单 key：`task_marketing`
- 旧路径：`/task/marketing`
- 旧页面：`wheel-saas-web/src/views/marketing-template/MarketingTemplateList.vue`
- 新路径：`/task/marketing`
- 新页面：`src/views/material/marketing-template/index.vue`

## 菜单与权限
- 一级菜单：素材管理
- 二级菜单：营销模版
- `module_key`：`marketing_template`
- `perm_key`：`tenant:marketing_template:view`

## 关键决策
- 业务域目录使用 `.harness` 固定的 `src/views/material/`，不新增 `marketing/` 顶层域。
- 列表页使用 `RePureTableBar`、`ElTable`、项目现有 `WheelPagination`（内部为 `ElPagination`）。
- 抽屉使用局部组件拆分：`MarketingTemplateDrawer.vue` 负责编排，`MarketingTemplatePreview.vue`
  负责 WhatsApp 接收效果预览，`MarketingButtonEditor.vue` 负责最多 3 个按钮编辑。
- 基础控件使用 Element Plus，不迁移旧页面自绘 drawer/table/select。
- 本次不伪造营销模版 API 数据；保存、复制、删除先给出可见提示，后续接入真实 `src/api`。

## 验证项
- `node scripts/verify-marketing-template-menu.mjs` 通过。
- `npm run typecheck` 通过。
- 定向 `eslint --max-warnings 0` 通过。
- `npm run build` 通过。
- 浏览器打开 `/task/marketing`，搜索区、列表列、列设置、分页、批量按钮可见。
- 新增营销模版抽屉可打开，基础信息、内容设置、图片上传、推广链接和 WhatsApp 预览可见。
- 左侧预览已改为手机壳 / WhatsApp 顶栏 / 聊天消息卡片结构，对齐旧系统的手机展示方式。
- 切换到按钮超链后，默认 3 个按钮、按钮类型、动作说明、按钮文字、电话号码/复制内容/说明字段可见。
- 右侧填写模版名称、内容、文本、推广链接后，左侧 WhatsApp 预览实时刷新。
- 选择营销主图后，通过本地 `ObjectURL` 写入表单 `imageUrl`，右侧缩略图和左侧营销主图预览使用同一数据源同步展示。

## 遗留风险
- 真实列表、保存、复制、删除、图片上传尚未接入 API。
- 旧页面 WhatsApp 预览和最多 3 个按钮的完整编辑能力只迁移了基础入口，后续接 API 时再补齐。

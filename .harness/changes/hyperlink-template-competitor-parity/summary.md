# 变更记录：超链营销模板编辑器竞品对齐

- 日期：2026-08-30
- 目标分支：`1.0.3-snapshot`
- 状态：实现与本地渲染验收完成，未部署

## 目标

以本地可读的 `hylbuiaxykfrontendsource` 编译产物为竞品行为证据，将“新建/编辑超链模板”对齐为三种消息的实时 WhatsApp 预览编辑器，同时保持 Armada 已有 API 合同与素材库权限边界。

## 竞品证据台账

- `../hylbuiaxykfrontendsource/readable/assets/templates-BLWMxusB.js`：消息类型 1/3/4、默认普通按钮、三种字段顺序、默认 CTA、切换类型补齐逻辑、编辑抽屉布局。
- `../hylbuiaxykfrontendsource/readable/assets/templates-C8Wi3jMM.css`：360px 粘性预览栏、双栏间距、编号分区、响应式折叠。
- `../hylbuiaxykfrontendsource/readable/assets/hyperlink-button-editor-CcRhevR2.js`：单个 URL 按钮、30 字按钮文案、深度追踪开关、解释和风险提示。
- `../hylbuiaxykfrontendsource/readable/assets/wa-message-preview-BT1QVqmo.js`：单图文、普通按钮、卡片按钮的差异化 WhatsApp 消息结构。

## 内部合同证据

- `../armada/armada-api/src/main/java/com/armada/hyperlink/template/service/HyperlinkMessageContentValidator.java`：后端已支持 1/3/4；按钮消息必须恰好 1 个 CTA URL；按钮文案上限 30；`useShortLink` 必须显式布尔；单图文图片必填，按钮图片可选。
- `src/views/hyperlink/library/components/ResourceAssetPicker.vue`：已有可绑定 JPG 素材的选择和批量上传流程，无需新建第二套上传 API。

## 实施清单

- [x] 调整默认类型、类型顺序、默认 CTA 和前后端字段长度一致性。
- [x] 重构抽屉为自定义标题、粘性实时预览、编号分区和按消息类型动态排序。
- [x] 将深度追踪改为按钮内联设置，补齐解释和风险提示。
- [x] 将预览改为真机框架，并分别渲染单图文、普通按钮和卡片按钮。
- [x] 恢复模板列表页 16px 页面节奏，并将独立统计卡片收敛为竞品式“当前条件汇总”紧凑条。
- [x] 将模板编辑器的消息类型控件收窄为 312px 紧凑分段按钮，小屏时再自适应撑满。
- [x] 补充领域/页面合同测试，通过格式化、类型检查、样式检查和生产构建。

## 安全与边界

- 只做本地静态分析，不执行竞品编译产物，不读取、复制或记录凭据。
- 只复制产品行为和信息架构，实现使用 Armada 自有 Vue/Element Plus 组件和 API 合同。

## 验证

- 超链模板领域、Object URL 生命周期和页面合同定向测试：12 条通过，0 失败。
- `pnpm typecheck`：通过。
- 本次 TypeScript/Vue 文件 ESLint：通过。
- 本次 Vue 文件 Stylelint：通过。
- `git diff --check`：通过。
- `pnpm build`：生产构建通过，总产物 5.39 MB。
- 模板列表页本地宽屏验收（1920×1080）：页面四周 16px，Hero、条件汇总、筛选、表格四段间距均为 16px；条件汇总条高度 37px。
- 模板编辑器本地宽屏验收：表单宽度 735px，消息类型控件宽度 312px，三个选项各 104px；三种类型切换时宽度不变。
- 本地浏览器渲染验收：默认普通按钮；卡片按钮显示副标题、卡片正文和按钮配置；单图文显示预览图、链接描述和推广链接且不显示按钮配置；1024px 宽度下编辑器自动折叠为上下布局。
- `pnpm test`：仓库全量命令未通过；失败来自现有 Node 23 测试环境直接导入 `nprogress.css` 的 `ERR_UNKNOWN_FILE_EXTENSION`，以及与本次无关的既有群成员静态合同断言。本次定向测试单独执行通过。

## 部署

- 未部署；推送仍等待用户确认远端目标。
